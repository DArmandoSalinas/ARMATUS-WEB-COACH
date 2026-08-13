/** Client fetch with a hard timeout so Generate / Revisar never looks dead. */
export const FETCH_TIMEOUT_MS = 115_000;

export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  const { timeoutMs = FETCH_TIMEOUT_MS, signal, ...rest } = init;
  const ctrl = new AbortController();

  if (signal) {
    if (signal.aborted) ctrl.abort(signal.reason);
    else {
      signal.addEventListener("abort", () => ctrl.abort(signal.reason), {
        once: true,
      });
    }
  }

  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    let data: T;
    try {
      data = (await res.json()) as T;
    } catch {
      throw new Error("El servidor respondió sin JSON válido.");
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if (isAbortError(err)) {
      throw new Error(
        "La operación tardó más de 2 minutos. Revisa la conexión e intenta de nuevo.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}
