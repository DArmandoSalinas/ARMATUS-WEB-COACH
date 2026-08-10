import { put, head } from "@vercel/blob";
import type { Exercise, Routine } from "./types";

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function dataUrlToBuffer(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
} | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return {
    contentType: m[1] || "image/png",
    buffer: Buffer.from(m[2], "base64"),
  };
}

async function publishExerciseImages(
  routine: Routine,
): Promise<Exercise[]> {
  return Promise.all(
    routine.exercises.map(async (ex) => {
      const src = ex.imageDataUrl;
      if (!src?.startsWith("data:")) return ex;
      const parsed = dataUrlToBuffer(src);
      if (!parsed) return { ...ex, imageDataUrl: undefined };
      const ext = parsed.contentType.includes("jpeg") ? "jpg" : "png";
      const blob = await put(
        `routines/${routine.id}/ex-${ex.id}.${ext}`,
        parsed.buffer,
        {
          access: "public",
          contentType: parsed.contentType,
          addRandomSuffix: false,
          allowOverwrite: true,
        },
      );
      return { ...ex, imageDataUrl: blob.url };
    }),
  );
}

/** Upload routine JSON (+ AI images) so /rutina/[id] works on other devices. */
export async function publishRoutine(routine: Routine): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  if (!blobConfigured()) {
    return {
      ok: false,
      error:
        "Falta BLOB_READ_WRITE_TOKEN. Conecta Vercel Blob al proyecto para compartir rutinas.",
    };
  }

  try {
    const exercises = await publishExerciseImages(routine);
    const payload: Routine = {
      ...routine,
      exercises,
      updatedAt: new Date().toISOString(),
    };
    const blob = await put(
      `routines/${routine.id}.json`,
      JSON.stringify(payload),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      },
    );
    return { ok: true, url: blob.url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo publicar la rutina.";
    console.error("[remoteRoutine] publish failed", err);
    return { ok: false, error: message };
  }
}

export async function fetchRemoteRoutine(
  id: string,
): Promise<Routine | null> {
  if (!id.trim()) return null;

  // Prefer direct public blob URL when token is present (same store)
  const candidates: string[] = [];
  if (blobConfigured()) {
    try {
      const meta = await head(`routines/${id}.json`);
      if (meta?.url) candidates.push(meta.url);
    } catch {
      // fall through to guess common public URL patterns below
    }
  }

  // Also try relative API-free fetch via store URL env if set
  const base = process.env.BLOB_STORE_BASE_URL?.replace(/\/$/, "");
  if (base) candidates.push(`${base}/routines/${id}.json`);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = (await res.json()) as Routine;
      if (data?.id && Array.isArray(data.exercises)) return data;
    } catch {
      // try next
    }
  }

  return null;
}
