export type Locale = "es" | "en";

export const LOCALE_KEY = "armatus-locale";
export const LOCALE_EVENT = "armatus-locale";

export function readLocale(): Locale {
  try {
    return window.localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

export function applyLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", locale);
}

export function setLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* private mode / quota */
  }
  applyLocale(locale);
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

export function subscribeLocale(onChange: () => void) {
  const wrap = () => {
    applyLocale(readLocale());
    onChange();
  };
  window.addEventListener(LOCALE_EVENT, wrap);
  window.addEventListener("storage", wrap);
  return () => {
    window.removeEventListener(LOCALE_EVENT, wrap);
    window.removeEventListener("storage", wrap);
  };
}

export const LOCALE_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${LOCALE_KEY}");if(t==="en"){document.documentElement.setAttribute("lang","en");}}catch(e){}})();`;

const es = {
  dark: "Oscuro",
  light: "Claro",
  themeGroup: "Apariencia de la página",
  localeGroup: "Idioma",
  sloganA: "La rutina no se improvisa.",
  sloganB: "Se arma con el coach.",
  homeTitle: "Studio para coaches.",
  homeLead:
    "El coach llena la ficha, genera la rutina, ajusta o pide cambios, y entrega PDF, WhatsApp o un link de lectura para el atleta.",
  ctaCreate: "Crear rutina",
  lastRoutineQuiet: "Última rutina de este navegador",
  flow: "Flujo",
  flow1t: "Ficha",
  flow1d: "Atleta, objetivo, equipo y bloques. La ficha se guarda sola.",
  flow2t: "Forja",
  flow2d: "Texto biomecánico + bocetos ARMATUS.",
  flow3t: "Entrega",
  flow3d: "PDF, WhatsApp o link de lectura.",
  recentTitle: "Rutinas recientes",
  open: "Abrir",
  useAsBase: "Usar como base",
  delete: "Borrar",
  deleteConfirm: "¿Borrar la rutina de",
  copying: "Copiando…",

  composerEyebrow: "Ficha de rutina",
  composerTitle: "Llena la ficha.",
  composerAccent: "Nosotros la forjamos.",
  composerLead:
    "Los campos obligatorios evitan briefs vacíos. La ficha se guarda sola en este navegador. Si ya traes el texto (WhatsApp, nota), usa Brief libre. El progreso es real: primero el texto, después los bocetos.",
  coach: "Coach",
  coachPh: "Nombre del coach",
  modeForm: "Ficha",
  modeBrief: "Brief libre",
  client: "Atleta",
  clientPh: "Nombre o alias",
  objective: "Objetivo",
  objectivePh: "Fuerza, prevención de lesión, hipertrofia…",
  level: "Nivel",
  levelBeg: "Principiante",
  levelMid: "Intermedio",
  levelAdv: "Avanzado",
  equipment: "Equipo disponible",
  equipmentPh: "Mancuernas, barra, ligas, peso corporal…",
  duration: "Duración",
  durationPh: "Solo si el coach la fija",
  frequency: "Frecuencia",
  frequencyPh: "Ej. 2× por semana",
  warmup: "Calentamiento",
  warmupPh: "Un movimiento por línea. Incluye equipo y dosis si las tienes.",
  mainBlock: "Bloque principal",
  mainPh: "Un ejercicio por línea, con series × reps si las tienes.",
  constraints: "Lesiones o restricciones",
  constraintsPh: "Hombro sensible, no axial load, evitar flexión lumbar…",
  notes: "Notas y videos",
  notesPh: "Indicaciones extra o URLs de YouTube pegadas junto al ejercicio.",
  freeBrief: "Brief libre",
  freeBriefPh:
    "Pega el brief completo: cliente, objetivo, calentamiento y bloque principal.",
  useExample: "Usar ejemplo",
  generate: "Generar rutina",
  generating: "Generando…",
  hintCoach: "Escribe tu nombre de coach para habilitar Generar.",
  hintBrief:
    "Completa atleta, objetivo y al menos un bloque — o pega un brief libre.",
  statusReady: "Listo para generar",
  statusText: "Componiendo explicación biomecánica…",
  statusBocetos: "Generando bocetos ARMATUS…",
  statusBocetosFail: "boceto(s) pendiente(s): se pueden reintentar en cada ejercicio.",
  statusPublish: "Publicando link compartible…",
  statusDone: "Rutina lista",
  statusError: "Error — puedes volver a generar",
  errorCoach: "Escribe el nombre del coach antes de generar.",
  errorQuota:
    "El almacenamiento del navegador estaba lleno. Ya lo liberamos: vuelve a generar la rutina.",
  errorTimeout:
    "Si el brief es muy largo, acórtalo un poco e intenta de nuevo.",
  readyForm: "Ficha lista",

  routineFor: "Rutina para",
  leadClara:
    "Rutina clara: dosificación, cómo hacerlo, errores a evitar y bocetos — fácil de leer en pantalla o en el PDF.",
  leadStudio:
    "Protocolo biomecánico con dosificación, ejecución técnica, errores comunes y bocetos ARMATUS — listo para enviar al atleta.",
  startRoutine: "Empezar rutina",
  pdfBusy: "Generando PDF…",
  pdfClara: "Descargar PDF claro",
  pdfStudio: "Descargar PDF",
  share: "Compartir",
  publishing: "Publicando…",
  shareLabel: "Link de esta rutina",
  copyLink: "Copiar link",
  shareHint:
    "Copiar funciona ya. Compartir publica bocetos para otro navegador o el atleta. Si falla con token de Blob, falta BLOB_READ_WRITE_TOKEN en Vercel.",
  copyOk:
    "Link copiado. En otro navegador solo funciona si ya publicaste con Compartir.",
  blocks: "Bloques",
  durationChip: "Duración",
  frequencyChip: "Frecuencia",
  levelChip: "Nivel",
  close: "Cerrar",
  editHint: "Modo edición: ajusta textos, orden y bocetos.",
  claraHint:
    "Apariencia clara: blanco y naranja, letra cómoda. El PDF usa el mismo modo.",
  studioHint:
    "Apariencia oscura: negro y naranja. Cambia a Claro arriba a la derecha.",
  edit: "Editar",
  exitEdit: "Salir de edición",
  askChanges: "Pedir cambios",
  hideChanges: "Ocultar cambios",
  save: "Guardar",
  newRoutine: "Nueva rutina",
  cleanView: "Vista limpia",
  exercisesNav: "Ejercicios",
  dupFail: "No se pudo duplicar la rutina en este navegador.",
  hideDraft: "Hay un pedido sin aplicar. ¿Ocultar igual?",
  blobFail: "No se pudo publicar. Revisa que Blob tenga el token read-write.",
  shareFail: "No se pudo compartir la rutina.",
  pdfFail: "No se pudo generar el PDF.",
  regenTextFail: "Error al regenerar texto",
  regenImageFail: "Error al regenerar boceto",

  reviseTitle: "Pedir cambios",
  reviseLead:
    "Describe qué quieres ajustar. Aplicamos el pedido sobre esta rutina, sin empezar de cero. Si pides bocetos nuevos, se regeneran de verdad.",
  revisePh: `Ejemplos:
• Baja la intensidad a principiante y reduce series
• Cambia el Single-Leg RDL por bridge unipodal
• Reescribe los errores comunes del press de pecho
• Regenera los bocetos del calentamiento
• Haz los textos más simples para adultos`,
  apply: "Aplicar cambios",
  applying: "Aplicando…",
  reviseReady: "Listo para revisar",
  whatChanged: "Qué cambió",
  shortcutBeginner: "Bajar a principiante",
  shortcutAdult: "Textos para adultos",
  shortcutWarmup: "Bocetos del calentamiento",
  shortcutBeginnerPrompt:
    "Baja toda la rutina a nivel principiante: menos series, RPE más bajo y descansos más holgados. Conserva los ejercicios.",
  shortcutAdultPrompt:
    "Acorta y simplifica los textos para que un adulto los lea sin fatiga: menos jerga, frases cortas, misma precisión biomecánica.",
  shortcutWarmupPrompt:
    "Regenera solo los bocetos de los ejercicios de calentamiento. No cambies el texto ni el bloque principal.",

  up: "Subir",
  down: "Bajar",
  regenText: "Regenerar texto",
  regenTextBusy: "Regenerando…",
  regenImage: "Regenerar boceto",
  regenImageBusy: "Boceto…",
  remove: "Eliminar",
  doseLabel: "Dosificación recomendada",
  sketchPending: "Boceto pendiente",
  sketchRetry: "Reintentar boceto",
  sketchBusy: "Generando boceto…",
  purpose: "Propósito y enfoque",
  muscles: "Enfoque muscular",
  howTo: "Cómo ejecutarlo",
  mistakes: "Errores comunes",
  benefit: "Beneficio",
  support: "Apoyo adicional",
  supportEmpty: "Sin enlaces de apoyo.",
  addMistake: "Añadir error",
  removeMistake: "Quitar",

  errTitle: "Algo falló",
  errBody:
    "La rutina en pantalla no se perdió si ya estaba guardada. Vuelve a intentar o abre el studio de nuevo.",
  retry: "Reintentar",
  home: "Inicio",
  notFound: "Página no encontrada",
  notFoundBody:
    "Esa ruta no existe en Coach Studio. Vuelve al inicio o crea una rutina.",
  loadingRoutine: "Cargando rutina…",
  missingTitle: "Rutina no encontrada",
  missingBody:
    "Este link aún no está publicado en la nube, o la rutina solo existía en el navegador del coach. Pide que vuelva a abrirla y pulse Compartir.",
  draftSaved: "Ficha guardada en este navegador",
  clearDraft: "Vaciar ficha",
  doseSheet: "Hoja de dosis",
  copyDose: "Copiar dosis",
  whatsapp: "WhatsApp",
  doseCopied: "Dosis copiada. Pégala en WhatsApp o en una nota.",
  athleteLink: "Link de lectura (atleta)",
  copyAthlete: "Copiar link de lectura",
  athleteHint:
    "Ese link abre la rutina sin botones de coach: el adulto lee y descarga el PDF.",
  athleteBanner: "Vista de lectura. El atleta no ve edición ni pedidos de cambio.",
  openCoachView: "Abrir vista coach",
  undoChange: "Deshacer último pedido",
  undoNone: "No hay un pedido reciente para deshacer.",
  undoOk: "Se restauró la versión anterior.",
  searchRecent: "Buscar atleta u objetivo",
  noRecentMatch: "Ninguna rutina coincide con esa búsqueda.",
} as const;

