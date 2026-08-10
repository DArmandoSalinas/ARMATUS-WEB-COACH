import OpenAI from "openai";
import { nanoid } from "nanoid";
import type { Exercise, Level, Routine } from "./types";
import { attachBocetos } from "./boceto";
import {
  REGEN_TEXT_SYSTEM_PROMPT,
  REVISE_SYSTEM_PROMPT,
  ROUTINE_SYSTEM_PROMPT,
} from "./prompts";
import {
  attachSupportLinksFromPrompt,
  ensureSupportSearchLinks,
  normalizeSupportLinks,
} from "./supportLinks";

function requireClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-..." || key === "your-key-here") {
    throw new Error(
      "OPENAI_API_KEY no está configurada. Añádela en .env.local y reinicia el servidor.",
    );
  }
  return new OpenAI({ apiKey: key });
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function asLevel(v: unknown): Level {
  if (v === "principiante" || v === "intermedio" || v === "avanzado") return v;
  return "intermedio";
}

type RawExercise = {
  name?: string;
  nameEn?: string | null;
  badge?: string;
  intro?: string;
  dose?: { setsReps?: string; rpe?: string | null; rest?: string | null };
  purpose?: string;
  muscles?: string[];
  steps?: { title?: string; body?: string }[];
  commonMistakes?: string[];
  benefit?: string;
  sketchCaption?: string;
  supportLinks?: { label?: string | null; url?: string }[];
};

function normalizeExercise(raw: RawExercise, order: number): Exercise {
  return {
    id: nanoid(10),
    order,
    name: raw.name?.trim() || `Ejercicio ${order + 1}`,
    nameEn: raw.nameEn?.trim() || undefined,
    badge: raw.badge?.trim() || `${String(order + 1).padStart(2, "0")} · Bloque`,
    intro: raw.intro?.trim() || "",
    dose: {
      setsReps: raw.dose?.setsReps?.trim() || "3 × 8–10",
      rpe: raw.dose?.rpe?.trim() || undefined,
      rest: raw.dose?.rest?.trim() || undefined,
    },
    purpose: raw.purpose?.trim() || "",
    muscles: Array.isArray(raw.muscles)
      ? raw.muscles.map((m) => String(m).trim()).filter(Boolean)
      : [],
    steps: Array.isArray(raw.steps)
      ? raw.steps
          .map((s, i) => ({
            title: s.title?.trim() || `${String(i + 1).padStart(2, "0")} · Paso`,
            body: s.body?.trim() || "",
          }))
          .filter((s) => s.body)
      : [],
    commonMistakes: Array.isArray(raw.commonMistakes)
      ? raw.commonMistakes.map((m) => String(m).trim()).filter(Boolean)
      : [],
    benefit: raw.benefit?.trim() || "",
    sketchCaption: raw.sketchCaption?.trim() || "Vista técnica",
    supportLinks: normalizeSupportLinks(raw.supportLinks),
  };
}

