import {
  applyLiftOverride,
  briefFidelityError,
  classifyLift,
  PRESS_NOT_ROW_FORBID,
} from "./bocetoFidelity";

export type BocetoPromptContext = {
  name: string;
  nameEn?: string | null;
  sketchCaption: string;
  intro?: string;
  purpose?: string;
  muscles?: string[];
  steps?: { title: string; body: string }[];
  commonMistakes?: string[];
};

export type VisualBrief = {
  /** Single locked variation for the illustrator */
  primaryVariation: string;
  /** Exact equipment to draw */
  equipment: string;
  /** Explicit forbidden substitutes */
  forbidEquipment: string[];
  /** Laterality */
  laterality: "bilateral" | "unilateral-left-or-right" | "unknown";
  /** Body position */
  bodyPosition: string;
  /** Push vs pull vs rotation — stops press drawings from becoming rows */
  movementPattern: string;
  /** Short hard lock line for the image model */
  equipmentLockLine: string;
};

function blob(ctx: BocetoPromptContext): string {
  return [
    ctx.name,
    ctx.nameEn,
    ctx.sketchCaption,
    ctx.intro,
    ctx.purpose,
    ...(ctx.steps || []).map((s) => `${s.title} ${s.body}`),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Prefer the first option when the coach wrote "A o B" / "A or B". */
function pickPrimaryName(name: string, nameEn?: string | null): string {
  const raw = `${name}${nameEn ? ` (${nameEn})` : ""}`;
  const first = raw.split(/\s+o\s+|\s+or\s+|\s+\/\s+/i)[0]?.trim() || raw;
  return first.replace(/\s+/g, " ").trim();
}

function hasDumbbell(t: string): boolean {
  return /\b(mancuernas?|dumbbells?|\bdb\b)\b/i.test(t);
}

function hasBarbell(t: string): boolean {
  return /\b(barra|barbell|olympic\s*bar)\b/i.test(t);
}

function hasBand(t: string): boolean {
  return /\b(banda|band|liga|ligas|theraband|elastic[oa]?s?)\b/i.test(t);
}

function hasMachine(t: string): boolean {
  return /\b(m[aá]quina|machine|selectorizad[oa]|hammer\s*strength|pin[\s-]?loaded)\b/i.test(
    t,
  );
}

function isShoulderPress(t: string): boolean {
  return /\b(press\s+de\s+hombro|shoulder\s*press|overhead\s*press|press\s*militar|military\s*press|ohp)\b/i.test(
    t,
  );
}

function isChestPress(t: string): boolean {
  return /\b(press\s+de\s+pecho|press\s+pecho|chest\s*press|bench\s*press|press\s+de\s+banca|press\s*banca)\b/i.test(
    t,
  );
}

/**
 * Cuff / IR-ER work only.
 * Never match on bare "hombro" / "shoulder" — that turned machine
 * shoulder press into a band rotation (then a fake seated row).
 */
function isShoulderRotation(t: string): boolean {
  if (isShoulderPress(t) || isChestPress(t)) return false;
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

/** Floor drills that must never reuse a standing/pulling library JPG. */
const FLOOR_MOBILITY_RE =
  /\b(90\s*[/\-]\s*90|hip\s*switch|cambio\s+de\s+cadera|shin\s*box|world'?s?\s*greatest|pigeon|paloma|cat[\s-]?cow|gato\s*vaca|hip\s*airplane|90\s*90)\b/i;

export function isFloorMobilityText(text: string): boolean {
  return FLOOR_MOBILITY_RE.test(text);
}

function isHipContext(text: string): boolean {
  return (
    isFloorMobilityText(text) ||
    /\b(cadera|hips?|gl[uú]teo|glute)\b/i.test(text)
  );
}

function detectEquipment(text: string): {
  equipment: string;
  forbid: string[];
} {
  const t = text;

  if (isFloorMobilityText(t)) {
    return {
      equipment:
        "NONE — bodyweight on the floor. Seated or kneeling as the drill requires. No handles, cables, bands, or weights unless the TITLE names them.",
      forbid: [
        "cable",
        "polea",
        "D-handle",
        "row",
        "remo",
        "pulling a handle",
        "dumbbell",
        "barbell",
        "standing cable row",
        "shoulder band rotation",
      ],
    };
  }

  // Title wins: "press de hombro en máquina" is a seated MACHINE PRESS,
  // never a cable row and never band IR/ER (those used to match on "hombro").
  if (isShoulderPress(t) && hasMachine(t) && !hasDumbbell(t) && !hasBarbell(t)) {
    return {
      equipment:
        "SEATED SHOULDER PRESS MACHINE (selectorized / guided levers): back against the pad, two machine handles at shoulder height. Athlete PUSHES the handles VERTICALLY OVERHEAD to lockout. Draw the machine frame. Mid-rep = arms extending UP. This is a MACHINE PRESS — not cables, not a row.",
      forbid: [
        ...PRESS_NOT_ROW_FORBID,
        "barbell overhead press",
        "dumbbells",
        "cable towers",
        "polea",
      ],
    };
  }

  if (
    isChestPress(t) &&
    hasMachine(t) &&
    !hasDumbbell(t) &&
    !hasBarbell(t) &&
    !/\b(banca|bench)\b/i.test(t)
  ) {
    return {
      equipment:
        "SEATED CHEST PRESS MACHINE: back against the pad, two machine handles at chest height. Athlete PUSHES the handles FORWARD away from the chest. Draw the machine frame. This is a PRESS — not a seated row.",
      forbid: [...PRESS_NOT_ROW_FORBID, "barbell", "dumbbells", "cable fly"],
    };
  }

  // --- Shoulder IR / ER (warm-up default = resistance band) ---
  // Hip rotation (90/90, cadera) is NOT this pattern.
  // Do NOT match bare "hombro"/"shoulder" — press de hombro ≠ rotación.
  if (!isHipContext(t) && isShoulderRotation(t)) {
    const isInternal = /\b(interna|internal)\b/i.test(t);
    const isExternal = /\b(externa|external)\b/i.test(t);
    const motion = isInternal
      ? "internal rotation"
      : isExternal
        ? "external rotation"
        : "rotation";
    if (hasDumbbell(t) && !hasBand(t)) {
      return {
        equipment: `ONE light dumbbell for side-lying or standing ${motion} (elbow glued at 90°)`,
        forbid: [
          "barbell",
          "cable stack",
          "two dumbbells",
          "bench press setup",
        ],
      };
    }
    // Default + band: standing band IR/ER
    return {
      equipment: `resistance band / liga elástica for standing ${motion}: elbow flexed 90°, upper arm pinned to the side of the torso, band providing rotational resistance — NO dumbbell, NO barbell, NOT side-lying unless the title says tumbado/sidelying`,
      forbid: [
        "dumbbell",
        "mancuerna",
        "barbell",
        "cable stack",
        "side-lying dumbbell external rotation",
        "bench press",
      ],
    };
  }

  // Order: most specific first
  if (/\bpec\s*deck\b/i.test(t) || /\bfly\s*machine\b/i.test(t)) {
    return {
      equipment:
        "seated pec-deck / fly machine with padded arm levers (NOT cable towers, NOT free dumbbells)",
      forbid: [
        "cable crossover",
        "cable fly",
        "poleas",
        "dumbbell fly on bench",
        "barbell",
      ],
    };
  }
  if (
    /\baperturas?\s+en\s+m[aá]quina\b/i.test(t) &&
    !/\bpolea|cable|crossover\b/i.test(t)
  ) {
    return {
      equipment: "seated pec-deck machine with arm pads",
      forbid: ["cable crossover", "standing cable fly", "dumbbells", "barbell"],
    };
  }
  if (
    /\b(cable\s*(chest\s*)?fly|crossover|cruces?\s+(en|de)\s+poleas?|aperturas?\s+(en|de)\s+poleas?|cruce\s+de\s+poleas?)\b/i.test(
      t,
    )
  ) {
    return {
      equipment:
        "dual high cable towers with D-handles (standing cable fly / cruce de poleas)",
      forbid: ["pec deck machine", "dumbbells", "barbell", "seated fly machine"],
    };
  }
  if (/\b(dips?|fondos?\s+en\s+paralelas?|paralelas?)\b/i.test(t)) {
    return {
      equipment: "parallel dip bars / paralelas (bodyweight dips)",
      forbid: ["bench dips only", "cable pushdown", "machine dip unless named"],
    };
  }

  // Dumbbell chest / bench press (must beat generic "bench press" heuristics)
  if (
    (/\b(press\s+de\s+pecho|press\s+pecho|chest\s*press|bench\s*press|press\s+de\s+banca|press\s*banca)\b/i.test(
      t,
    ) ||
      /\b(dumbbell\s+bench|db\s+bench)\b/i.test(t)) &&
    hasDumbbell(t)
  ) {
    return {
      equipment:
        "FLAT BENCH + TWO SEPARATE DUMBBELLS (one in each hand). Hands hold dumbbell handles vertically above the chest. There is NO barbell, NO olympic bar, NO weight plates on a single bar connecting the hands.",
      forbid: [
        "barbell",
        "olympic bar",
        "single long bar",
        "barbell bench press",
        "cable press",
        "smith machine",
        "one continuous bar across both hands",
      ],
    };
  }

  if (/\bpress\s+inclinado\b/i.test(t) && hasDumbbell(t)) {
    return {
      equipment:
        "incline bench + TWO separate dumbbells (incline dumbbell press) — NOT a barbell",
      forbid: [
        "flat barbell bench",
        "barbell",
        "olympic bar",
        "cable press",
        "smith machine",
      ],
    };
  }

  if (isShoulderPress(t) && hasDumbbell(t)) {
    return {
      equipment:
        "TWO separate dumbbells pressed VERTICALLY overhead (standing or seated as named) — each hand holds its own dumbbell. Arms travel UP. NO barbell. NOT a row.",
      forbid: [
        "barbell",
        "olympic bar",
        "military barbell press",
        "push press with bar",
        "single bar connecting both hands",
        ...PRESS_NOT_ROW_FORBID,
      ],
    };
  }

  if (isShoulderPress(t) && !hasBand(t)) {
    return {
      equipment:
        "OVERHEAD / SHOULDER PRESS: athlete PUSHES the named implement VERTICALLY from the shoulders to lockout above the head. Hands travel UP. This is a PRESS, never a row.",
      forbid: PRESS_NOT_ROW_FORBID,
    };
  }

  if (
    /\b(sentadilla|squat)\b/i.test(t) &&
    hasDumbbell(t) &&
    !hasBarbell(t)
  ) {
    return {
      equipment:
        "ONE or TWO dumbbells for the squat (goblet at chest or dumbbells at sides) — NEVER a barbell on the back",
      forbid: [
        "barbell back squat",
        "olympic bar on traps",
        "safety bar",
        "smith machine",
      ],
    };
  }

  if (/\bpress\s+de\s+banca\b/i.test(t) || /\bpress\s*banca\b/i.test(t)) {
    if (hasDumbbell(t)) {
      return {
        equipment: "flat bench + two separate dumbbells",
        forbid: ["barbell", "olympic bar", "cable crossover", "pec deck"],
      };
    }
    return {
      equipment: "flat bench + barbell with plates (bench press)",
      forbid: ["dumbbells", "cable fly", "pec deck"],
    };
  }
  if (
    /\b(dumbbell|mancuerna)\s*fly|\bflye?s?\s+con\s+mancuernas?|\baperturas?\s+con\s+mancuernas?\b/i.test(
      t,
    )
  ) {
    return {
      equipment: "two dumbbells, athlete lying on flat bench (dumbbell fly)",
      forbid: ["cable towers", "pec deck machine", "barbell", "poleas"],
    };
  }
  if (/\bjal[oó]n\s+al\s+pecho|lat\s*pulldown\b/i.test(t)) {
    return {
      equipment: "lat pulldown machine, wide bar pulled to upper chest",
      forbid: [
        "pull-up bar bodyweight",
        "behind-the-neck pulldown",
        "straight-arm pulldown only",
      ],
    };
  }
  if (/\b(dominada|pull[- ]?up|chin[- ]?up)\b/i.test(t)) {
    return {
      equipment: "fixed pull-up bar, bodyweight hang",
      forbid: ["lat pulldown machine", "cable stack"],
    };
  }
  if (
    /\b(single[- ]?arm|una\s+mano|one[- ]?arm).{0,40}(row|remo)|(row|remo).{0,40}(single[- ]?arm|una\s+mano|mancuerna|dumbbell)\b/i.test(
      t,
    ) ||
    /\bremo\s+con\s+mancuerna\b/i.test(t)
  ) {
    return {
      equipment:
        "ONE dumbbell; other hand/knee on flat bench (single-arm dumbbell row)",
      forbid: ["barbell", "two-hand barbell row", "cable row", "T-bar"],
    };
  }

  if (hasBand(t)) {
    return {
      equipment: "resistance band / liga elástica as named (visible band tension)",
      forbid: ["dumbbell", "barbell", "cable stack unless also named"],
    };
  }

  if (hasDumbbell(t) && !hasBarbell(t)) {
    return {
      equipment:
        "dumbbell(s) only — draw separate dumbbell handles in each working hand. NEVER a single barbell connecting both hands.",
      forbid: ["barbell", "olympic bar", "single long bar", "cable stack"],
    };
  }
  if (hasBarbell(t) && !hasDumbbell(t)) {
    return {
      equipment: "barbell with plates",
      forbid: ["dumbbells", "cable handles"],
    };
  }
  if (/\b(polea|cable)\b/i.test(t)) {
    return {
      equipment: "cable machine / polea as named in the exercise",
      forbid: ["substituting free weights when cables are specified"],
    };
  }

  return {
    equipment: "exactly the implement named in the exercise title",
    forbid: ["random substitute machines", "wrong free-weight type"],
  };
}

function detectLaterality(text: string): VisualBrief["laterality"] {
  if (
    /\b(una\s+mano|single[- ]?arm|one[- ]?arm|unilateral|unipodal|una\s+pierna|single[- ]?leg|por\s+lado|per\s+side)\b/i.test(
      text,
    )
  ) {
    return "unilateral-left-or-right";
  }
  return "bilateral";
}

function detectMovementPattern(text: string): string {
  if (isShoulderPress(text)) {
    return "VERTICAL PUSH — load travels UP above the head. NEVER a row, NEVER pulling handles to the chest.";
  }
  if (
    isChestPress(text) ||
    /\b(push[- ]?up|lagartija|dips?|fondos?)\b/i.test(text)
  ) {
    return "PUSH — load travels AWAY from the torso. NEVER a row.";
  }
  if (
    /\b(row|remo|jal[oó]n|pulldown|pull[- ]?up|face\s*pull|chin[- ]?up|dominada)\b/i.test(
      text,
    )
  ) {
    return "PULL — load travels toward the body.";
  }
  if (isShoulderRotation(text)) {
    return "shoulder rotation with the elbow at 90° — not a press, not a row.";
  }
  return "as required by the named exercise";
}

function detectBodyPosition(text: string): string {
  if (isFloorMobilityText(text)) {
    return "seated on the floor, both knees and hips at ~90°, torso upright — NOT standing, NOT pulling";
  }
  if (isShoulderPress(text) && hasMachine(text)) {
    return "SEATED on the shoulder-press machine, back against the pad, pushing handles vertically overhead";
  }
  if (isChestPress(text) && hasMachine(text) && !/\b(banca|bench)\b/i.test(text)) {
    return "SEATED on the chest-press machine, back against the pad, pushing handles forward";
  }
  if (isShoulderPress(text)) {
    return "pressing overhead (standing or seated as named) — NOT a row, NOT pulling";
  }
  if (
    !isHipContext(text) &&
    isShoulderRotation(text) &&
    !/\b(tumbado|side[\s-]?lying|sidelying)\b/i.test(text)
  ) {
    return "standing, elbow at side at 90°";
  }
  if (/\b(sentado|seated|pec\s*deck)\b/i.test(text)) return "seated";
  if (/\b(tumbado|lying|supine|banco\s+plano|flat\s*bench|side[\s-]?lying)\b/i.test(text))
    return "lying on bench / as named";
  if (/\b(inclinado|incline)\b/i.test(text)) return "incline bench";
  if (/\b(cuadrupedia|quadruped|bird\s*dog)\b/i.test(text)) return "quadruped";
  if (/\b(de\s+pie|standing)\b/i.test(text)) return "standing";
  if (/\b(press\s+de\s+pecho|bench\s*press|chest\s*press)\b/i.test(text))
    return "lying supine on flat bench";
  return "as required by the named exercise";
}

/**
 * Locks equipment + variation before image generation so the model
 * cannot "creatively" swap pec deck → cables, etc.
 *
 * Movement family comes from the TITLE only. Intro/purpose cannot turn
 * a press into a row or a band rotation.
 */
export function buildVisualBrief(ctx: BocetoPromptContext): VisualBrief {
  const primaryVariation = pickPrimaryName(ctx.name, ctx.nameEn);
  const cls = classifyLift(ctx.name, ctx.nameEn);
  const full = `${primaryVariation}\n${blob(ctx)}`;
  // Known lifts: classify off the title so coaching copy cannot contaminate.
  const text = cls.kind !== "other" ? primaryVariation : full;
  const { equipment, forbid } = detectEquipment(text);
  const bodyPosition = detectBodyPosition(text);
  const movementPattern = detectMovementPattern(text);
  const brief: VisualBrief = {
    primaryVariation,
    equipment,
    forbidEquipment: forbid,
    laterality: detectLaterality(text),
    bodyPosition,
    movementPattern,
    equipmentLockLine: `DRAW ONLY: ${equipment}. MOVEMENT: ${movementPattern}. BODY: ${bodyPosition}. DO NOT DRAW: ${forbid.join(", ") || "any other implement"}.`,
  };
  const locked = applyLiftOverride(brief, cls);
  const err = briefFidelityError(locked, cls);
  if (err) {
    console.error("[boceto] fidelity guard:", err, primaryVariation);
  }
  return locked;
}

/** True when refs that depict a barbell (e.g. bench.jpg) would contaminate the edit. */
export function shouldExcludeBarbellReferences(brief: VisualBrief): boolean {
  const e = `${brief.equipment} ${brief.forbidEquipment.join(" ")}`.toLowerCase();
  return (
    e.includes("dumbbell") ||
    e.includes("mancuerna") ||
    e.includes("band") ||
    e.includes("liga") ||
    e.includes("floor") ||
    e.includes("suelo") ||
    e.includes("machine") ||
    e.includes("selectorized") ||
    brief.forbidEquipment.some((f) => /barbell|olympic|cable|row/i.test(f))
  );
}

/** Presses must not use hanging-pull refs — pullup.jpg becomes a fake seated row. */
export function shouldExcludePullingReferences(brief: VisualBrief): boolean {
  if (/\b(rotation|rotaci|pull —)\b/i.test(brief.movementPattern)) return false;
  const t = `${brief.primaryVariation} ${brief.movementPattern}`.toLowerCase();
  return /\b(press|push|empuje|overhead|militar|vertical push)\b/i.test(t);
}

/** Floor drills: do not use hanging-pull / bench refs (they become fake rows). */
export function shouldUseFloorCharacterReferences(brief: VisualBrief): boolean {
  const e = `${brief.primaryVariation} ${brief.equipment} ${brief.bodyPosition}`.toLowerCase();
  return (
    isFloorMobilityText(e) ||
    e.includes("floor") ||
    e.includes("suelo") ||
    e.includes("seated on the floor")
  );
}
