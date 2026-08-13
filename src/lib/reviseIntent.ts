export type ChangeIntent = {
  /** Light, larger-type view for adults */
  wantsClaraView: boolean;
  /** Regenerar / corregir bocetos o imágenes */
  wantsNewBocetos: boolean;
  /** Cambios de texto, ejercicios, dosis, etc. */
  wantsContentChange: boolean;
};

const CLARA_RE =
  /versi[oó]n\s+clara|apariencia\s+clara|modo\s+claro|letra\s+m[aá]s\s+grande|m[aá]s\s+f[aá]cil\s+de\s+leer|para\s+adultos|comodidad\s+visual|contraste|m[aá]s\s+legible|vista\s+clara|pdf\s+claro|lectura\s+f[aá]cil|blanco\s+y\s+naranja|fondo\s+claro|fondo\s+blanco/i;

const BOCETO_RE =
  /\b(bocetos?|im[aá]genes?|dibujos?|sketches?|ilustraci(?:ó|o)n(?:es)?)\b/i;

const CONTENT_RE =
  /\b(ejercicio|exercise|calentamiento|series|reps?|repeticion(?:es)?|dosific|error(?:es)?|beneficio|texto|nombre|cliente|objetivo|nivel|a[ñn]ade|agrega|quita|elimina|cambia|reemplaz|sustitu|intensidad|mancuerna|barra|liga|banda|paso|ejecuci|simplif|m[aá]s corto|m[aá]s directo|jerga|entend|variaci[oó]n|alternativa|instead|en vez|explica|recuadro|nota)\b/i;

const SUBS_RE =
  /variaci[oó]n(?:es)?|alternativa(?:s)?|en vez de|instead of|you can do|puedes hacer|sustitut/i;
const NOTE_RE =
  /\b(nota|note|recuadro|explicaci[oó]n extra|explain|caja de nota|extra box|text box)\b/i;
const ADD_EX_RE =
  /a[ñn]ade(?:r)? (?:\d+ )?(?:ejercicios?|exercises?)|agrega(?:r)? (?:ejercicios?|exercises?)|\badd (?:an? |more )?(?:exercises?)\b|nuevo(?:s)? ejercicios?|new exercises?|extra exercises?/i;

/** Substitutes / extra boxes — not a longer session. */
export function isBoxOnlyRequest(prompt: string): boolean {
  const t = prompt.trim();
  const asksBox = SUBS_RE.test(t) || NOTE_RE.test(t);
  return asksBox && !ADD_EX_RE.test(t);
}

export function parseChangeIntent(prompt: string): ChangeIntent {
  const t = prompt.trim();
  const wantsClaraView = CLARA_RE.test(t);
  const wantsNewBocetos = BOCETO_RE.test(t);
  const namedContent = CONTENT_RE.test(t);

  if (wantsClaraView && !wantsNewBocetos && !namedContent) {
    return {
      wantsClaraView: true,
      wantsNewBocetos: false,
      wantsContentChange: false,
    };
  }

  if (wantsNewBocetos && !namedContent && !wantsClaraView) {
    return {
      wantsClaraView: false,
      wantsNewBocetos: true,
      wantsContentChange: false,
    };
  }

  return {
    wantsClaraView,
    wantsNewBocetos,
    wantsContentChange: namedContent || (!wantsClaraView && !wantsNewBocetos),
  };
}

export function equipmentKind(text: string): string {
  const t = text.toLowerCase();
  if (/\b(liga|ligas|banda|band|theraband|el[aá]stic)/.test(t)) return "band";
  if (/\b(mancuerna|dumbbell|\bdb\b)/.test(t)) return "db";
  if (/\b(barra|barbell)/.test(t)) return "bb";
  if (/\b(cable|polea|m[aá]quina|machine)/.test(t)) return "machine";
  if (/\b(peso corporal|bodyweight|lagartija|plancha|push-?up)/.test(t)) {
    return "bw";
  }
  return "other";
}

type RoutineLike = {
  clientName: string;
  objective: string;
  level: string;
  exercises: {
    id: string;
    name: string;
    dose: { setsReps: string };
    intro: string;
    purpose: string;
    benefit: string;
    variation?: string;
    note?: string;
    commonMistakes: string[];
    imageDataUrl?: string;
  }[];
};

/** Short coach-facing summary of what a revision actually changed. */
export function summarizeRevision(
  prev: RoutineLike,
  next: RoutineLike,
): string[] {
  const out: string[] = [];
  if (prev.clientName !== next.clientName) {
    out.push(`Cliente: ${next.clientName}`);
  }
  if (prev.objective !== next.objective) {
    out.push("Objetivo actualizado");
  }
  if (prev.level !== next.level) {
    out.push(`Nivel: ${prev.level} → ${next.level}`);
  }

  const prevById = new Map(prev.exercises.map((ex) => [ex.id, ex]));
  const nextIds = new Set(next.exercises.map((ex) => ex.id));
  let textEdits = 0;
  let doseEdits = 0;
  let bocetoEdits = 0;

  for (const ex of next.exercises) {
    const p = prevById.get(ex.id);
    if (!p) {
      out.push(`Añadido: ${ex.name}`);
      continue;
    }
    if (p.name !== ex.name) out.push(`${p.name} → ${ex.name}`);
    if (p.dose.setsReps !== ex.dose.setsReps) doseEdits += 1;
    if ((p.variation || "") !== (ex.variation || "")) {
      out.push(`Variación: ${ex.name}`);
    }
    if ((p.note || "") !== (ex.note || "")) {
      out.push(`Nota: ${ex.name}`);
    }
    if (
      p.intro !== ex.intro ||
      p.purpose !== ex.purpose ||
      p.benefit !== ex.benefit ||
      JSON.stringify(p.commonMistakes) !== JSON.stringify(ex.commonMistakes)
    ) {
      textEdits += 1;
    }
    if ((p.imageDataUrl || "") !== (ex.imageDataUrl || "")) bocetoEdits += 1;
  }

  for (const ex of prev.exercises) {
    if (!nextIds.has(ex.id)) out.push(`Quitado: ${ex.name}`);
  }

  if (doseEdits) out.push(`Dosificación ajustada en ${doseEdits} ejercicio(s)`);
  if (textEdits) out.push(`Texto reescrito en ${textEdits} ejercicio(s)`);
  if (bocetoEdits) out.push(`Boceto nuevo en ${bocetoEdits} ejercicio(s)`);

  return out.slice(0, 8);
}
