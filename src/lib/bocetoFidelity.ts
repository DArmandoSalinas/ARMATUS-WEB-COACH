/**
 * Title-first lift classification for bocetos.
 *
 * Coaching intro/purpose/steps must NEVER change the movement family.
 * That is how "press de hombro en máquina" was drawn as a seated row:
 * the word "hombro" in the blob was treated as band rotation, then the
 * image model copied a pulling pose from character refs.
 */

export type MovementFamily =
  | "vertical-push"
  | "horizontal-push"
  | "horizontal-pull"
  | "vertical-pull"
  | "rotation"
  | "floor-mobility"
  | "other";

export type EquipmentFamily =
  | "machine"
  | "cable"
  | "dumbbell"
  | "barbell"
  | "band"
  | "bodyweight"
  | "unknown";

export type LiftKind =
  | "shoulder-press"
  | "chest-press"
  | "row"
  | "pulldown"
  | "pullup"
  | "shoulder-rotation"
  | "floor-mobility"
  | "other";

export type LiftClass = {
  kind: LiftKind;
  movement: MovementFamily;
  equipment: EquipmentFamily;
};

export type BriefSlice = {
  equipment: string;
  forbidEquipment: string[];
  bodyPosition: string;
  movementPattern: string;
  equipmentLockLine: string;
};

