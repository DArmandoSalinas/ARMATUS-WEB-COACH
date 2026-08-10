import type { Exercise, Routine } from "./types";

export type BocetoFillProgress = (msg: string) => void;

export type BocetoFillResult = {
  routine: Routine;
  failedNames: string[];
};

/**
 * Client-side: attach library/AI bocetos for exercises missing images.
 * Used after generate (server defers AI) and after revise.
 */
export async function fillMissingBocetos(
  previous: Routine | null,
  revised: Routine,
  onProgress?: BocetoFillProgress,
): Promise<BocetoFillResult> {
  const prevById = new Map(
    (previous?.exercises ?? []).map((ex) => [ex.id, ex]),
  );
  const failedNames: string[] = [];
  const exercises: Exercise[] = [];

  for (let i = 0; i < revised.exercises.length; i++) {
    const ex = revised.exercises[i];
    const prev = prevById.get(ex.id);
    const canReuse =
      !!prev?.imageDataUrl &&
      prev.name.trim().toLowerCase() === ex.name.trim().toLowerCase() &&
      prev.sketchCaption.trim().toLowerCase() ===
        ex.sketchCaption.trim().toLowerCase();

    if (canReuse) {
      exercises.push({ ...ex, imageDataUrl: prev!.imageDataUrl });
      continue;
    }

    // Already has a library path or prior AI payload
    if (ex.imageDataUrl) {
      exercises.push(ex);
      continue;
    }

    onProgress?.(
      `Generando boceto ${i + 1}/${revised.exercises.length}…`,
    );
    try {
      const res = await fetch("/api/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: {
            name: ex.name,
            nameEn: ex.nameEn,
            sketchCaption: ex.sketchCaption,
            intro: ex.intro,
            purpose: ex.purpose,
            muscles: ex.muscles,
            steps: ex.steps,
            commonMistakes: ex.commonMistakes,
          },
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        imageDataUrl?: string;
      };
      if (!res.ok) throw new Error(data.error || "Error de boceto");
      exercises.push({ ...ex, imageDataUrl: data.imageDataUrl });
    } catch {
      failedNames.push(ex.name);
      exercises.push(ex);
    }
  }

  return { routine: { ...revised, exercises }, failedNames };
}
