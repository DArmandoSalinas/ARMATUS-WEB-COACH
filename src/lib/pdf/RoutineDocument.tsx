import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import { tx, type Locale } from "@/lib/i18n";
import type { Exercise, Routine } from "@/lib/types";

export type PdfVariant = "studio" | "clara";

const STUDIO = {
  bg: "#000000",
  surface: "#1C1C1E",
  elevated: "#2C2C2E",
  border: "#38383A",
  orange: "#FF6B35",
  orangeDeep: "#E04A12",
  orangeSoft: "#FFB48A",
  text: "#FFFFFF",
  muted: "#8E8E93",
  danger: "#FF453A",
};

const CLARA = {
  bg: "#F7F4EE",
  surface: "#FFFFFF",
  elevated: "#FFFFFF",
  border: "#E4DDD2",
  orange: "#D24A16",
  orangeDeep: "#B33D10",
  orangeSoft: "#C44A1A",
  text: "#1C1C1E",
  muted: "#3A3A3C",
  danger: "#B42318",
};

function createStyles(fallback: boolean, variant: PdfVariant = "studio") {
  const clara = variant === "clara";
  const C = clara ? CLARA : STUDIO;
  const body = fallback ? "Helvetica" : "Outfit";
  const display = fallback ? "Helvetica" : "BarlowCondensed";
  const up = "uppercase" as const;
  const displayWeight = 800;
  return StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.text,
    paddingTop: 28,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontFamily: body,
  },
  coverPage: {
    backgroundColor: C.bg,
    color: C.text,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 40,
    fontFamily: body,
    justifyContent: "flex-start",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  brand: {
    fontFamily: display,
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: 6,
    color: C.text,
  },
  brandSub: {
    marginTop: 4,
    fontFamily: display,
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: 3,
    color: C.orange,
    textTransform: up,
  },
  coachPill: {
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.45)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,107,53,0.08)",
  },
  coachPillText: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: 2,
    color: C.orangeSoft,
    textTransform: up,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  eyebrowLine: {
    width: 16,
    height: 2,
    backgroundColor: C.orange,
    marginRight: 8,
  },
  eyebrow: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: 3,
    color: C.orange,
    textTransform: up,
  },
  coverTitle: {
    fontFamily: display,
    fontWeight: displayWeight,
    fontSize: 42,
    lineHeight: 0.95,
    letterSpacing: 1,
    textTransform: up,
    marginBottom: 18,
    maxWidth: "92%",
  },
  coverTitleAccent: {
    color: C.orange,
  },
  lead: {
    fontSize: 11,
    lineHeight: 1.45,
    color: C.muted,
    maxWidth: "85%",
    marginBottom: 28,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaChip: {
    width: "18%",
    minWidth: 80,
    backgroundColor: clara ? "#FFFFFF" : "rgba(28,28,30,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.22)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  metaValue: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 14,
    color: C.orange,
    marginBottom: 4,
    textAlign: "center",
  },
  metaLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: C.muted,
    textTransform: up,
    textAlign: "center",
  },
  coverFooter: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 16,
  },
  coverFooterText: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1,
  },
  // Exercise page — sized to fit one A4 without orphan wrap pages
  exBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.35)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
    marginBottom: 8,
  },
  exBadgeText: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 2,
    color: C.orangeSoft,
    textTransform: up,
  },
  exHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  exHeadMain: {
    width: "70%",
    paddingRight: 12,
  },
  exTitle: {
    fontFamily: display,
    fontWeight: displayWeight,
    fontSize: 22,
    lineHeight: 1.05,
    letterSpacing: 0.5,
    textTransform: up,
    marginBottom: 5,
  },
  exTitleEm: {
    color: C.orange,
  },
  exIntro: {
    fontSize: 9,
    lineHeight: 1.4,
    color: C.muted,
  },
  doseBox: {
    width: "28%",
    flexShrink: 0,
    flexDirection: "column",
    backgroundColor: clara ? "#FFFFFF" : "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.4)",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  doseLabel: {
    fontSize: 6.5,
    letterSpacing: 1.4,
    color: C.orange,
    textTransform: up,
    marginBottom: 3,
    fontFamily: display,
    fontWeight: 700,
  },
  doseValue: {
    fontFamily: display,
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 2,
    textAlign: "center",
  },
  doseMeta: {
    fontSize: 7.5,
    color: C.muted,
    textAlign: "center",
  },
  sketch: {
    width: "100%",
    height: 236,
    objectFit: "contain",
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
    borderRadius: 10,
    marginBottom: 4,
  },
  sketchCaption: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: C.orangeSoft,
    textTransform: up,
    marginBottom: 8,
    fontFamily: display,
    fontWeight: 700,
  },
  sketchMissing: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
    borderRadius: 10,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: clara ? "#EFEAE3" : "rgba(28,28,30,0.9)",
  },
  sketchMissingText: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: C.muted,
    textTransform: up,
    fontFamily: display,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  colLeft: {
    width: "48.5%",
    marginRight: "3%",
  },
  colRight: {
    width: "48.5%",
  },
  block: {
    flexDirection: "column",
    backgroundColor: clara ? "#FFFFFF" : "rgba(28,28,30,0.9)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 9,
  },
  blockTitle: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 9.5,
    letterSpacing: 1.1,
    color: C.orangeSoft,
    textTransform: up,
    marginBottom: 6,
  },
  blockBody: {
    fontSize: 8.5,
    lineHeight: 1.35,
    color: C.muted,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.28)",
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 5,
    fontSize: 7.5,
    color: C.orangeSoft,
    marginRight: 4,
    marginBottom: 4,
  },
  stepsBlock: {
    flexDirection: "column",
    backgroundColor: clara ? "#FFFFFF" : "rgba(28,28,30,0.9)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 9,
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  step: {
    flexDirection: "column",
    width: "47%",
    backgroundColor: clara ? "#F3EFE8" : "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 7,
    padding: 7,
  },
  stepGap: {
    marginRight: "6%",
  },
  stepN: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: 1,
    color: C.orange,
    textTransform: up,
    marginBottom: 3,
  },
  stepBody: {
    fontSize: 8,
    lineHeight: 1.32,
    color: C.muted,
  },
  warn: {
    flexDirection: "column",
    backgroundColor: clara ? "rgba(180,35,24,0.08)" : "rgba(255,69,58,0.08)",
    borderWidth: 1,
    borderColor: clara ? "rgba(180,35,24,0.28)" : "rgba(255,69,58,0.28)",
    borderRadius: 10,
    padding: 9,
  },
  benefit: {
    flexDirection: "column",
    backgroundColor: clara ? "rgba(210,74,22,0.08)" : "rgba(255,107,53,0.08)",
    borderWidth: 1,
    borderColor: clara ? "rgba(210,74,22,0.28)" : "rgba(255,107,53,0.28)",
    borderRadius: 10,
    padding: 9,
  },
  warnTitle: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: 1.3,
    color: C.danger,
    textTransform: up,
    marginBottom: 4,
  },
  benefitTitle: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: 1.3,
    color: C.orange,
    textTransform: up,
    marginBottom: 4,
  },
  listItem: {
    fontSize: 8,
    lineHeight: 1.32,
    color: C.muted,
    marginBottom: 4,
  },
  support: {
    flexDirection: "column",
    marginTop: 8,
    backgroundColor: clara ? "#FFFFFF" : "rgba(142,142,147,0.1)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 9,
  },
  supportTitle: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: 1.3,
    color: C.muted,
    textTransform: up,
    marginBottom: 4,
  },
  supportLink: {
    fontSize: 8,
    lineHeight: 1.35,
    color: C.orange,
    textDecoration: "underline",
    marginBottom: 2,
  },
  pageFooter: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  pageFooterText: {
    fontSize: 7.5,
    color: C.muted,
    letterSpacing: 1,
  },
  tocItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tocNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,107,53,0.16)",
    color: C.orange,
    fontFamily: display,
    fontWeight: 800,
    fontSize: 11,
    textAlign: "center",
    paddingTop: 7,
    marginRight: 10,
  },
  tocLabel: {
    fontFamily: display,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: up,
  },
  tocBadge: {
    fontSize: 8,
    color: C.muted,
    marginTop: 2,
  },
});
}

