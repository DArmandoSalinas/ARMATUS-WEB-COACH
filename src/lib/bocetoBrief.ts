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

function detectEquipment(text: string): {
  equipment: string;
  forbid: string[];
} {
  const t = text;

  // --- Shoulder IR / ER (warm-up default = resistance band) ---
  if (
    /\b(rotaci[oó]n\s+(externa|interna)|external\s*rotation|internal\s*rotation|rotator\s*cuff|manguito\s+rotador)\b/i.test(
      t,
    )
  ) {
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

  if (
    /\b(press\s+de\s+hombro|shoulder\s*press|overhead\s*press|press\s*militar|military\s*press|ohp)\b/i.test(
      t,
    ) &&
    hasDumbbell(t)
  ) {
    return {
      equipment:
        "TWO separate dumbbells pressed overhead (standing or seated as named) — each hand holds its own dumbbell. NO barbell.",
      forbid: [
        "barbell",
        "olympic bar",
        "military barbell press",
        "push press with bar",
        "single bar connecting both hands",
      ],
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

function detectBodyPosition(text: string): string {
  if (
    /\b(rotaci[oó]n\s+(externa|interna)|external\s*rotation|internal\s*rotation)\b/i.test(
      text,
    ) &&
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
 */
export function buildVisualBrief(ctx: BocetoPromptContext): VisualBrief {
  const primaryVariation = pickPrimaryName(ctx.name, ctx.nameEn);
  const text = `${primaryVariation}\n${blob(ctx)}`;
  const { equipment, forbid } = detectEquipment(text);
  const bodyPosition = detectBodyPosition(text);
  return {
    primaryVariation,
    equipment,
    forbidEquipment: forbid,
    laterality: detectLaterality(text),
    bodyPosition,
    equipmentLockLine: `DRAW ONLY: ${equipment}. DO NOT DRAW: ${forbid.join(", ") || "any other implement"}.`,
  };
}

/** True when refs that depict a barbell (e.g. bench.jpg) would contaminate the edit. */
export function shouldExcludeBarbellReferences(brief: VisualBrief): boolean {
  const e = `${brief.equipment} ${brief.forbidEquipment.join(" ")}`.toLowerCase();
  return (
    e.includes("dumbbell") ||
    e.includes("mancuerna") ||
    e.includes("band") ||
    e.includes("liga") ||
    brief.forbidEquipment.some((f) => /barbell|olympic/i.test(f))
  );
}
