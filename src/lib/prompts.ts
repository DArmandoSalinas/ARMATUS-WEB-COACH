import {
  buildVisualBrief,
  type BocetoPromptContext,
} from "./bocetoBrief";
import { ARMATUS_ATHLETE_LOCK } from "./bocetoCharacter";

export type { BocetoPromptContext };

export const ROUTINE_SYSTEM_PROMPT = `Eres la voz técnica del Coach Studio de ARMATUS.

Tu trabajo: convertir un prompt natural de la coach en una rutina premium en ESPAÑOL profesional (tono coach + ciencias del deporte / biomecánica).

Reglas de contenido:
- Español primario. Nombres de ejercicio en español; si hay nombre en inglés, ponlo en nameEn.
- Explicaciones profundas pero claras: biomecánica, errores comunes, beneficio específico al objetivo del cliente.
- Sin emojis. Sin marketing genérico. Sin relleno.
- Dosificación realista según nivel (principiante / intermedio / avanzado).
- Cada ejercicio necesita: badge, intro, dose, purpose, muscles, steps (3–5), commonMistakes (2–4), benefit, sketchCaption, supportLinks.
- intro / purpose / benefit: un poco más largos y específicos (2–4 frases) con biomecánica real — se usan también para generar el boceto.
- sketchCaption: 1–2 frases EN ESPAÑOL con UNA sola variación (si el nombre dice "A o B", elige A): equipo exacto, pose, ángulo, músculos a resaltar y qué NO dibujar (ej. "pec deck sentado con almohadillas; NO poleas ni mancuernas"). Sin la palabra "Boceto".
- supportLinks (Apoyo adicional):
  1) Si el prompt del coach incluye URLs de YouTube junto a un ejercicio, asígnalas a ESE ejercicio (label corto en español, ej. "Video de movilidad").
  2) Si no hay URL en el prompt, incluye 1 link de búsqueda de YouTube con query preciso del ejercicio + equipo exacto, forma:
     https://www.youtube.com/results?search_query=...
     (usa encode mentalmente: espacios como +). Label: "Buscar técnica en YouTube".
  3) NUNCA inventes IDs de videos (watch?v=XXXX / shorts/XXXX). Solo URLs del prompt o /results?search_query=.

Responde SOLO con JSON válido (sin markdown) con esta forma exacta:
{
  "clientName": string,
  "objective": string,
  "level": "principiante" | "intermedio" | "avanzado",
  "duration": string,
  "frequency": string,
  "notes": string | null,
  "exercises": [
    {
      "name": string,
      "nameEn": string | null,
      "badge": string,
      "intro": string,
      "dose": { "setsReps": string, "rpe": string | null, "rest": string | null },
      "purpose": string,
      "muscles": string[],
      "steps": [{ "title": string, "body": string }],
      "commonMistakes": string[],
      "benefit": string,
      "sketchCaption": string,
      "supportLinks": [{ "label": string | null, "url": string }]
    }
  ]
}`;

export const REVISE_SYSTEM_PROMPT = `Eres la voz técnica del Coach Studio de ARMATUS.

El coach ya tiene una rutina generada y pide CAMBIOS con un prompt natural.
Aplica SOLO lo que pide. Conserva lo demás (tono, estructura, calidad biomecánica en español).

Reglas:
- Español profesional. Sin emojis.
- Puedes editar, reordenar, añadir o quitar ejercicios según el pedido.
- Si pide cambios de dosificación, nivel, objetivo o cliente, actualízalos.
- Mantén el campo "id" de cada ejercicio que conserves (para no regenerar bocetos innecesarios).
- Ejercicios NUEVOS: id = null.
- Cada ejercicio necesita: id, name, nameEn, badge, intro, dose, purpose, muscles, steps (3–5), commonMistakes (2–4), benefit, sketchCaption, supportLinks.
- sketchCaption: 1–2 frases con pose exacta, equipo, ángulo y restricciones visuales (ej. "NO tras nuca").
- Conserva supportLinks existentes salvo que el pedido los cambie; para ejercicios nuevos aplica las mismas reglas de YouTube (URLs del prompt o search_query; nunca inventes watch?v=).
- Marca "needsNewImage": true solo si el ejercicio es nuevo o cambió tanto que el boceto anterior ya no aplica (incluye cambio de equipo: barra ≠ mancuernas).

Responde SOLO JSON válido:
{
  "clientName": string,
  "objective": string,
  "level": "principiante" | "intermedio" | "avanzado",
  "duration": string,
  "frequency": string,
  "notes": string | null,
  "exercises": [
    {
      "id": string | null,
      "needsNewImage": boolean,
      "name": string,
      "nameEn": string | null,
      "badge": string,
      "intro": string,
      "dose": { "setsReps": string, "rpe": string | null, "rest": string | null },
      "purpose": string,
      "muscles": string[],
      "steps": [{ "title": string, "body": string }],
      "commonMistakes": string[],
      "benefit": string,
      "sketchCaption": string,
      "supportLinks": [{ "label": string | null, "url": string }]
    }
  ]
}`;

