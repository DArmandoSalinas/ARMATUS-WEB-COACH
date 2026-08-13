import type { Exercise, Routine } from "./types";

export type PublishProgress = (msg: string) => void;

async function uploadImage(
  routineId: string,
  exerciseId: string,
  dataUrl: string,
): Promise<string> {
  const res = await fetch("/api/routines/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ routineId, exerciseId, dataUrl }),
  });
  const data = (await res.json()) as { error?: string; url?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "No se pudo subir una imagen.");
  }
  return data.url;
}

/**
 * Upload images one-by-one, then publish lean JSON.
 * Avoids Vercel 4.5MB body limit on a single request.
 */
export async function publishRoutineClient(
  routine: Routine,
  onProgress?: PublishProgress,
): Promise<{ ok: boolean; error?: string; url?: string }> {
  try {
    const withData = routine.exercises.filter((ex) =>
      ex.imageDataUrl?.startsWith("data:"),
    );
    const uploaded = new Map<string, string>();
    let done = 0;
    const pending = [...withData];
    let nextIdx = 0;
    const workers = Array.from(
      { length: Math.min(2, pending.length) },
      async () => {
        while (true) {
          const i = nextIdx++;
          if (i >= pending.length) return;
          const ex = pending[i];
          const dataUrl = ex.imageDataUrl;
          if (!dataUrl?.startsWith("data:")) return;
          const url = await uploadImage(routine.id, ex.id, dataUrl);
          uploaded.set(ex.id, url);
          done += 1;
          onProgress?.(`Subiendo boceto ${done}/${pending.length}…`);
        }
      },
    );
    await Promise.all(workers);

    const exercises: Exercise[] = routine.exercises.map((ex) => {
      const remote = uploaded.get(ex.id);
      return remote ? { ...ex, imageDataUrl: remote } : ex;
    });

    onProgress?.("Publicando rutina…");
    const lean: Routine = { ...routine, exercises };
    const res = await fetch("/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routine: lean }),
    });
    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok) {
      return { ok: false, error: data.error || "No se pudo publicar." };
    }

    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/rutina/${routine.id}`
        : `/rutina/${routine.id}`;
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red al publicar.",
    };
  }
}

export async function fetchPublishedRoutine(
  id: string,
): Promise<Routine | null> {
  try {
    const res = await fetch(`/api/routines/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { routine?: Routine };
    return data.routine ?? null;
  } catch {
    return null;
  }
}
