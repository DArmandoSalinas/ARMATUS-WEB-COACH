import type { Level } from "./types";
import type { Locale } from "./i18n";

export type BriefFields = {
  client: string;
  objective: string;
  level: Level;
  equipment: string;
  duration: string;
  frequency: string;
  warmup: string;
  main: string;
  constraints: string;
  notes: string;
  freeBrief: string;
};

export const EMPTY_BRIEF: BriefFields = {
  client: "",
  objective: "",
  equipment: "",
  duration: "",
  frequency: "",
  warmup: "",
  main: "",
  constraints: "",
  notes: "",
  freeBrief: "",
  level: "intermedio",
};

export function exampleBrief(locale: Locale): BriefFields {
  if (locale === "en") {
    return {
      client: "Athlete",
      objective: "Leg strength for a marathon runner / injury prevention",
      level: "intermedio",
      equipment: "Barbell, dumbbells, bodyweight",
      duration: "~45 min",
      frequency: "2× per week",
      warmup: `90/90 hip switch — 2 × 6/side
World’s greatest stretch — 2 × 5/side
Glute bridge — 2 × 10`,
      main: `Back squat — 4 × 6
Single-leg RDL — 3 × 8/side  https://www.youtube.com/watch?v=2C-uNgKwP6o
Bulgarian split squat + step-up with knee drive — 3 × 8/side
Copenhagen plank — 3 × 20–30 s/side
Ankle complex (seated soleus + tibialis anterior) — 2 × 12`,
      constraints: "",
      notes:
        "Short copy for an adult. Explain biomechanics and a running-specific benefit. Concrete mistakes. Include technical sketches.",
      freeBrief: "",
    };
  }
  return {
    client: "Atleta",
    objective: "Fuerza de piernas para corredor de maratón / prevención de lesiones",
    level: "intermedio",
    equipment: "Barra, mancuernas, peso corporal",
    duration: "~45 min",
    frequency: "2× por semana",
    warmup: `90/90 hip switch — 2 × 6/lado
World’s greatest stretch — 2 × 5/lado
Glute bridge — 2 × 10`,
    main: `Sentadilla libre (Back Squat) — 4 × 6
Single-Leg RDL — 3 × 8/lado  https://www.youtube.com/watch?v=2C-uNgKwP6o
Sentadilla búlgara + Step-up con knee drive — 3 × 8/lado
Plancha Copenhagen — 3 × 20–30 s/lado
Complejo de tobillo (sóleo sentado + tibial anterior) — 2 × 12`,
    constraints: "",
    notes:
      "Textos cortos para un adulto. Explica biomecánica y el beneficio para running. Errores concretos. Incluir bocetos técnicos.",
    freeBrief: "",
  };
}

export function briefIsReady(fields: BriefFields): boolean {
  if (fields.freeBrief.trim()) return true;
  return Boolean(
    fields.client.trim() &&
      fields.objective.trim() &&
      (fields.warmup.trim() || fields.main.trim()),
  );
}

export function buildRoutineBrief(fields: BriefFields, locale: Locale): string {
  const en = locale === "en";
  const lines: string[] = [];
  lines.push(en ? "Output language: English" : "Idioma de salida: español");

  const row = (label: string, value: string) => {
    const v = value.trim();
    if (v) lines.push(`${label}: ${v}`);
  };

  row(en ? "Client" : "Cliente", fields.client);
  row(en ? "Goal" : "Objetivo", fields.objective);
  row(en ? "Level" : "Nivel", fields.level);
  row(en ? "Equipment" : "Equipo", fields.equipment);
  row(en ? "Duration" : "Duración", fields.duration);
  row(en ? "Frequency" : "Frecuencia", fields.frequency);

  if (fields.warmup.trim()) {
    lines.push("");
    lines.push(en ? "WARM-UP:" : "CALENTAMIENTO:");
    lines.push(
      en
        ? "(YouTube: paste the URL on the same line as that exercise.)"
        : "(YouTube: pega el URL en la misma línea de ese ejercicio.)",
    );
    lines.push(fields.warmup.trim());
  }
  if (fields.main.trim()) {
    lines.push("");
    lines.push(en ? "MAIN BLOCK:" : "BLOQUE PRINCIPAL:");
    lines.push(
      en
        ? "(YouTube: paste the URL on the same line as that exercise.)"
        : "(YouTube: pega el URL en la misma línea de ese ejercicio.)",
    );
    lines.push(fields.main.trim());
  }
  row(en ? "Injuries / constraints" : "Lesiones / restricciones", fields.constraints);
  if (fields.notes.trim()) {
    lines.push("");
    lines.push(
      en
        ? "COPY INSTRUCTIONS (tone and what to explain — videos belong on the exercise line, not here):"
        : "INSTRUCCIONES PARA EL TEXTO (tono y qué explicar; los videos van en la línea del ejercicio, no aquí):",
    );
    lines.push(fields.notes.trim());
  }

  if (fields.freeBrief.trim()) {
    lines.push("");
    lines.push(fields.freeBrief.trim());
  }

  return lines.join("\n");
}

const BRIEF_DRAFT_KEY = "armatus-brief-draft";

export type BriefDraft = {
  coachName: string;
  mode: "form" | "brief";
  fields: BriefFields;
};

export function loadBriefDraft(): BriefDraft | null {
  try {
    const raw = localStorage.getItem(BRIEF_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BriefDraft;
    if (!parsed?.fields) return null;
    const draft: BriefDraft = {
      coachName: parsed.coachName ?? "",
      mode: parsed.mode === "brief" ? "brief" : "form",
      fields: { ...EMPTY_BRIEF, ...parsed.fields },
    };
    return briefDraftHasContent(draft) ? draft : null;
  } catch {
    return null;
  }
}

function briefDraftHasContent(draft: BriefDraft): boolean {
  const f = draft.fields;
  return Boolean(
    f.client.trim() ||
      f.objective.trim() ||
      f.equipment.trim() ||
      f.duration.trim() ||
      f.frequency.trim() ||
      f.warmup.trim() ||
      f.main.trim() ||
      f.constraints.trim() ||
      f.notes.trim() ||
      f.freeBrief.trim(),
  );
}

export function saveBriefDraft(draft: BriefDraft): void {
  if (!briefDraftHasContent(draft)) {
    clearBriefDraft();
    return;
  }
  try {
    localStorage.setItem(BRIEF_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function clearBriefDraft(): void {
  try {
    localStorage.removeItem(BRIEF_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