const en: { [K in keyof typeof es]: string } = {
  dark: "Dark",
  light: "Light",
  themeGroup: "Page appearance",
  localeGroup: "Language",
  sloganA: "The session is not improvised.",
  sloganB: "It is built with the coach.",
  homeTitle: "Studio for coaches.",
  homeLead:
    "The coach fills the card, generates the session, edits or asks for changes, and delivers a PDF, WhatsApp card, or a reading link for the athlete.",
  ctaCreate: "Create session",
  lastRoutineQuiet: "Last session in this browser",
  flow: "Flow",
  flow1t: "Card",
  flow1d: "Athlete, goal, equipment, and blocks. The card saves itself.",
  flow2t: "Forge",
  flow2d: "Biomechanics copy + ARMATUS sketches.",
  flow3t: "Deliver",
  flow3d: "PDF, WhatsApp, or a reading link.",
  recentTitle: "Recent sessions",
  open: "Open",
  useAsBase: "Use as base",
  delete: "Delete",
  deleteConfirm: "Delete the session for",
  copying: "Copying…",

  composerEyebrow: "Session card",
  composerTitle: "Fill the card.",
  composerAccent: "We forge it.",
  composerLead:
    "Required fields keep briefs from going empty. The card saves itself in this browser. If you already have the text (WhatsApp, notes), use Free brief. Progress is real: copy first, then sketches.",
  coach: "Coach",
  coachPh: "Coach name",
  modeForm: "Card",
  modeBrief: "Free brief",
  client: "Athlete",
  clientPh: "Name or alias",
  objective: "Goal",
  objectivePh: "Strength, injury prevention, hypertrophy…",
  level: "Level",
  levelBeg: "Beginner",
  levelMid: "Intermediate",
  levelAdv: "Advanced",
  equipment: "Available equipment",
  equipmentPh: "Dumbbells, barbell, bands, bodyweight…",
  duration: "Duration",
  durationPh: "Only if the coach sets it",
  frequency: "Frequency",
  frequencyPh: "e.g. 2× per week",
  warmup: "Warm-up",
  warmupPh: "One movement per line. Include equipment and dose if you have them.",
  mainBlock: "Main block",
  mainPh: "One exercise per line, with sets × reps if you have them.",
  constraints: "Injuries or constraints",
  constraintsPh: "Sensitive shoulder, no axial load, avoid lumbar flexion…",
  notes: "Notes and videos",
  notesPh: "Extra cues or YouTube URLs pasted next to the exercise.",
  freeBrief: "Free brief",
  freeBriefPh:
    "Paste the full brief: client, goal, warm-up, and main block.",
  useExample: "Use example",
  generate: "Generate session",
  generating: "Generating…",
  hintCoach: "Enter your coach name to enable Generate.",
  hintBrief:
    "Fill athlete, goal, and at least one block — or paste a free brief.",
  statusReady: "Ready to generate",
  statusText: "Writing biomechanics copy…",
  statusBocetos: "Generating ARMATUS sketches…",
  statusBocetosFail: "sketch(es) pending: retry on each exercise.",
  statusPublish: "Publishing shareable link…",
  statusDone: "Session ready",
  statusError: "Error — you can generate again",
  errorCoach: "Enter the coach name before generating.",
  errorQuota:
    "Browser storage was full. We freed it: generate the session again.",
  errorTimeout: "If the brief is very long, shorten it and try again.",
  readyForm: "Card ready",

  routineFor: "Session for",
  leadClara:
    "Clear session: dosing, how to do it, mistakes to avoid, and sketches — easy to read on screen or in the PDF.",
  leadStudio:
    "Biomechanics protocol with dosing, technique, common mistakes, and ARMATUS sketches — ready to send to the athlete.",
  startRoutine: "Start session",
  pdfBusy: "Building PDF…",
  pdfClara: "Download light PDF",
  pdfStudio: "Download PDF",
  share: "Share",
  publishing: "Publishing…",
  shareLabel: "Link to this session",
  copyLink: "Copy link",
  shareHint:
    "Copy works now. Share uploads sketches for another browser or the athlete. If you see a Blob token error, BLOB_READ_WRITE_TOKEN is missing on Vercel.",
  copyOk:
    "Link copied. It only works in another browser after you press Share.",
  blocks: "Blocks",
  durationChip: "Duration",
  frequencyChip: "Frequency",
  levelChip: "Level",
  close: "Close",
  editHint: "Edit mode: adjust copy, order, and sketches.",
  claraHint:
    "Light appearance: white and orange, comfortable type. The PDF uses the same mode.",
  studioHint:
    "Dark appearance: black and orange. Switch to Light at the top right.",
  edit: "Edit",
  exitEdit: "Exit edit",
  askChanges: "Request changes",
  hideChanges: "Hide changes",
  save: "Save",
  newRoutine: "New session",
  cleanView: "Clean view",
  exercisesNav: "Exercises",
  dupFail: "Could not duplicate the session in this browser.",
  hideDraft: "There is an unapplied request. Hide anyway?",
  blobFail: "Could not publish. Check that Blob has a read-write token.",
  shareFail: "Could not share the session.",
  pdfFail: "Could not build the PDF.",
  regenTextFail: "Could not regenerate copy",
  regenImageFail: "Could not regenerate sketch",

  reviseTitle: "Request changes",
  reviseLead:
    "Describe the adjustment. We apply it on this session, without starting over. If you ask for new sketches, they are actually redrawn.",
  revisePh: `Examples:
• Drop intensity to beginner and reduce sets
• Swap Single-Leg RDL for a single-leg bridge
• Rewrite common mistakes on the chest press
• Regenerate warm-up sketches
• Make the copy simpler for adults`,
  apply: "Apply changes",
  applying: "Applying…",
  reviseReady: "Ready to revise",
  whatChanged: "What changed",
  shortcutBeginner: "Drop to beginner",
  shortcutAdult: "Copy for adults",
  shortcutWarmup: "Warm-up sketches",
  shortcutBeginnerPrompt:
    "Drop the whole session to beginner: fewer sets, lower RPE, longer rest. Keep the exercises.",
  shortcutAdultPrompt:
    "Shorten and simplify the copy so an adult can read it without fatigue: less jargon, shorter sentences, same biomechanics precision.",
  shortcutWarmupPrompt:
    "Regenerate only the warm-up sketches. Do not change the copy or the main block.",

  up: "Up",
  down: "Down",
  regenText: "Regenerate copy",
  regenTextBusy: "Rewriting…",
  regenImage: "Regenerate sketch",
  regenImageBusy: "Sketch…",
  remove: "Remove",
  doseLabel: "Recommended dose",
  sketchPending: "Sketch pending",
  sketchRetry: "Retry sketch",
  sketchBusy: "Generating sketch…",
  purpose: "Purpose and focus",
  muscles: "Muscular focus",
  howTo: "How to perform it",
  mistakes: "Common mistakes",
  benefit: "Benefit",
  support: "Further support",
  supportEmpty: "No support links.",
  addMistake: "Add mistake",
  removeMistake: "Remove",

  errTitle: "Something failed",
  errBody:
    "The session on screen was not lost if it was already saved. Try again or reopen the studio.",
  retry: "Try again",
  home: "Home",
  notFound: "Page not found",
  notFoundBody:
    "That route does not exist in Coach Studio. Go home or create a session.",
  loadingRoutine: "Loading session…",
  missingTitle: "Session not found",
  missingBody:
    "This link is not published yet, or the session only existed in the coach’s browser. Ask them to open it and press Share.",
  draftSaved: "Card saved in this browser",
  clearDraft: "Clear card",
  doseSheet: "Dose sheet",
  copyDose: "Copy dose",
  whatsapp: "WhatsApp",
  doseCopied: "Dose copied. Paste it into WhatsApp or a note.",
  athleteLink: "Reading link (athlete)",
  copyAthlete: "Copy reading link",
  athleteHint:
    "That link opens the session without coach controls: the adult reads and downloads the PDF.",
  athleteBanner: "Reading view. The athlete does not see editing or change requests.",
  openCoachView: "Open coach view",
  undoChange: "Undo last request",
  undoNone: "There is no recent request to undo.",
  undoOk: "The previous version was restored.",
  searchRecent: "Search athlete or goal",
  noRecentMatch: "No session matches that search.",
};

export const COPY = { es, en } as const;

export type CopyKey = keyof typeof es;

export function tx(locale: Locale, key: CopyKey): string {
  return COPY[locale][key];
}
