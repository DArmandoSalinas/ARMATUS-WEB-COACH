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

export function isCoachVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.length > 1;
    if (host === "youtube.com") {
      return u.pathname === "/watch" || u.pathname.startsWith("/shorts/");
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
  return out.length ? out.slice(0, 3) : undefined;
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
  const stop = new Set([
    "con",
    "para",
    "por",
    "lado",
    "reps",
    "rep",
    "series",
    "ejercicio",
    "movilidad",
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
    "una",
    "uno",
    "and",
    "the",
    "with",
  ]);
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !stop.has(t));
}

/**
 * Only hip-mobility sub-drills share one coach video.
 * Shoulder IR and ER stay separate (each has its own URL).
 */
function shareGroupKey(name: string): string | null {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (
    /cadera|hip\s*mobility|abduc|desplante|lunge|lado a lado|side\s*to\s*side|piernas de un lado/.test(
      n,
    )
  ) {
    return "hip-mobility";
  }
  return null;
}

/**
 * Assign each coach YouTube URL using ONLY the prompt segment between
 * the previous URL and this one (so shoulder ER ≠ shoulder IR videos).
 */
export function attachSupportLinksFromPrompt(
  exercises: Exercise[],
  prompt: string,
): Exercise[] {
  const urls = extractYoutubeUrls(prompt).filter(isCoachVideoUrl);
  if (!urls.length) {
    return sanitizeExerciseSupportLinks(exercises, prompt);
  }

  const lower = prompt.toLowerCase();
  const assignments = new Map<string, string[]>(); // exerciseId → urls
  const urlPositions = urls
    .map((url) => ({ url, idx: lower.indexOf(url.toLowerCase()) }))
    .filter((u) => u.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  for (let i = 0; i < urlPositions.length; i++) {
    const { url, idx: urlIdx } = urlPositions[i];
    const prevEnd = i === 0 ? 0 : urlPositions[i - 1].idx + urlPositions[i - 1].url.length;
    const segment = lower.slice(prevEnd, urlIdx);

    let bestId: string | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const ex of exercises) {
      const tokens = [
        ...tokenize(ex.name),
        ...tokenize(ex.nameEn || ""),
      ];
      if (!tokens.length) continue;
      let hits = 0;
      let nearest = Number.POSITIVE_INFINITY;
      for (const token of tokens) {
        const idx = segment.lastIndexOf(token);
        if (idx < 0) continue;
        hits += 1;
        nearest = Math.min(nearest, segment.length - idx);
      }
      if (!hits) continue;
      // Prefer the name sitting next to the URL. Token-count used to steal
      // a Bear-plank short because "press / pecho / inclinado" hit more
      // times earlier in the same segment.
      const score = -nearest + hits;
      if (score > bestScore) {
        bestScore = score;
        bestId = ex.id;
      }
    }

    if (!bestId) continue;
    // One coach video per exercise (except hip siblings sharing below)
    if ((assignments.get(bestId) ?? []).length > 0) continue;
    assignments.set(bestId, [url]);

    // Share only among hip-mobility sub-drills under the same coach video.
    const owner = exercises.find((e) => e.id === bestId);
    if (!owner) continue;
    const group = shareGroupKey(owner.name);
    if (!group) continue;
    for (const ex of exercises) {
      if (ex.id === bestId) continue;
      if (shareGroupKey(ex.name) !== group) continue;
      if (
        !/calentamiento/i.test(ex.badge) &&
        !/calentamiento/i.test(owner.badge)
      ) {
        continue;
      }
      const sib = assignments.get(ex.id) ?? [];
      if (!sib.includes(url)) sib.push(url);
      assignments.set(ex.id, sib);
    }
  }

  const next = exercises.map((ex) => {
    const coachUrls = assignments.get(ex.id) ?? [];
    if (!coachUrls.length) {
      // Drop AI-invented coach videos that aren't in the prompt for this exercise
      const kept = (ex.supportLinks ?? []).filter((l) => {
        if (!isCoachVideoUrl(l.url)) return true;
        return false; // strip unassigned watch/shorts
      });
      return {
        ...ex,
        supportLinks: kept.length ? kept : undefined,
      };
    }
    return {
      ...ex,
      supportLinks: coachUrls.map((url) => ({
        label: "Video de técnica",
        url,
      })),
    };
  });

  return sanitizeExerciseSupportLinks(next, prompt);
}

export function youtubeSearchUrl(query: string): string {
  const q = query.trim().replace(/\s+/g, " ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} técnica ejercicio`)}`;
}

/**
 * Keep coach videos; only add a search link when the exercise has none.
 * Never mix another exercise's coach video in.
 */
export function ensureSupportSearchLinks(exercises: Exercise[]): Exercise[] {
  return exercises.map((ex) => {
    const links = ex.supportLinks ?? [];
    const hasCoachVideo = links.some((l) => isCoachVideoUrl(l.url));
    if (hasCoachVideo) {
      // Prefer only coach videos — drop redundant search links
      return {
        ...ex,
        supportLinks: links
          .filter((l) => isCoachVideoUrl(l.url))
          .map((l) => ({
            label: l.label?.trim() || "Video de técnica",
            url: l.url,
          }))
          .slice(0, 2),
      };
    }
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

/** Final pass: drop coach URLs that never appear in the source prompt. */
export function sanitizeExerciseSupportLinks(
  exercises: Exercise[],
  prompt: string,
): Exercise[] {
  const promptUrls = new Set(
    extractYoutubeUrls(prompt).map((u) => u.toLowerCase()),
  );
  return exercises.map((ex) => {
    const links = (ex.supportLinks ?? []).filter((l) => {
      if (!isAllowedSupportUrl(l.url)) return false;
      if (isCoachVideoUrl(l.url)) {
        return promptUrls.has(l.url.toLowerCase());
      }
      // search_query links must mention a token from the exercise name
      if (l.url.includes("search_query=")) {
        const tokens = tokenize(ex.name);
        const decoded = decodeURIComponent(l.url).toLowerCase();
        return tokens.some((t) => decoded.includes(t));
      }
      return true;
    });
    return {
      ...ex,
      supportLinks: links.length ? links.slice(0, 2) : undefined,
    };
  });
}
