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
- duration y frequency: SOLO si el prompt del coach los indica con claridad. Si no, usa null (NO inventes "~45 min" ni "2× por semana").
- Cada ejercicio necesita: badge, intro, dose, purpose, muscles, steps (3–5), commonMistakes (2–4), benefit, sketchCaption, supportLinks.
- intro / purpose / benefit: un poco más largos y específicos (2–4 frases) con biomecánica real — se usan también para generar el boceto. Menciona SIEMPRE el equipo exacto (mancuernas / barra / liga elástica / peso corporal).
- sketchCaption: 1–2 frases EN ESPAÑOL con UNA sola variación (si el nombre dice "A o B", elige A): equipo exacto, pose, ángulo, músculos a resaltar y qué NO dibujar (ej. "press en banco plano con DOS mancuernas; NO barra olímpica"). Sin la palabra "Boceto".

ESTRUCTURA / CALENTAMIENTO (crítico — no colapses listas):
- Si el prompt tiene sección CALENTAMIENTO y BLOQUE PRINCIPAL (u otra división), respétala.
- Cada ítem numerado del calentamiento = UN ejercicio separado en el array. NUNCA fusiones varios ítems en uno solo.
- Si un ítem de calentamiento trae sub-viñetas (guiones) con movimientos distintos (ej. piernas de un lado a otro / abducciones / desplantes), crea UN ejercicio por cada sub-viñeta. Nombres claros, ej. "Movilidad de cadera — Abducciones".
- badge de calentamiento: "Calentamiento · 01", "Calentamiento · 02", … (no uses "Bloque principal" ahí).
- badge del bloque principal: "Bloque principal · 01", …
- Orden: primero todos los de calentamiento (en orden), luego el bloque principal.

EQUIPO POR DEFECTO (salvo que el prompt diga otra cosa):
- Rotación externa / interna de hombro en calentamiento → CON LIGA ELÁSTICA / banda de resistencia, de pie, codo a 90° pegado al costado. Nombre debe incluir "con liga" o "con banda". Explica biomecánica del manguito rotador con banda (no mancuerna, no tumbado sidelying salvo que el coach lo pida).
- "Press de pecho/hombro/sentadilla con mancuerna(s)" → mancuernas separadas, NUNCA barra.
- Lagartijas → peso corporal (push-up).

supportLinks (Apoyo adicional) — muy estricto:
  1) Si el prompt trae una URL de YouTube junto a UN ejercicio (o sus sub-viñetas), ponla SOLO en ese ejercicio / familia (ej. video de cadera → solo movilidad de cadera; video de hombro → solo rotación de hombro). Label: "Video de técnica".
  2) NUNCA copies el video de cadera a hombro ni viceversa. NUNCA pongas el mismo watch/shorts en todos los ejercicios.
  3) Si ese ejercicio ya tiene video del coach, NO agregues además "Buscar técnica" ni un segundo link genérico.
  4) Solo si NO hay URL del coach para ese ejercicio: 1 link search_query con el nombre+equipo. Label: "Buscar técnica en YouTube".
  5) NUNCA inventes IDs watch?v= / shorts/.