function splitTitle(objective: string) {
  const words = objective.trim().split(/\s+/);
  if (words.length <= 3) return { main: objective, accent: "" };
  const cut = Math.max(2, Math.floor(words.length / 2));
  return {
    main: words.slice(0, cut).join(" "),
    accent: words.slice(cut).join(" "),
  };
}

function levelLabel(level: string, locale: Locale): string {
  if (level === "principiante") return tx(locale, "levelBeg");
  if (level === "avanzado") return tx(locale, "levelAdv");
  if (level === "intermedio") return tx(locale, "levelMid");
  return level;
}

function exerciseTitles(exercise: Exercise, locale: Locale) {
  if (locale === "en") {
    const primary = exercise.nameEn?.trim() || exercise.name;
    const secondary =
      exercise.nameEn?.trim() &&
      exercise.name.trim() !== exercise.nameEn.trim()
        ? exercise.name
        : undefined;
    return { primary, secondary };
  }
  return {
    primary: exercise.name,
    secondary: exercise.nameEn?.trim() || undefined,
  };
}

function CoverPage({
  routine,
  styles: s,
  variant,
  locale,
}: {
  routine: Routine;
  styles: ReturnType<typeof createStyles>;
  variant: PdfVariant;
  locale: Locale;
}) {
  const { main, accent } = splitTitle(routine.objective);
  const exercises = [...routine.exercises].sort((a, b) => a.order - b.order);
  const blockWord = tx(locale, "blocks").toLowerCase();

  return (
    <Page size="A4" style={s.coverPage}>
      <View>
        <View style={s.brandRow}>
          <View>
            <Text style={s.brand}>ARMATUS</Text>
            <Text style={s.brandSub}>Coach Studio</Text>
          </View>
          {routine.coachName ? (
            <View style={s.coachPill}>
              <Text style={s.coachPillText}>Coach {routine.coachName}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.eyebrowRow}>
          <View style={s.eyebrowLine} />
          <Text style={s.eyebrow}>
            {tx(locale, "routineFor")} {routine.clientName}
          </Text>
        </View>

        <Text style={s.coverTitle}>
          {main}
          {accent ? (
            <Text style={s.coverTitleAccent}>{` ${accent}`}</Text>
          ) : null}
        </Text>

        <Text style={s.lead}>
          {tx(locale, variant === "clara" ? "leadClara" : "leadStudio")}
        </Text>

        <View style={s.metaRow}>
          <View style={s.metaChip}>
            <Text style={s.metaValue}>{exercises.length}</Text>
            <Text style={s.metaLabel}>{tx(locale, "blocks")}</Text>
          </View>
          {routine.duration ? (
            <View style={s.metaChip}>
              <Text style={s.metaValue}>{routine.duration}</Text>
              <Text style={s.metaLabel}>{tx(locale, "durationChip")}</Text>
            </View>
          ) : null}
          {routine.frequency ? (
            <View style={s.metaChip}>
              <Text style={s.metaValue}>{routine.frequency}</Text>
              <Text style={s.metaLabel}>{tx(locale, "frequencyChip")}</Text>
            </View>
          ) : null}
          <View style={s.metaChip}>
            <Text style={s.metaValue}>{levelLabel(routine.level, locale)}</Text>
            <Text style={s.metaLabel}>{tx(locale, "levelChip")}</Text>
          </View>
          {routine.coachName ? (
            <View style={s.metaChip}>
              <Text style={s.metaValue}>{routine.coachName}</Text>
              <Text style={s.metaLabel}>Coach</Text>
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: 36 }}>
          <Text
            style={{
              ...s.blockTitle,
              marginBottom: 12,
              borderBottomWidth: 0,
              paddingBottom: 0,
            }}
          >
            {tx(locale, "pdfReady")}
          </Text>
          <Text style={s.lead}>
            {exercises.length} {blockWord} · {tx(locale, "pdfIndexNext")}
          </Text>
        </View>
      </View>

      <View style={s.coverFooter} fixed>
        <Text style={s.coverFooterText}>
          ARMATUS · {tx(locale, "pdfStrength")} · {routine.clientName}
          {routine.coachName ? ` · Coach ${routine.coachName}` : ""}
        </Text>
      </View>
    </Page>
  );
}

function TocPage({
  routine,
  styles: s,
  locale,
}: {
  routine: Routine;
  styles: ReturnType<typeof createStyles>;
  locale: Locale;
}) {
  const exercises = [...routine.exercises].sort((a, b) => a.order - b.order);
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>{tx(locale, "pdfContents")}</Text>
      <Text style={{ ...s.exTitle, marginBottom: 16 }}>
        {tx(locale, "pdfToc")}
      </Text>
      {exercises.map((ex, i) => {
        const { primary } = exerciseTitles(ex, locale);
        return (
          <View key={ex.id} style={s.tocItem} wrap={false}>
            <Text style={s.tocNum}>{String(i + 1).padStart(2, "0")}</Text>
            <View>
              <Text style={s.tocLabel}>{primary}</Text>
              <Text style={s.tocBadge}>{ex.badge}</Text>
            </View>
          </View>
        );
      })}
      <View style={s.pageFooter} fixed>
        <Text style={s.pageFooterText}>ARMATUS · {routine.clientName}</Text>
        <Text style={s.pageFooterText}>{tx(locale, "pdfIndex")}</Text>
      </View>
    </Page>
  );
}