const FLOOR_RE =
  /\b(90\s*[/\-]\s*90|hip\s*switch|cambio\s+de\s+cadera|shin\s*box|world'?s?\s*greatest|pigeon|paloma|cat[\s-]?cow|gato\s*vaca|hip\s*airplane|90\s*90)\b/i;

const SHOULDER_PRESS_RE =
  /\b(press\s+de\s+hombro|shoulder\s*press|overhead\s*press|press\s*militar|military\s*press|ohp)\b/i;

const CHEST_PRESS_RE =
  /\b(press\s+de\s+pecho|press\s+pecho|chest\s*press|bench\s*press|press\s+de\s+banca|press\s*banca)\b/i;

const ROW_RE =
  /\b(seated\s*(cable\s*)?row|cable\s*row|barbell\s*row|bent[- ]?over\s*row|remo(?:\s|$)|inverted\s*row|remo\s+invertido)\b/i;

const PULLDOWN_RE = /\b(jal[oó]n\s+al\s+pecho|lat\s*pulldown|pulldown)\b/i;

const PULLUP_RE = /\b(pull[- ]?ups?|chin[- ]?ups?|dominadas?)\b/i;

export const PRESS_NOT_ROW_FORBID = [
  "cable row",
  "seated cable row",
  "seated row",
  "horizontal pull",
  "D-handles pulled toward the chest",
  "resistance band",
  "liga elástica",
  "face pull",
  "remo",
  "pulling handles to the torso",
  "standing cable crossover",
];

const VERTICAL_PUSH =
  "VERTICAL PUSH — load travels UP above the head. NEVER a row, NEVER pulling handles to the chest.";

const HORIZONTAL_PUSH =
  "PUSH — load travels AWAY from the torso. NEVER a row.";

const HORIZONTAL_PULL = "PULL — load travels toward the body.";

const ROTATION_MOVE =
  "shoulder rotation with the elbow at 90° — not a press, not a row.";

const MACHINE_SHOULDER_PRESS =
  "selectorized seated shoulder press machine: upright seat, full back pad, two independent lever handles at ear/shoulder height that travel STRAIGHT UP. Typical Hammer-Strength / pin-loaded shoulder press. Not cables, not a bar behind the neck.";

const MACHINE_CHEST_PRESS =
  "SEATED CHEST PRESS MACHINE: back against the pad, two machine handles at chest height. Athlete PUSHES the handles FORWARD away from the chest. Draw the machine frame. This is a PRESS — not a seated row.";

const BAND_ER =
  "resistance band / liga elástica for standing rotation: elbow flexed 90°, upper arm pinned to the side of the torso, band providing rotational resistance — NO dumbbell, NO barbell, NOT a press, NOT a row";

const FLOOR_NONE =
  "NONE — bodyweight on the floor. Seated or kneeling as the drill requires. No handles, cables, bands, or weights unless the TITLE names them.";

function titleBlob(name: string, nameEn?: string | null): string {
  return [name, nameEn].filter(Boolean).join(" | ");
}

function isShoulderRotationTitle(t: string): boolean {
  if (SHOULDER_PRESS_RE.test(t) || CHEST_PRESS_RE.test(t)) return false;
  if (
    /\b(rotator\s*cuff|manguito\s+rotador|external\s*rotation|internal\s*rotation|rotaci[oó]n\s+(externa|interna))\b/i.test(
      t,
    )
  ) {
    return true;
  }
  return /\b(rotaci[oó]n(?:\s+de)?\s+(?:el\s+)?hombro|hombro.{0,24}rotaci[oó]n|shoulder\s+rotation|rotation\s+of\s+(?:the\s+)?shoulder)\b/i.test(
    t,
  );
}

function detectKind(t: string): LiftKind {
  if (FLOOR_RE.test(t)) return "floor-mobility";
  if (isShoulderRotationTitle(t)) return "shoulder-rotation";
  if (SHOULDER_PRESS_RE.test(t)) return "shoulder-press";
  if (CHEST_PRESS_RE.test(t)) return "chest-press";
  if (PULLDOWN_RE.test(t)) return "pulldown";
  if (PULLUP_RE.test(t)) return "pullup";
  if (ROW_RE.test(t)) return "row";
  return "other";
}

function movementForKind(kind: LiftKind): MovementFamily {
  switch (kind) {
    case "shoulder-press":
      return "vertical-push";
    case "chest-press":
      return "horizontal-push";
    case "row":
      return "horizontal-pull";
    case "pulldown":
    case "pullup":
      return "vertical-pull";
    case "shoulder-rotation":
      return "rotation";
    case "floor-mobility":
      return "floor-mobility";
    default:
      return "other";
  }
}

function detectEquipmentFamily(t: string, kind: LiftKind): EquipmentFamily {
  const machine =
    /\b(m[aá]quina|machine|selectorizad[oa]|hammer\s*strength|pin[\s-]?loaded)\b/i.test(
      t,
    );
  const cable = /\b(polea|cables?)\b/i.test(t);
  const dumbbell = /\b(mancuernas?|dumbbells?|\bdb\b)\b/i.test(t);
  const barbell = /\b(barra|barbell|olympic\s*bar)\b/i.test(t);
  const band = /\b(banda|band|liga|ligas|theraband|elastic[oa]?s?)\b/i.test(t);

  if (kind === "shoulder-press" || kind === "chest-press") {
    if (machine) return "machine";
    if (dumbbell) return "dumbbell";
    if (barbell) return "barbell";
    if (cable) return "cable";
    if (band) return "band";
    return "unknown";
  }
  if (kind === "shoulder-rotation") {
    if (dumbbell && !band) return "dumbbell";
    return "band";
  }
  if (kind === "floor-mobility") return "bodyweight";
  if (kind === "pullup") return machine || cable ? "machine" : "bodyweight";
  if (kind === "pulldown") return "machine";
  if (kind === "row") {
    if (dumbbell) return "dumbbell";
    if (barbell) return "barbell";
    if (cable) return "cable";
    if (machine) return "machine";
    return "unknown";
  }
  if (machine) return "machine";
  if (cable) return "cable";
  if (dumbbell) return "dumbbell";
  if (barbell) return "barbell";
  if (band) return "band";
  return "unknown";
}

/** Classify from exercise NAME only. Ignore intro / purpose / steps. */
export function classifyLift(
  name: string,
  nameEn?: string | null,
): LiftClass {
  const t = titleBlob(name, nameEn);
  const kind = detectKind(t);
  return {
    kind,
    movement: movementForKind(kind),
    equipment: detectEquipmentFamily(t, kind),
  };
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function lockLine(brief: BriefSlice): string {
  return `DRAW ONLY: ${brief.equipment}. MOVEMENT: ${brief.movementPattern}. BODY: ${brief.bodyPosition}. DO NOT DRAW: ${brief.forbidEquipment.join(", ") || "any other implement"}.`;
}

/**
 * Hard overrides for lifts that have been drawn as the wrong pattern.
 * Runs after heuristic detection so a bad blob cannot win.
 */
export function applyLiftOverride<T extends BriefSlice>(
  brief: T,
  cls: LiftClass,
): T {
  let next: T = {
    ...brief,
    movementPattern: movementCopy(cls, brief.movementPattern),
  };

  if (cls.kind === "shoulder-press" && cls.equipment === "machine") {
    next = {
      ...next,
      equipment: MACHINE_SHOULDER_PRESS,
      forbidEquipment: unique([
        ...PRESS_NOT_ROW_FORBID,
        "barbell overhead press",
        "dumbbells",
        "cable towers",
        "polea",
      ]),
      bodyPosition:
        "UPRIGHT seated (torso vertical), full back on the pad, mid-rep elbows ~90°, handles at ear height pressing straight up — not reclined, not behind-the-neck, not locked out",
      movementPattern: VERTICAL_PUSH,
    };
  } else if (cls.kind === "chest-press" && cls.equipment === "machine") {
    next = {
      ...next,
      equipment: MACHINE_CHEST_PRESS,
      forbidEquipment: unique([
        ...PRESS_NOT_ROW_FORBID,
        "barbell",
        "dumbbells",
        "cable fly",
      ]),
      bodyPosition:
        "SEATED on the chest-press machine, back against the pad, pushing handles forward",
      movementPattern: HORIZONTAL_PUSH,
    };
  } else if (cls.kind === "shoulder-press") {
    next = {
      ...next,
      forbidEquipment: unique([
        ...next.forbidEquipment,
        ...PRESS_NOT_ROW_FORBID,
      ]),
      movementPattern: VERTICAL_PUSH,
    };
  } else if (cls.kind === "chest-press") {
    next = {
      ...next,
      forbidEquipment: unique([
        ...next.forbidEquipment,
        ...PRESS_NOT_ROW_FORBID,
      ]),
      movementPattern: HORIZONTAL_PUSH,
    };
  } else if (cls.kind === "row") {
    next = { ...next, movementPattern: HORIZONTAL_PULL };
  } else if (cls.kind === "shoulder-rotation") {
    if (
      /press machine|overhead press|cable row|seated row/i.test(next.equipment)
    ) {
      next = {
        ...next,
        equipment: BAND_ER,
        forbidEquipment: [
          "dumbbell",
          "barbell",
          "shoulder press machine",
          "cable row",
        ],
        bodyPosition: "standing, elbow at side at 90°",
        movementPattern: ROTATION_MOVE,
      };
    } else {
      next = { ...next, movementPattern: ROTATION_MOVE };
    }
  } else if (cls.kind === "floor-mobility") {
    if (/\b(cable|polea|row|remo|D-handle)\b/i.test(next.equipment)) {
      next = {
        ...next,
        equipment: FLOOR_NONE,
        forbidEquipment: [
          "cable",
          "polea",
          "D-handle",
          "row",
          "remo",
          "pulling a handle",
        ],
        bodyPosition:
          "seated on the floor, both knees and hips at ~90°, torso upright — NOT standing, NOT pulling",
        movementPattern: "floor mobility — not a press, not a row.",
      };
    }
  }

  return { ...next, equipmentLockLine: lockLine(next) };
}

function movementCopy(cls: LiftClass, fallback: string): string {
  switch (cls.movement) {
    case "vertical-push":
      return VERTICAL_PUSH;
    case "horizontal-push":
      return HORIZONTAL_PUSH;
    case "horizontal-pull":
    case "vertical-pull":
      return HORIZONTAL_PULL.replace(
        "toward the body",
        cls.movement === "vertical-pull"
          ? "down toward the body / from overhead"
          : "toward the body",
      );
    case "rotation":
      return ROTATION_MOVE;
    case "floor-mobility":
      return "floor mobility — not a press, not a row.";
    default:
      return fallback;
  }
}

/**
 * Returns a reason if the brief would tell the illustrator to draw
 * the wrong pattern. Used by tests and as a last-chance guard.
 */
export function briefFidelityError(
  brief: Pick<BriefSlice, "equipment" | "movementPattern" | "bodyPosition">,
  cls: LiftClass,
): string | null {
  const drawn = `${brief.equipment} ${brief.movementPattern} ${brief.bodyPosition}`;

  if (cls.kind === "shoulder-press" || cls.kind === "chest-press") {
    if (/liga elástica for standing/i.test(brief.equipment)) {
      return `${cls.kind} brief is band rotation`;
    }
    if (
      /\b(seated cable row|cable row|face pull)\b/i.test(brief.equipment) &&
      !/\bPUSHES\b/i.test(brief.equipment)
    ) {
      return `${cls.kind} brief is a row`;
    }
    if (!/\b(PUSH|press|overhead|UP|FORWARD)\b/i.test(drawn)) {
      return `${cls.kind} brief is not a push`;
    }
  }

  if (cls.kind === "shoulder-press" && cls.equipment === "machine") {
    if (!/\bmachine\b/i.test(brief.equipment)) {
      return "machine shoulder press missing machine";
    }
    if (!/\b(SEATED|UPRIGHT seated)\b/i.test(drawn)) {
      return "machine shoulder press is not seated";
    }
    if (!/\b(OVERHEAD|UP|straight up|ear height)\b/i.test(drawn)) {
      return "machine shoulder press is not overhead";
    }
  }

  if (cls.kind === "row" && /\bVERTICAL PUSH\b/i.test(brief.movementPattern)) {
    return "row brief is a vertical press";
  }

  if (
    cls.kind === "shoulder-rotation" &&
    /\b(PRESS MACHINE|OVERHEAD PRESS)\b/i.test(brief.equipment)
  ) {
    return "rotation brief is a press";
  }

  if (
    cls.kind === "floor-mobility" &&
    /\b(cable row|D-handle|polea)\b/i.test(brief.equipment) &&
    !/\bNONE\b/i.test(brief.equipment)
  ) {
    return "floor drill brief is a cable row";
  }

  return null;
}

/** Library JPGs that are pulling patterns. A press must never reuse these. */
const PULL_LIBRARY_KEYS = [
  "row",
  "uprightrow",
  "facepull",
  "invertedrow",
  "pullup",
  "latpulldown",
  "straightarm",
] as const;

const PUSH_LIBRARY_KEYS = [
  "overhead",
  "bench",
  "pushup",
  "dip",
  "landmine",
  "hspu",
  "thruster",
  "devilpress",
] as const;

const ROTATION_LIBRARY_KEYS = ["externalrotation"] as const;

const FLOOR_LIBRARY_KEYS = [
  "hip90",
  "catcow",
  "pigeon",
  "wgs",
  "openbook",
  "inchworm",
  "glutebridge",
] as const;

function inKeys(key: string, keys: readonly string[]): boolean {
  return keys.includes(key);
}

/**
 * True when a library boceto key depicts a different movement than the title.
 * Press → row/pullup/pulldown is the failure we must never ship.
 */
export function libraryAssetConflictsWithLift(
  key: string,
  cls: LiftClass,
): boolean {
  const isPush =
    cls.movement === "vertical-push" || cls.movement === "horizontal-push";
  const isPull =
    cls.movement === "vertical-pull" || cls.movement === "horizontal-pull";

  if (isPush && inKeys(key, PULL_LIBRARY_KEYS)) return true;
  if (isPull && inKeys(key, PUSH_LIBRARY_KEYS)) return true;
  if (cls.kind === "shoulder-press" && (key === "bench" || key === "chestfly")) {
    return true;
  }
  if (cls.kind === "chest-press" && key === "overhead") return true;
  if (cls.kind === "pulldown" && key === "pullup") return true;
  if (cls.kind === "pullup" && key === "latpulldown") return true;
  if (
    cls.kind === "shoulder-rotation" &&
    (inKeys(key, PUSH_LIBRARY_KEYS) || inKeys(key, PULL_LIBRARY_KEYS))
  ) {
    return true;
  }
  if (cls.kind === "shoulder-press" && inKeys(key, ROTATION_LIBRARY_KEYS)) {
    return true;
  }
  if (
    cls.kind === "floor-mobility" &&
    (inKeys(key, PUSH_LIBRARY_KEYS) || inKeys(key, PULL_LIBRARY_KEYS))
  ) {
    return true;
  }
  if (
    cls.kind !== "floor-mobility" &&
    cls.kind !== "other" &&
    inKeys(key, FLOOR_LIBRARY_KEYS)
  ) {
    return true;
  }
  return false;
}

/**
 * Image-to-image refs copy the SOURCE POSE (squat, pull-up, push-up).
 * Presses, machines, floor drills, and cuff work must generate from text
 * so a hanging pull cannot become a fake seated row.
 */
export function shouldSkipCharacterReferences(cls: LiftClass): boolean {
  return (
    cls.movement === "vertical-push" ||
    cls.movement === "horizontal-push" ||
    cls.kind === "floor-mobility" ||
    cls.kind === "shoulder-rotation" ||
    cls.equipment === "machine"
  );
}

export function isPoseSensitiveLift(cls: LiftClass): boolean {
  return cls.kind !== "other";
}

const PULL_LEAK_RE =
  /\b(remo|seated\s+row|cable\s+row|face\s*pull|jal[oó]n|pull[- ]?ups?|D-handle|inverted\s*row)\b/i;
const ROTATION_LEAK_RE =
  /\b(rotaci[oó]n\s+(externa|interna)|external\s*rotation|internal\s*rotation|manguito)\b/i;
const PRESS_LEAK_RE =
  /\b(press\s+de\s+hombro|shoulder\s*press|overhead\s*press|press\s*militar)\b/i;

/** True when coaching copy would tell the illustrator to draw a different lift. */
export function coachingConflictsWithLift(
  text: string | undefined | null,
  cls: LiftClass,
): boolean {
  const t = (text || "").trim();
  if (!t) return false;
  const positive = t.replace(
    /\b(no|not|never|nunca|sin)\s+(a\s+|un\s+|una\s+)?[\wáéíóúñ-]+(?:\s+[\wáéíóúñ-]+)?/gi,
    " ",
  );
  if (cls.movement === "vertical-push" || cls.movement === "horizontal-push") {
    return PULL_LEAK_RE.test(positive) || ROTATION_LEAK_RE.test(positive);
  }
  if (cls.kind === "row" || cls.kind === "pulldown" || cls.kind === "pullup") {
    return PRESS_LEAK_RE.test(positive);
  }
  if (cls.kind === "floor-mobility") {
    return PULL_LEAK_RE.test(positive);
  }
  if (cls.kind === "shoulder-rotation") {
    return PRESS_LEAK_RE.test(positive) || PULL_LEAK_RE.test(positive);
  }
  return false;
}

export type ImageCoaching = {
  caption: string;
  steps: { title: string; body: string }[];
  muscles: string[];
};

/** Drop intro/purpose and any step/caption that leaks the wrong pattern. */
export function imageCoachingForPrompt(
  ctx: {
    sketchCaption?: string;
    intro?: string;
    purpose?: string;
    muscles?: string[];
    steps?: { title: string; body: string }[];
  },
  cls: LiftClass,
): ImageCoaching {
  const muscles = (ctx.muscles || []).slice(0, 6);
  if (cls.kind === "other") {
    return {
      caption: ctx.sketchCaption || "",
      steps: (ctx.steps || []).slice(0, 4),
      muscles,
    };
  }
  const caption = coachingConflictsWithLift(ctx.sketchCaption, cls)
    ? ""
    : ctx.sketchCaption || "";
  const steps = (ctx.steps || [])
    .filter((s) => !coachingConflictsWithLift(`${s.title} ${s.body}`, cls))
    .slice(0, 4);
  return { caption, steps, muscles };
}

export function liftLabelEn(cls: LiftClass): string {
  switch (cls.kind) {
    case "shoulder-press":
      return cls.equipment === "machine"
        ? "seated machine shoulder press"
        : "overhead shoulder press";
    case "chest-press":
      return cls.equipment === "machine"
        ? "seated machine chest press"
        : "bench / chest press";
    case "row":
      return "seated or bent-over row";
    case "pulldown":
      return "lat pulldown";
    case "pullup":
      return "pull-up";
    case "shoulder-rotation":
      return "standing band shoulder rotation";
    case "floor-mobility":
      return "floor mobility drill";
    default:
      return "the named lift";
  }
}

export function visualPoseLock(cls: LiftClass): string {
  if (cls.kind === "shoulder-press" && cls.equipment === "machine") {
    return `MID-REP seated machine shoulder press, 3/4 front-side view.
Athlete sits UPRIGHT (torso vertical), whole back glued to the pad — not reclined, not hunched, not standing.
Head neutral, eyes forward. Feet flat, knees ~90°.
Two independent vertical handles beside the shoulders at EAR height (not a bar behind the neck).
Elbows bent ~90°, wrists stacked over elbows, forearms vertical, pressing STRAIGHT UP. Not a chest press, not a row, not lockout behind the head.
Orange glow on deltoids and triceps. Shirtless, shorts, sneakers.
Athlete + machine centered on pure black. The rest of the frame is empty black.`;
  }
  if (cls.kind === "shoulder-press") {
    return `MID-REP overhead press: athlete UPRIGHT, pressing the load vertically from ear height toward lockout. Elbows ~90°, not a row, not behind the neck.`;
  }
  if (cls.kind === "chest-press" && cls.equipment === "machine") {
    return `MID-REP seated chest-press machine: upright on the pad, handles at chest height, PUSHING FORWARD. Elbows ~90°. Not a row.`;
  }
  if (cls.kind === "chest-press") {
    return `MID-REP bench press: lying supine, pressing the load up off the chest.`;
  }
  if (cls.kind === "row") {
    return `MID-REP row: athlete PULLING the load toward the torso.`;
  }
  if (cls.kind === "pulldown") {
    return `MID-REP lat pulldown: seated, wide bar pulling down to the upper chest.`;
  }
  if (cls.kind === "pullup") {
    return `MID-REP pull-up: hanging from a fixed bar, pulling the chest toward the bar.`;
  }
  if (cls.kind === "shoulder-rotation") {
    return `Standing, elbow glued at 90° to the ribs, rotating the forearm against a band. Not a press, not a row.`;
  }
  if (cls.kind === "floor-mobility") {
    return `Athlete on the FLOOR as the drill requires. Not standing, not pulling a cable.`;
  }
  return "one clear mid-rep frame of the named lift.";
}

export type LiftQaSpec = {
  mustShow: string;
  mustNotShow: string;
  failIf: string;
};

export function qaSpecForLift(cls: LiftClass, _title?: string): LiftQaSpec {
  const lift = liftLabelEn(cls);
  const noText =
    "ANY letters, words, titles, captions, muscle legends, infographic columns, watermarks, numbers";
  if (cls.kind === "shoulder-press" && cls.equipment === "machine") {
    return {
      mustShow: `silent sketch of ${lift}: UPRIGHT seated, back flat on the pad, mid-rep elbows ~90°, handles at ear height pressing vertically up, machine frame visible. Athlete only.`,
      mustNotShow: `${noText}; seated cable row; reclined / incline torso; behind-the-neck press; arms locked out behind the head`,
      failIf:
        "there is ANY text in the image, OR the torso is reclined, OR it is a row/pull, OR the press is behind the neck",
    };
  }
  if (cls.kind === "shoulder-press") {
    return {
      mustShow: `silent sketch of ${lift}: athlete PUSHING the load UP from ear height, elbows ~90° mid-rep`,
      mustNotShow: `${noText}; seated cable row; pulling to the chest`,
      failIf:
        "there is ANY text in the image, OR the athlete is pulling toward the torso instead of pressing up",
    };
  }
  if (cls.kind === "chest-press" && cls.equipment === "machine") {
    return {
      mustShow: `silent sketch of ${lift}: upright on the pad, PUSHING handles FORWARD`,
      mustNotShow: `${noText}; seated cable row; pulling to the torso`,
      failIf: "there is ANY text, OR the athlete is pulling handles toward the body",
    };
  }
  if (cls.kind === "chest-press") {
    return {
      mustShow: `silent sketch of ${lift}: PUSHING the load AWAY from the chest`,
      mustNotShow: `${noText}; seated row; overhead press unless the title is overhead`,
      failIf: "there is ANY text, OR the athlete is pulling instead of pressing",
    };
  }
  if (cls.kind === "row") {
    return {
      mustShow: `silent sketch of ${lift}: PULLING the load toward the torso`,
      mustNotShow: `${noText}; shoulder press; overhead press`,
      failIf: "there is ANY text, OR the athlete is pressing overhead instead of rowing",
    };
  }
  if (cls.kind === "pulldown") {
    return {
      mustShow: `silent sketch of ${lift}: bar pulled down to the upper chest`,
      mustNotShow: `${noText}; bodyweight pull-up hang; shoulder press`,
      failIf: "there is ANY text, OR it is a hanging pull-up or a press",
    };
  }
  if (cls.kind === "pullup") {
    return {
      mustShow: `silent sketch of ${lift}: hanging from a fixed bar`,
      mustNotShow: `${noText}; lat pulldown machine; shoulder press`,
      failIf: "there is ANY text, OR it is a pulldown machine or a press",
    };
  }
  if (cls.kind === "shoulder-rotation") {
    return {
      mustShow: `silent sketch of standing IR/ER, elbow at 90° at the side`,
      mustNotShow: `${noText}; shoulder press machine; seated row; overhead press`,
      failIf: "there is ANY text, OR it is a press or a row",
    };
  }
  if (cls.kind === "floor-mobility") {
    return {
      mustShow: `silent sketch of the athlete on the FLOOR`,
      mustNotShow: `${noText}; cable row; D-handle; standing pull`,
      failIf: "there is ANY text, OR the athlete is standing and pulling a cable",
    };
  }
  return {
    mustShow: `silent sketch of ${lift}`,
    mustNotShow: noText,
    failIf: "there is ANY text in the image, OR it is a different exercise",
  };
}

/** Opening block of the image prompt — must come BEFORE character/style. */
export function imageHardLockBlock(opts: {
  title: string;
  cls: LiftClass;
  brief: BriefSlice;
}): string {
  const qa = qaSpecForLift(opts.cls, opts.title);
  const lift = liftLabelEn(opts.cls);
  return `=== HARD LOCK (read first; violating this = FAILED image) ===
SILENT SKETCH: the output pixels contain ZERO letters, words, numbers, labels, arrows-with-captions, or legends. If a coach can read anything, you FAILED.
LIFT TO DEPICT (do not write this): ${lift}
POSE: ${visualPoseLock(opts.cls)}
MOVEMENT: ${opts.brief.movementPattern}
EQUIPMENT: ${opts.brief.equipment}
MUST NOT DRAW: ${qa.mustNotShow}
FAIL IF: ${qa.failIf}`;
}

export function imagePromptFidelityError(
  prompt: string,
  cls: LiftClass,
): string | null {
  const lockIdx = prompt.search(/=== HARD LOCK/i);
  const charIdx = prompt.search(/=== (CHARACTER|STYLE)/i);
  if (lockIdx < 0) return "image prompt missing HARD LOCK";
  if (charIdx >= 0 && charIdx < lockIdx) {
    return "character/style block appears before HARD LOCK";
  }
  if (!/SILENT SKETCH|ZERO letters/i.test(prompt)) {
    return "image prompt missing no-text lock";
  }
  if (/\n(INTRO|CAPTION|TECHNIQUE STEPS|PURPOSE):/i.test(prompt)) {
    return "image prompt still includes coaching fields that get painted as text";
  }
  if (cls.kind === "shoulder-press" || cls.kind === "chest-press") {
    const head = prompt.slice(0, 2200);
    if (!/\b(PUSH|OVERHEAD|FORWARD|straight up)\b/i.test(head)) {
      return "press prompt missing push language in the lock";
    }
  }
  if (
    cls.kind === "shoulder-press" &&
    cls.equipment === "machine" &&
    !/UPRIGHT|elbows ~90|ear height/i.test(prompt)
  ) {
    return "machine press prompt missing upright mid-rep pose";
  }
  return null;
}
