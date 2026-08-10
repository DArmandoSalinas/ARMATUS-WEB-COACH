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
  // Split on Spanish/English "or" between alternatives (keep parentheses content of first)
  const first = raw.split(/\s+o\s+|\s+or\s+|\s+\/\s+/i)[0]?.trim() || raw;
  return first.replace(/\s+/g, " ").trim();
}

function detectEquipment(text: string): {
  equipment: string;
  forbid: string[];
} {
  const t = text;

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
      equipment: "dual high cable towers with D-handles (standing cable fly / cruce de poleas)",
      forbid: ["pec deck machine", "dumbbells", "barbell", "seated fly machine"],
    };
  }
  if (/\b(dips?|fondos?\s+en\s+paralelas?|paralelas?)\b/i.test(t)) {
    return {
      equipment: "parallel dip bars / paralelas (bodyweight dips)",
      forbid: ["bench dips only", "cable pushdown", "machine dip unless named"],
    };
  }
  if (/\bpress\s+inclinado\b/i.test(t) && /\b(mancuernas?|dumbbells?)\b/i.test(t)) {
    return {
      equipment: "incline bench + two dumbbells (incline dumbbell press)",
      forbid: ["flat barbell bench", "cable press", "smith machine unless named"],
    };
  }
  if (/\bpress\s+de\s+banca\b/i.test(t) || /\bpress\s*banca\b/i.test(t)) {
    if (/\b(mancuernas?|dumbbells?)\b/i.test(t)) {
      return {
        equipment: "flat bench + two dumbbells",
        forbid: ["barbell", "cable crossover", "pec deck"],
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
  if (/\b(mancuernas?|dumbbells?)\b/i.test(t) && !/\bbarra|barbell\b/i.test(t)) {
    return {
      equipment: "dumbbell(s) only — no barbell, no cable stack unless named",
      forbid: ["barbell", "olympic bar"],
    };
  }
  if (/\b(barra|barbell)\b/i.test(t) && !/\bmancuerna|dumbbell\b/i.test(t)) {
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
  if (/\b(banda|band)\b/i.test(t)) {
    return {
      equipment: "resistance band",
      forbid: ["cable stack", "machines", "barbell"],
    };
  }

  return {
    equipment: "exactly the implement named in the exercise title",
    forbid: ["random substitute machines", "wrong free-weight type"],
  };
}

function detectLaterality(
  text: string,
): VisualBrief["laterality"] {
  if (
    /\b(una\s+mano|single[- ]?arm|one[- ]?arm|unilateral|unipodal|una\s+pierna|single[- ]?leg)\b/i.test(
      text,
    )
  ) {
    return "unilateral-left-or-right";
  }
  return "bilateral";
}

function detectBodyPosition(text: string): string {
  if (/\b(sentado|seated|pec\s*deck)\b/i.test(text)) return "seated";
  if (/\b(tumbado|lying|supine|banco\s+plano|flat\s*bench)\b/i.test(text))
    return "lying on bench";
  if (/\b(inclinado|incline)\b/i.test(text)) return "incline bench";
  if (/\b(cuadrupedia|quadruped|bird\s*dog)\b/i.test(text)) return "quadruped";
  if (/\b(de\s+pie|standing)\b/i.test(text)) return "standing";
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
  return {
    primaryVariation,
    equipment,
    forbidEquipment: forbid,
    laterality: detectLaterality(text),
    bodyPosition: detectBodyPosition(text),
  };
}