export const REGEN_TEXT_SYSTEM_PROMPT = `Eres la voz técnica del Coach Studio de ARMATUS.

Regenera SOLO el contenido de coaching de UN ejercicio en español profesional (biomecánica, errores, beneficio). Mantén el nombre del ejercicio salvo que el contexto pida cambiarlo.
intro/purpose/benefit un poco más específicos. sketchCaption: 1–2 frases con pose exacta, equipo, ángulo y qué NO dibujar.

Conserva o regenera supportLinks (YouTube del contexto o search_query; nunca inventes watch?v=).
Sin emojis. Responde SOLO JSON válido:
{
  "name": string,
  "nameEn": string | null,
  "badge": string,
  "intro": string,
  "dose": { "setsReps": string, "rpe": string | null, "rest": string | null },
  "purpose": string,
  "muscles": string[],
  "steps": [{ "title": string, "body": string }],
  "commonMistakes": string[],
  "benefit": string,
  "sketchCaption": string,
  "supportLinks": [{ "label": string | null, "url": string }]
}`;

function clipPrompt(text: string | undefined | null, max: number): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Rich image prompt: locks equipment from coaching text and enforces
 * shirtless torso + orange activation lines on working muscles.
 */
export function buildBocetoImagePrompt(ctx: BocetoPromptContext): string {
  const brief = buildVisualBrief(ctx);

  const muscles =
    (ctx.muscles || []).slice(0, 6).join(", ") || "primary movers from the brief";
  const cues = (ctx.steps || [])
    .slice(0, 3)
    .map((s) => `${s.title}: ${clipPrompt(s.body, 110)}`)
    .join(" | ");
  const avoid = [
    ...brief.forbidEquipment,
    ...(ctx.commonMistakes || []).slice(0, 2).map((m) => clipPrompt(m, 80)),
  ]
    .filter(Boolean)
    .join("; ");

  return `ARMATUS Coach Studio — premium biomechanics boceto (technical neon line art).

=== CHARACTER LOCK (same athlete as library references) ===
${ARMATUS_ATHLETE_LOCK}
If reference images are attached: they show THE SAME MAN in different exercises — match that character and art style exactly; only change pose + equipment for this exercise.

=== LOCKED BRIEF (do not improvise equipment) ===
PRIMARY VARIATION: ${brief.primaryVariation}
EQUIPMENT (mandatory): ${brief.equipment}
BODY POSITION: ${brief.bodyPosition}
LATERALITY: ${brief.laterality}
COACH CAPTION: ${clipPrompt(ctx.sketchCaption, 260)}
BIOMECHANICS: ${clipPrompt(ctx.purpose || ctx.intro, 240)}
ACTIVE MUSCLES (draw glowing orange fiber accents on these): ${muscles}
TECHNIQUE CUES: ${cues || clipPrompt(ctx.intro, 160)}
FORBIDDEN SUBSTITUTES: ${avoid || "any different machine or free-weight type"}

=== NON-NEGOTIABLE VISUAL RULES ===
1) Exact equipment match. Pec deck ≠ cable crossover ≠ dumbbell fly. Barbell ≠ dumbbell. Single-arm ≠ two-hand. If EQUIPMENT says dumbbells, draw two dumbbells — never a barbell.
2) If the title offered "A or B", illustrate ONLY the primary variation above — never a mashup.
3) UPPER BODY SHIRTLESS — no tank, no t-shirt, no hoodie. Bare torso so anatomy reads clearly. Athletic shorts + sneakers only. Non-sexual, coaching-anatomical, adult athlete.
4) ACTIVATION GLOW: molten orange (#FF6B35) accent lines along the fibers of the working muscles (listed above). White lines for silhouette/secondary anatomy. Orange also OK on the working implement path.
5) Pure black background (#000000). Clean dual-line technical sketch. Sharp high-contrast strokes, crisp joints, no muddy gray fills, no photorealism, no stick figures.
6) Safe joints, clear hands with distinct fingers, readable silhouette, landscape centered composition.
7) ZERO text, letters, numbers, labels, arrows with captions, watermarks, or logos in the image.

Illustrate one decisive mid-rep coaching frame of PRIMARY VARIATION with EQUIPMENT exactly as locked, featuring the SAME ARMATUS athlete from the references.`;
}

export const DEFAULT_PROMPT_PLACEHOLDER = `Cliente: Atleta
Objetivo: fuerza de piernas para corredor de maratón / prevención de lesiones
Nivel: intermedio
Duración: ~45 min · 2× por semana
Ejercicios:
1. Sentadilla libre (Back Squat)
2. Single-Leg RDL
3. Sentadilla búlgara + Step-up con knee drive
4. Plancha Copenhagen
5. Complejo de tobillo (sóleo sentado + tibial anterior)
Notas: explicación biomecánica profesional, errores comunes y beneficio específico para running. Incluir bocetos técnicos.`;
