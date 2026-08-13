import { fetchJson } from "./http";
import type { Exercise, Routine } from "./types";

export type BocetoFillProgress = (msg: string) => void;

export type BocetoFillResult = {
  routine: Routine;
  failedNames: string[];
};

export type BocetoFillOptions = {
  /** Skip library matches and request a fresh AI drawing. */
  forceAi?: boolean;
  /** These exercise ids must be redrawn even if a previous image exists. */
  forceIds?: string[];
};

async function mapPool<T>(
  count: number,
  concurrency: number,
  worker: (index: number) => Promise<T>,
): Promise<T[]> {
  const results: T[] = new Array(count);
  let next = 0;
  const n = Math.min(Math.max(1, concurrency), Math.max(1, count));
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (true) {
        const i = next++;
        if (i >= count) return;
        results[i] = await worker(i);
      }
    }),
  );
  return results;
}

/**
 * Client-side: attach library/AI bocetos for exercises missing images.
 * Used after generate (server defers AI) and after revise.
 */
export async function fillMissingBocetos(
  previous: Routine | null,
  revised: Routine,
  onProgress?: BocetoFillProgress,
  opts?: BocetoFillOptions,
): Promise<BocetoFillResult> {
  const prevById = new Map(
    (previous?.exercises ?? []).map((ex) => [ex.id, ex]),
  );
  const forceIds = new Set(opts?.forceIds ?? []);
  const forceAll = opts?.forceAi === true && forceIds.size === 0;
  const failedNames: string[] = [];
  const exercises: Exercise[] = revised.exercises.map((ex) => ({ ...ex }));
  const pending: number[] = [];

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const prev = prevById.get(ex.id);
    const mustRegen = forceAll || forceIds.has(ex.id);

    if (!mustRegen && prev?.imageDataUrl) {
      exercises[i] = { ...ex, imageDataUrl: prev.imageDataUrl };
      continue;
    }
    if (!mustRegen && ex.imageDataUrl) continue;
    pending.push(i);
  }

  let completed = 0;
  if (pending.length > 0) {
    await mapPool(pending.length, 2, async (slot) => {
      const i = pending[slot];
      const ex = exercises[i];
      const mustRegen = forceAll || forceIds.has(ex.id);
      // Skip library when the coach asked to redraw this exercise.
      // Equipment/name changes without forceAi still allow a library match.
      const skipLibrary = mustRegen && opts?.forceAi === true;

      try {
        const { ok, data } = await fetchJson<{
          error?: string;
          imageDataUrl?: string;
        }>("/api/regenerate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            forceAi: skipLibrary,
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
        if (!ok || !data.imageDataUrl) {
          throw new Error(data.error || "Error de boceto");
        }
        exercises[i] = { ...ex, imageDataUrl: data.imageDataUrl };
      } catch {
        failedNames.push(ex.name);
        exercises[i] = mustRegen ? { ...ex, imageDataUrl: undefined } : ex;
      } finally {
        completed += 1;
        onProgress?.(`Generando boceto ${completed}/${pending.length}…`);
      }
    });
  }

  return { routine: { ...revised, exercises }, failedNames };
}
