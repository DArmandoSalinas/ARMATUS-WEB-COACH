/** Detect OpenAI billing / empty-credit failures (SDK or raw 429 text). */

export const OPENAI_CREDITS_MESSAGE =
  "Se acabaron los créditos de OpenAI. Recarga saldo en platform.openai.com → Billing y vuelve a intentar.";

export function errorText(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const extra = [
      err.message,
      (err as { code?: string }).code,
      (err as { status?: number }).status,
      (err as { error?: { message?: string; code?: string } }).error?.message,
      (err as { error?: { code?: string } }).error?.code,
    ]
      .filter(Boolean)
      .join(" ");
    return extra || err.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function isOpenAiCreditsError(err: unknown): boolean {
  const t = errorText(err).toLowerCase();
  return (
    t.includes("no credits remaining") ||
    t.includes("insufficient_quota") ||
    t.includes("insufficient quota") ||
    t.includes("exceeded your current quota") ||
    t.includes("billing_hard_limit") ||
    t.includes("se acabaron los créditos") ||
    t.includes("créditos de openai") ||
    t.includes("openai credits ran out") ||
    (t.includes("429") && (t.includes("credit") || t.includes("billing")))
  );
}

export function openaiRouteStatus(err: unknown): number {
  if (isOpenAiCreditsError(err)) return 402;
  const t = errorText(err);
  if (t.includes("OPENAI_API_KEY") || t.includes("FAL_KEY")) return 503;
  return 502;
}

export function openaiPublicMessage(err: unknown, fallback: string): string {
  if (isOpenAiCreditsError(err)) return OPENAI_CREDITS_MESSAGE;
  return err instanceof Error ? err.message : fallback;
}
