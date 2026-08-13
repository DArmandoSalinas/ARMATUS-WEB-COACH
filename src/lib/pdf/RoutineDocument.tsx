import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
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
    gap: 8,
    marginBottom: 16,
  },
  eyebrowLine: {
    width: 16,
    height: 2,
    backgroundColor: C.orange,
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
    gap: 8,
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
    gap: 12,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  exHeadMain: {
    flex: 1,
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
    width: 118,
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
    height: 168,
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
  grid2: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  block: {
    flex: 1,
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
    gap: 3,
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
    marginBottom: 2,
  },
  stepsBlock: {
    backgroundColor: clara ? "#FFFFFF" : "rgba(28,28,30,0.9)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 9,
    marginBottom: 8,
  },
  stepsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  step: {
    width: "48.5%",
    backgroundColor: clara ? "#F3EFE8" : "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 7,
    padding: 7,
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
  split: {
    flexDirection: "row",
    gap: 8,
  },
  warn: {
    flex: 1,
    backgroundColor: clara ? "rgba(180,35,24,0.08)" : "rgba(255,69,58,0.08)",
    borderWidth: 1,
    borderColor: clara ? "rgba(180,35,24,0.28)" : "rgba(255,69,58,0.28)",
    borderRadius: 10,
    padding: 9,
  },
  benefit: {
    flex: 1,
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
    gap: 10,
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

function CoverPage({
  routine,
  styles: s,
  variant,
}: {
  routine: Routine;
  styles: ReturnType<typeof createStyles>;
  variant: PdfVariant;
}) {
  const { main, accent } = splitTitle(routine.objective);
  const exercises = [...routine.exercises].sort((a, b) => a.order - b.order);

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
          <Text style={s.eyebrow}>Rutina para {routine.clientName}</Text>
        </View>

        <Text style={s.coverTitle}>
          {main}
          {accent ? (
            <Text style={s.coverTitleAccent}>{` ${accent}`}</Text>
          ) : null}
        </Text>

        <Text style={s.lead}>
          {variant === "clara"
            ? "Guía fácil de leer: cómo hacer cada ejercicio, cuántas repeticiones, errores a evitar y bocetos ARMATUS."
            : "Protocolo biomecánico con dosificación, ejecución técnica, errores comunes y bocetos ARMATUS — listo para entrenar."}
        </Text>

        <View style={s.metaRow}>
          <View style={s.metaChip}>
            <Text style={s.metaValue}>{exercises.length}</Text>
            <Text style={s.metaLabel}>Bloques</Text>
          </View>
          {routine.duration ? (
            <View style={s.metaChip}>
              <Text style={s.metaValue}>{routine.duration}</Text>
              <Text style={s.metaLabel}>Duración</Text>
            </View>
          ) : null}
          {routine.frequency ? (
            <View style={s.metaChip}>
              <Text style={s.metaValue}>{routine.frequency}</Text>
              <Text style={s.metaLabel}>Frecuencia</Text>
            </View>
          ) : null}
          <View style={s.metaChip}>
            <Text style={s.metaValue}>{routine.level}</Text>
            <Text style={s.metaLabel}>Nivel</Text>
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
            Protocolo listo para entrenar
          </Text>
          <Text style={s.lead}>
            {exercises.length} bloque{exercises.length === 1 ? "" : "s"} · el
            índice va en la página siguiente.
          </Text>
        </View>
      </View>

      <View style={s.coverFooter} fixed>
        <Text style={s.coverFooterText}>
          ARMATUS · Protocolo de fuerza · {routine.clientName}
          {routine.coachName ? ` · Coach ${routine.coachName}` : ""}
        </Text>
      </View>
    </Page>
  );
}

function TocPage({
  routine,
  styles: s,
}: {
  routine: Routine;
  styles: ReturnType<typeof createStyles>;
}) {
  const exercises = [...routine.exercises].sort((a, b) => a.order - b.order);
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>Contenido</Text>
      <Text style={{ ...s.exTitle, marginBottom: 16 }}>Índice de bloques</Text>
      {exercises.map((ex, i) => (
        <View key={ex.id} style={s.tocItem} wrap={false}>
          <Text style={s.tocNum}>{String(i + 1).padStart(2, "0")}</Text>
          <View>
            <Text style={s.tocLabel}>{ex.name}</Text>
            <Text style={s.tocBadge}>{ex.badge}</Text>
          </View>
        </View>
      ))}
      <View style={s.pageFooter} fixed>
        <Text style={s.pageFooterText}>ARMATUS · {routine.clientName}</Text>
        <Text style={s.pageFooterText}>Índice</Text>
      </View>
    </Page>
  );
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
}: {
  exercise: Exercise;
  index: number;
  routine: Routine;
  styles: ReturnType<typeof createStyles>;
}) {
  const img = exercise.imageDataUrl;
  const doseMeta = [exercise.dose.rpe, exercise.dose.rest]
    .filter(Boolean)
    .join(" · ");
  const pageLabel = `${String(index + 1).padStart(2, "0")} / ${String(routine.exercises.length).padStart(2, "0")}`;
  const steps = exercise.steps.slice(0, 4);
  const mistakes = exercise.commonMistakes.filter(Boolean).slice(0, 3);

  return (
    <Page size="A4" style={s.page} wrap={false}>
      <View style={s.exBadge}>
        <Text style={s.exBadgeText}>{exercise.badge}</Text>
      </View>

      <View style={s.exHead} wrap={false}>
        <View style={s.exHeadMain}>
          <Text style={s.exTitle}>
            {clip(exercise.name, 48)}
            {exercise.nameEn ? (
              <Text style={s.exTitleEm}>{` (${clip(exercise.nameEn, 28)})`}</Text>
            ) : null}
          </Text>
          <Text style={s.exIntro}>{clip(exercise.intro, 220)}</Text>
        </View>
        <View style={s.doseBox}>
          <Text style={s.doseLabel}>Dosificación</Text>
          <Text style={s.doseValue}>{clip(exercise.dose.setsReps, 28)}</Text>
          {doseMeta ? (
            <Text style={s.doseMeta}>{clip(doseMeta, 36)}</Text>
          ) : null}
        </View>
      </View>

      {img ? (
        <View wrap={false}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image key={`${exercise.id}-boceto`} src={img} style={s.sketch} cache={false} />
          <Text style={s.sketchCaption}>
            Boceto · {clip(exercise.sketchCaption, 72)}
          </Text>
        </View>
      ) : (
        <View style={s.sketchMissing} wrap={false}>
          <Text style={s.sketchMissingText}>Boceto pendiente</Text>
        </View>
      )}

      <View style={s.grid2}>
        <View style={s.block} wrap={false}>
          <Text style={s.blockTitle}>Propósito y enfoque</Text>
          <Text style={s.blockBody}>{clip(exercise.purpose, 280)}</Text>
        </View>
        <View style={s.block} wrap={false}>
          <Text style={s.blockTitle}>Enfoque muscular</Text>
          <View style={s.tags}>
            {exercise.muscles.slice(0, 6).map((m) => (
              <Text key={m} style={s.tag}>
                {m}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={s.stepsBlock} wrap={false}>
        <Text style={s.blockTitle}>Cómo ejecutarlo</Text>
        <View style={s.stepsGrid}>
          {steps.map((step, i) => (
            <View key={`${exercise.id}-s-${i}`} style={s.step} wrap={false}>
              <Text style={s.stepN}>{clip(step.title, 28)}</Text>
              <Text style={s.stepBody}>{clip(step.body, 160)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.split} wrap={false}>
        <View style={s.warn} wrap={false}>
          <Text style={s.warnTitle}>Errores comunes</Text>
          {mistakes.map((m, i) => (
            <Text key={`${exercise.id}-m-${i}`} style={s.listItem}>
              • {clip(m, 110)}
            </Text>
          ))}
        </View>
        <View style={s.benefit} wrap={false}>
          <Text style={s.benefitTitle}>Beneficio</Text>
          <Text style={s.blockBody}>{clip(exercise.benefit, 220)}</Text>
        </View>
      </View>

      {(exercise.supportLinks ?? []).length > 0 ? (
        <View style={s.support} wrap={false}>
          <Text style={s.supportTitle}>Apoyo adicional</Text>
          {(exercise.supportLinks ?? []).slice(0, 3).map((link) => (
            <Link key={link.url} src={link.url} style={s.supportLink}>
              {clip(link.label || link.url, 72)}
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
}: {
  routine: Routine;
  useFallbackFonts?: boolean;
  variant?: PdfVariant;
}) {
  const s = createStyles(useFallbackFonts, variant);
  const exercises = [...routine.exercises].sort((a, b) => a.order - b.order);

  return (
    <Document
      title={`ARMATUS · ${routine.clientName}${variant === "clara" ? " (versión clara)" : ""}`}
      author={routine.coachName || "ARMATUS Coach Studio"}
      subject={routine.objective}
      creator="ARMATUS Coach Studio"
    >
      <CoverPage routine={routine} styles={s} variant={variant} />
      <TocPage routine={routine} styles={s} />
      {exercises.map((ex, i) => (
        <ExercisePage
          key={ex.id}
          exercise={ex}
          index={i}
          routine={routine}
          styles={s}
        />
      ))}
    </Document>
  );
}
