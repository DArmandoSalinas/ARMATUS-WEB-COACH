import { get, head, put, type BlobAccessType } from "@vercel/blob";
import type { Exercise, Routine } from "./types";

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function preferredAccess(): BlobAccessType {
  const raw = process.env.BLOB_ACCESS?.trim().toLowerCase();
  return raw === "private" ? "private" : "public";
}

function accessOrder(): BlobAccessType[] {
  return preferredAccess() === "private"
    ? ["private", "public"]
    : ["public", "private"];
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

async function putWithAccess(
  pathname: string,
  body: Buffer | string,
  contentType: string,
): Promise<{ url: string; pathname: string; access: BlobAccessType }> {
  let lastErr: unknown;
  for (const access of accessOrder()) {
    try {
      const blob = await put(pathname, body, {
        access,
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
        multipart: typeof body !== "string" && body.byteLength > 4_000_000,
      });
      return { url: blob.url, pathname: blob.pathname, access };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("No se pudo subir a Vercel Blob.");
}

function publicOrProxyUrl(
  access: BlobAccessType,
  pathname: string,
  url: string,
): string {
  if (access === "public") return url;
  return `/api/blob?p=${encodeURIComponent(pathname)}`;
}

function rewritePrivateImageUrls(routine: Routine): Routine {
  return {
    ...routine,
    exercises: routine.exercises.map((ex: Exercise) => {
      const src = ex.imageDataUrl;
      if (!src || src.startsWith("/") || src.startsWith("data:")) return ex;
      if (!src.includes("blob.vercel-storage.com")) return ex;
      try {
        const u = new URL(src);
        const p = decodeURIComponent(u.pathname.replace(/^\//, ""));
        return {
          ...ex,
          imageDataUrl: `/api/blob?p=${encodeURIComponent(p)}`,
        };
      } catch {
        return ex;
      }
    }),
  };
}

/** Upload one exercise image (keeps serverless body under Vercel limits). */
export async function publishExerciseImage(params: {
  routineId: string;
  exerciseId: string;
  dataUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!blobConfigured()) {
    return {
      ok: false,
      error:
        "Falta BLOB_READ_WRITE_TOKEN. En Vercel Blob marca “Add a read-write token”.",
    };
  }
  try {
    const parsed = dataUrlToBuffer(params.dataUrl);
    if (!parsed) return { ok: false, error: "Imagen inválida." };
    const ext = parsed.contentType.includes("jpeg") ? "jpg" : "png";
    const pathname = `routines/${params.routineId}/ex-${params.exerciseId}.${ext}`;
    const uploaded = await putWithAccess(
      pathname,
      parsed.buffer,
      parsed.contentType,
    );
    return {
      ok: true,
      url: publicOrProxyUrl(uploaded.access, uploaded.pathname, uploaded.url),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo subir la imagen.";
    console.error("[remoteRoutine] image publish failed", err);
    return { ok: false, error: message };
  }
}

/** Upload lean routine JSON (images already replaced by remote URLs). */
export async function publishRoutineJson(routine: Routine): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  if (!blobConfigured()) {
    return {
      ok: false,
      error:
        "Falta BLOB_READ_WRITE_TOKEN. En Vercel Blob marca “Add a read-write token”.",
    };
  }

  if (routine.exercises.some((ex) => ex.imageDataUrl?.startsWith("data:"))) {
    return {
      ok: false,
      error: "Quedan imágenes locales sin subir. Reintenta Compartir.",
    };
  }

  try {
    const payload: Routine = {
      ...routine,
      updatedAt: new Date().toISOString(),
    };
    const uploaded = await putWithAccess(
      `routines/${routine.id}.json`,
      JSON.stringify(payload),
      "application/json",
    );
    return { ok: true, url: uploaded.url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo publicar la rutina.";
    console.error("[remoteRoutine] json publish failed", err);
    return { ok: false, error: message };
  }
}

export async function fetchRemoteRoutine(
  id: string,
): Promise<Routine | null> {
  if (!id.trim() || !blobConfigured()) return null;
  const pathname = `routines/${id}.json`;

  for (const access of accessOrder()) {
    try {
      const result = await get(pathname, { access, useCache: false });
      if (!result || result.statusCode !== 200 || !result.stream) continue;
      const text = await new Response(result.stream).text();
      const data = JSON.parse(text) as Routine;
      if (!data?.id || !Array.isArray(data.exercises)) continue;
      return access === "private" ? rewritePrivateImageUrls(data) : data;
    } catch {
      /* try next */
    }
  }

  try {
    const meta = await head(pathname);
    if (!meta?.url) return null;
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Routine;
    if (data?.id && Array.isArray(data.exercises)) return data;
  } catch {
    /* ignore */
  }

  return null;
}

export async function readBlobStream(pathname: string): Promise<{
  stream: ReadableStream;
  contentType: string;
} | null> {
  if (!blobConfigured() || !pathname) return null;
  for (const access of accessOrder()) {
    try {
      const result = await get(pathname, { access });
      if (!result || result.statusCode !== 200 || !result.stream) continue;
      return {
        stream: result.stream,
        contentType: result.blob.contentType || "application/octet-stream",
      };
    } catch {
      /* try next */
    }
  }
  return null;
}