export async function generateRoutineFromPrompt(
  prompt: string,
  coachName: string,
): Promise<Routine> {
  const client = requireClient();
  const coach = coachName.trim() || "Coach";
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.55,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ROUTINE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Coach: ${coach}\n\nPrompt de la rutina:\n\n${prompt}\n\nGenera la rutina JSON completa.`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("La IA no devolvió contenido de rutina.");

  const parsed = JSON.parse(stripJsonFence(content)) as {
    clientName?: string;
    objective?: string;
    level?: string;
    duration?: string;
    frequency?: string;
    notes?: string | null;
    exercises?: RawExercise[];
  };

  const now = new Date().toISOString();
  let exercises = (parsed.exercises ?? []).map((ex, i) =>
    normalizeExercise(ex, i),
  );

  if (exercises.length === 0) {
    throw new Error(
      "La IA no devolvió ejercicios. Revisa el prompt e intenta de nuevo.",
    );
  }

  exercises = ensureSupportSearchLinks(
    attachSupportLinksFromPrompt(exercises, prompt),
  );

  // Library paths only — AI bocetos are filled client-side to avoid
  // Vercel response-size / timeout limits on multi-image generate.
  const withLibrary = await attachBocetos(exercises, { libraryOnly: true });

  const duration = parsed.duration?.trim();
  const frequency = parsed.frequency?.trim();

  return {
    id: nanoid(12),
    createdAt: now,
    updatedAt: now,
    coachName: coach,
    clientName: parsed.clientName?.trim() || "Atleta",
    objective: parsed.objective?.trim() || "Rutina personalizada",
    level: asLevel(parsed.level),
    duration:
      duration && !/^(null|n\/a|desconocid[oa]|none)$/i.test(duration)
        ? duration
        : undefined,
    frequency:
      frequency && !/^(null|n\/a|desconocid[oa]|none)$/i.test(frequency)
        ? frequency
        : undefined,
    notes: parsed.notes?.trim() || undefined,
    sourcePrompt: prompt,
    exercises: withLibrary,
  };
}

function leanExerciseForPrompt(ex: Exercise) {
  return {
    id: ex.id,
    name: ex.name,
    nameEn: ex.nameEn ?? null,
    badge: ex.badge,
    intro: ex.intro,
    dose: ex.dose,
    purpose: ex.purpose,
    muscles: ex.muscles,
    steps: ex.steps,
    commonMistakes: ex.commonMistakes,
    benefit: ex.benefit,
    sketchCaption: ex.sketchCaption,
    supportLinks: ex.supportLinks ?? [],
  };
}

/** Text-only revise. Client reuses / regenerates bocetos. */
export async function reviseRoutineText(
  routine: Routine,
  changePrompt: string,
): Promise<Routine> {
  const client = requireClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.45,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: REVISE_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          coach: routine.coachName,
          pedidoDeCambios: changePrompt,
          rutinaActual: {
            clientName: routine.clientName,
            objective: routine.objective,
            level: routine.level,
            duration: routine.duration,
            frequency: routine.frequency,
            notes: routine.notes ?? null,
            exercises: routine.exercises
              .slice()
              .sort((a, b) => a.order - b.order)
              .map(leanExerciseForPrompt),
          },
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("La IA no devolvió la rutina revisada.");

  const parsed = JSON.parse(stripJsonFence(content)) as {
    clientName?: string;
    objective?: string;
    level?: string;
    duration?: string;
    frequency?: string;
    notes?: string | null;
    exercises?: (RawExercise & {
      id?: string | null;
      needsNewImage?: boolean;
    })[];
  };

  const byId = new Map(routine.exercises.map((ex) => [ex.id, ex]));
  const rawList = parsed.exercises ?? [];
  if (rawList.length === 0) {
    throw new Error("La revisión no devolvió ejercicios.");
  }

  const exercises: Exercise[] = rawList.map((raw, i) => {
    const prev = raw.id ? byId.get(raw.id) : undefined;
    const base = normalizeExercise(raw, i);
    const keepId = prev?.id ?? base.id;
    const nameChanged =
      !!prev &&
      (prev.name.trim().toLowerCase() !== base.name.trim().toLowerCase() ||
        prev.sketchCaption.trim().toLowerCase() !==
          base.sketchCaption.trim().toLowerCase());
    const needsImage =
      !prev || raw.needsNewImage === true || nameChanged || !prev.imageDataUrl;

    return {
      ...base,
      id: keepId,
      order: i,
      // Keep previous image if still valid; client will regen when missing
      imageDataUrl: needsImage ? undefined : prev?.imageDataUrl,
      supportLinks:
        base.supportLinks?.length
          ? base.supportLinks
          : prev?.supportLinks,
    };
  });

  const withSupport = ensureSupportSearchLinks(
    attachSupportLinksFromPrompt(exercises, changePrompt),
  );

  return {
    ...routine,
    updatedAt: new Date().toISOString(),
    clientName: parsed.clientName?.trim() || routine.clientName,
    objective: parsed.objective?.trim() || routine.objective,
    level: asLevel(parsed.level ?? routine.level),
    duration: (() => {
      if (parsed.duration === null) return undefined;
      const d = parsed.duration?.trim();
      if (d && !/^(null|n\/a|none)$/i.test(d)) return d;
      return routine.duration;
    })(),
    frequency: (() => {
      if (parsed.frequency === null) return undefined;
      const f = parsed.frequency?.trim();
      if (f && !/^(null|n\/a|none)$/i.test(f)) return f;
      return routine.frequency;
    })(),
    notes: parsed.notes?.trim() || routine.notes,
    sourcePrompt: `${routine.sourcePrompt}\n\n---\nCambios pedidos:\n${changePrompt}`,
    exercises: withSupport,
  };
}

export async function regenerateExerciseText(params: {
  exercise: Exercise;
  routineContext: {
    clientName: string;
    objective: string;
    level: Level;
    notes?: string;
  };
}): Promise<Exercise> {
  const client = requireClient();
  const { exercise, routineContext } = params;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: REGEN_TEXT_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          cliente: routineContext.clientName,
          objetivo: routineContext.objective,
          nivel: routineContext.level,
          notas: routineContext.notes ?? null,
          ejercicioActual: {
            name: exercise.name,
            nameEn: exercise.nameEn,
            badge: exercise.badge,
            intro: exercise.intro,
            dose: exercise.dose,
            purpose: exercise.purpose,
            muscles: exercise.muscles,
            steps: exercise.steps,
            commonMistakes: exercise.commonMistakes,
            benefit: exercise.benefit,
            sketchCaption: exercise.sketchCaption,
            supportLinks: exercise.supportLinks ?? [],
          },
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("No se pudo regenerar el texto del ejercicio.");

  const parsed = JSON.parse(stripJsonFence(content)) as RawExercise;
  const next = normalizeExercise(parsed, exercise.order);
  return {
    ...next,
    id: exercise.id,
    order: exercise.order,
    imageDataUrl: exercise.imageDataUrl,
    supportLinks:
      next.supportLinks?.length
        ? next.supportLinks
        : exercise.supportLinks,
  };
}