function localizeSupportLabel(
  label: string | undefined,
  url: string,
  locale: Locale,
): string {
  const raw = (label || url).trim();
  if (locale !== "en") return raw;
  if (/buscar t[eé]cnica/i.test(raw)) return "Search technique on YouTube";
  if (/video de t[eé]cnica/i.test(raw)) return "Technique video";
  return raw;
}

function clip(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function ExercisePage({
  exercise,
  index,
  routine,
  styles: s,
  locale,
}: {
  exercise: Exercise;
  index: number;
  routine: Routine;
  styles: ReturnType<typeof createStyles>;
  locale: Locale;
}) {
  const img = exercise.imageDataUrl;
  const doseMeta = [exercise.dose.rpe, exercise.dose.rest]
    .filter(Boolean)
    .join(" · ");
  const pageLabel = `${String(index + 1).padStart(2, "0")} / ${String(routine.exercises.length).padStart(2, "0")}`;
  const steps = exercise.steps.slice(0, 4);
  const mistakes = exercise.commonMistakes.filter(Boolean).slice(0, 3);
  const { primary, secondary } = exerciseTitles(exercise, locale);
  const stepRows: (typeof steps)[] = [];
  for (let i = 0; i < steps.length; i += 2) {
    stepRows.push(steps.slice(i, i + 2));
  }

  return (
    <Page size="A4" style={s.page}>
      <View style={s.exBadge}>
        <Text style={s.exBadgeText}>{exercise.badge}</Text>
      </View>

      <View style={s.exHead}>
        <View style={s.exHeadMain}>
          <Text style={s.exTitle}>
            {clip(primary, 72)}
            {secondary ? (
              <Text style={s.exTitleEm}>{` (${clip(secondary, 36)})`}</Text>
            ) : null}
          </Text>
          <Text style={s.exIntro}>{clip(exercise.intro, 320)}</Text>
        </View>
        <View style={s.doseBox}>
          <Text style={s.doseLabel}>{tx(locale, "pdfDose")}</Text>
          <Text style={s.doseValue}>{clip(exercise.dose.setsReps, 28)}</Text>
          {doseMeta ? (
            <Text style={s.doseMeta}>{clip(doseMeta, 36)}</Text>
          ) : null}
        </View>
      </View>

      {img ? (
        <View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            key={`${exercise.id}-boceto`}
            src={img}
            style={s.sketch}
            cache={false}
          />
          <Text style={s.sketchCaption}>
            {tx(locale, "pdfSketch")} · {clip(exercise.sketchCaption, 96)}
          </Text>
        </View>
      ) : (
        <View style={s.sketchMissing}>
          <Text style={s.sketchMissingText}>{tx(locale, "sketchPending")}</Text>
        </View>
      )}

      <View style={s.row}>
        <View style={[s.block, s.colLeft]}>
          <Text style={s.blockTitle}>{tx(locale, "purpose")}</Text>
          <Text style={s.blockBody}>{clip(exercise.purpose, 280)}</Text>
        </View>
        <View style={[s.block, s.colRight]}>
          <Text style={s.blockTitle}>{tx(locale, "muscles")}</Text>
          <View style={s.tags}>
            {exercise.muscles.slice(0, 6).map((m) => (
              <Text key={m} style={s.tag}>
                {m}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={s.stepsBlock}>
        <Text style={s.blockTitle}>{tx(locale, "howTo")}</Text>
        {stepRows.map((row, ri) => (
          <View key={`${exercise.id}-sr-${ri}`} style={s.stepsRow}>
            {row.map((step, i) => (
              <View
                key={`${exercise.id}-s-${ri}-${i}`}
                style={i === 0 && row.length > 1 ? [s.step, s.stepGap] : s.step}
              >
                <Text style={s.stepN}>{clip(step.title, 28)}</Text>
                <Text style={s.stepBody}>{clip(step.body, 160)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={s.row}>
        <View style={[s.warn, s.colLeft]}>
          <Text style={s.warnTitle}>{tx(locale, "mistakes")}</Text>
          {mistakes.map((m, i) => (
            <Text key={`${exercise.id}-m-${i}`} style={s.listItem}>
              • {clip(m, 110)}
            </Text>
          ))}
        </View>
        <View style={[s.benefit, s.colRight]}>
          <Text style={s.benefitTitle}>{tx(locale, "benefit")}</Text>
          <Text style={s.blockBody}>{clip(exercise.benefit, 220)}</Text>
        </View>
      </View>

      {(exercise.supportLinks ?? []).length > 0 ? (
        <View style={s.support}>
          <Text style={s.supportTitle}>{tx(locale, "support")}</Text>
          {(exercise.supportLinks ?? []).slice(0, 3).map((link) => (
            <Link key={link.url} src={link.url} style={s.supportLink}>
              {clip(localizeSupportLabel(link.label, link.url, locale), 72)}
            </Link>
          ))}
        </View>
      ) : null}

      <View style={s.pageFooter} fixed>
        <Text style={s.pageFooterText}>ARMATUS · {routine.clientName}</Text>
        <Text style={s.pageFooterText}>{pageLabel}</Text>
      </View>
    </Page>
  );
}

export function RoutineDocument({
  routine,
  useFallbackFonts = false,
  variant = "studio",
  locale = "es",
}: {
  routine: Routine;
  useFallbackFonts?: boolean;
  variant?: PdfVariant;
  locale?: Locale;
}) {
  const s = createStyles(useFallbackFonts, variant);
  const exercises = [...routine.exercises].sort((a, b) => a.order - b.order);
  const claraMark =
    variant === "clara" ? ` (${tx(locale, "pdfClaraMark")})` : "";

  return (
    <Document
      title={`ARMATUS · ${routine.clientName}${claraMark}`}
      author={routine.coachName || "ARMATUS Coach Studio"}
      subject={routine.objective}
      creator="ARMATUS Coach Studio"
    >
      <CoverPage
        routine={routine}
        styles={s}
        variant={variant}
        locale={locale}
      />
      <TocPage routine={routine} styles={s} locale={locale} />
      {exercises.map((ex, i) => (
        <ExercisePage
          key={ex.id}
          exercise={ex}
          index={i}
          routine={routine}
          styles={s}
          locale={locale}
        />
      ))}
    </Document>
  );
}
