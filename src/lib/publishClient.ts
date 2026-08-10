import type { Routine } from "./types";

/** Best-effort cloud publish so shared /rutina/[id] links work. */
export async function publishRoutineClient(
  routine: Routine,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routine }),
    });
    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok) {
      return { ok: false, error: data.error || "No se pudo publicar." };
    }
    return { ok: true };
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
