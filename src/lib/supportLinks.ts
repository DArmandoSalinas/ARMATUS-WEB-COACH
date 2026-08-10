import type { Exercise, SupportLink } from "./types";

const YT_URL_RE =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=[\w-]+(?:[^\s)\]"']*)?|shorts\/[\w-]+|results\?search_query=[^\s)\]"']+)|youtu\.be\/[\w-]+)/gi;

function cleanUrl(raw: string): string {
  return raw.replace(/[),.]+$/g, "").trim();
}

export function isAllowedSupportUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.length > 1;
    if (host === "youtube.com") {
      return (
        u.pathname === "/watch" ||
        u.pathname.startsWith("/shorts/") ||
        u.pathname === "/results"
      );
    }
    return false;
  } catch {
    return false;
  }
}

export function normalizeSupportLinks(
  raw: unknown,
): SupportLink[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: SupportLink[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const url = String((item as { url?: unknown }).url ?? "").trim();
    if (!url || !isAllowedSupportUrl(url) || seen.has(url)) continue;
    seen.add(url);
    const label = String((item as { label?: unknown }).label ?? "").trim();
    out.push(label ? { label, url } : { url });
  }
  return out.length ? out.slice(0, 4) : undefined;
}

export function extractYoutubeUrls(text: string): string[] {
  const matches = text.match(YT_URL_RE) ?? [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const m of matches) {
    const url = cleanUrl(m);
    if (!isAllowedSupportUrl(url) || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4);
}

/**
 * Attach YouTube URLs found in the coach prompt to the closest exercise
 * (by proximity of the URL to the exercise name in the prompt text).
 */
export function attachSupportLinksFromPrompt(
  exercises: Exercise[],
  prompt: string,
): Exercise[] {
  const urls = extractYoutubeUrls(prompt);
  if (!urls.length) return exercises;

  const lower = prompt.toLowerCase();
  const claimed = new Set<string>();

  return exercises.map((ex) => {
    const existing = ex.supportLinks ?? [];
    const existingUrls = new Set(existing.map((l) => l.url));
    const tokens = [
      ...tokenize(ex.name),
      ...tokenize(ex.nameEn || ""),
    ];

    let bestUrl: string | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const url of urls) {
      if (claimed.has(url) || existingUrls.has(url)) continue;
      const urlIdx = lower.indexOf(url.toLowerCase());
      if (urlIdx < 0) continue;

      let score = Math.abs(urlIdx - lower.length / 2);
      for (const token of tokens) {
        const nameIdx = lower.indexOf(token);
        if (nameIdx < 0) continue;
        score = Math.min(score, Math.abs(urlIdx - nameIdx));
      }
      if (score < bestScore) {
        bestScore = score;
        bestUrl = url;
      }
    }

    if (!bestUrl || bestScore > 420) return ex;
    claimed.add(bestUrl);

    return {
      ...ex,
      supportLinks: [
        ...existing,
        { label: "Video de apoyo", url: bestUrl },
      ].slice(0, 4),
    };
  });
}

export function youtubeSearchUrl(query: string): string {
  const q = query.trim().replace(/\s+/g, " ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} técnica ejercicio`)}`;
}

/** Ensure every exercise has at least one searchable support link. */
export function ensureSupportSearchLinks(exercises: Exercise[]): Exercise[] {
  return exercises.map((ex) => {
    const links = ex.supportLinks ?? [];
    if (links.length > 0) return ex;
    const query = ex.nameEn?.trim() || ex.name.trim();
    if (!query) return ex;
    return {
      ...ex,
      supportLinks: [
        {
          label: "Buscar técnica en YouTube",
          url: youtubeSearchUrl(query),
        },
      ],
    };
  });
}