Responde SOLO con JSON válido (sin markdown) con esta forma exacta:
{
  "clientName": string,
  "objective": string,
  "level": "principiante" | "intermedio" | "avanzado",
  "duration": string | null,
  "frequency": string | null,
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
- Si pide expandir calentamiento o separar sub-movimientos, crea ejercicios separados (badge "Calentamiento · NN").
- Rotación de hombro en calentamiento = liga/banda elástica de pie salvo indicación contraria; marca needsNewImage si el boceto/equipo anterior era mancuerna o barra.
- Si pide cambios de dosificación, nivel, objetivo o cliente, actualízalos.
- Mantén el campo "id" de cada ejercicio que conserves (para no regenerar bocetos innecesarios).
- Ejercicios NUEVOS: id = null.
- Cada ejercicio necesita: id, name, nameEn, badge, intro, dose, purpose, muscles, steps (3–5), commonMistakes (2–4), benefit, sketchCaption, supportLinks.
- sketchCaption: 1–2 frases con pose exacta, equipo, ángulo y restricciones visuales (ej. "DOS mancuernas; NO barra").
- Conserva supportLinks existentes salvo que el pedido los cambie; para ejercicios nuevos aplica las mismas reglas de YouTube (URLs del prompt o search_query; nunca inventes watch?v=).
- Marca "needsNewImage": true solo si el ejercicio es nuevo o cambió tanto que el boceto anterior ya no aplica (incluye cambio de equipo: barra ≠ mancuernas ≠ liga).

Responde SOLO JSON válido:
{
  "clientName": string,
  "objective": string,
  "level": "principiante" | "intermedio" | "avanzado",
  "duration": string | null,
  "frequency": string | null,
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
intro/purpose/benefit un poco más específicos y deben nombrar el equipo exacto.
sketchCaption: 1–2 frases con pose exacta, equipo, ángulo y qué NO dibujar (ej. "liga elástica de pie; NO mancuerna").
Si es rotación de hombro de calentamiento sin otro equipo indicado → liga/banda elástica de pie.

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
    .slice(0, 4)
    .map((s) => `${s.title}: ${clipPrompt(s.body, 140)}`)
    .join(" | ");
  const avoid = [
    ...brief.forbidEquipment,
    ...(ctx.commonMistakes || []).slice(0, 3).map((m) => clipPrompt(m, 90)),
  ]
    .filter(Boolean)
    .join("; ");

  return `ARMATUS Coach Studio — premium biomechanics boceto (technical neon line art).

=== CHARACTER ONLY (ignore equipment in references) ===
${ARMATUS_ATHLETE_LOCK}
If reference images are attached: use them ONLY for the athlete's face, hair, body proportions, shorts/sneakers, and white/orange-on-black line style.
CRITICAL: IGNORE any barbell, plates, cables, or machines visible in the references. Replace equipment with the LOCKED EQUIPMENT below. References must NOT dictate the implement.

=== LOCKED EQUIPMENT (hard fail if wrong) ===
${brief.equipmentLockLine}
PRIMARY VARIATION: ${brief.primaryVariation}
BODY POSITION: ${brief.bodyPosition}
LATERALITY: ${brief.laterality}

=== COACHING CONTEXT (pose must match this explanation) ===
TITLE: ${clipPrompt(ctx.name, 120)}${ctx.nameEn ? ` / ${clipPrompt(ctx.nameEn, 80)}` : ""}
CAPTION: ${clipPrompt(ctx.sketchCaption, 280)}
INTRO: ${clipPrompt(ctx.intro, 280)}
PURPOSE: ${clipPrompt(ctx.purpose, 280)}
ACTIVE MUSCLES (orange fiber glow): ${muscles}
TECHNIQUE STEPS: ${cues || clipPrompt(ctx.intro, 200)}
FORBIDDEN: ${avoid || "any different machine or free-weight type"}

=== NON-NEGOTIABLE VISUAL RULES ===
1) EQUIPMENT FIDELITY: Barbell ≠ dumbbell. Two dumbbells = two separate short handles, one per hand — NEVER one long bar. Resistance band = visible elastic band under tension, not a dumbbell. Cable ≠ free weight.
2) If the title says mancuernas / dumbbells, both hands (or the working hand) hold dumbbells; there must be a visible gap between implements — no connecting shaft.
3) If the title says liga / banda / band, draw the band path clearly; do not substitute a dumbbell or cable.
4) Pose must match BODY POSITION + TECHNIQUE STEPS (e.g. standing band ER ≠ side-lying DB ER).
5) UPPER BODY SHIRTLESS — athletic shorts + sneakers only. Non-sexual, coaching-anatomical.
6) ACTIVATION GLOW: molten orange (#FF6B35) on working muscle fibers; white for silhouette. Pure black background. Sharp dual-line technical sketch, landscape composition.
7) ZERO text, letters, numbers, labels, watermarks, or logos.

Illustrate ONE decisive mid-rep frame of PRIMARY VARIATION with LOCKED EQUIPMENT only, same ARMATUS athlete as references (character only).`;
}

export const DEFAULT_PROMPT_PLACEHOLDER = `Cliente: EDUARDO
Objetivo: Fuerza y reducir riesgo de lesión
Nivel: intermedio
Ejercicios:
Crea una rutina con este calentamiento y este bloque principal.

CALENTAMIENTO:
1. Movilidad de cadera - 10 repeticiones por lado de cada uno:
   - Piernas de un lado a otro
   - Abducciones
   - Desplantes
2. Rotación externa de hombro con liga - 10 rep por lado
3. Rotación interna de hombro con liga - 10 rep por lado
4. Lagartijas - 15 repeticiones

BLOQUE PRINCIPAL:
- Sentadilla con mancuerna — 3 series × 8 reps
- Press de pecho con mancuernas — 3 series × 12 reps
- Step up con knee drive (reps por lado) — 3 series × 6 reps
- Press de hombro con mancuernas — 3 series × 8 reps
- Plancha Copenhagen (segundos por lado) — 3 series × 30 seg
- Tibiales — 3 series × 15 reps
Notas: explicación biomecánica profesional, errores comunes y beneficio específico. Incluir bocetos técnicos.`;
