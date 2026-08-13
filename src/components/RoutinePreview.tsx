"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Exercise, Routine } from "@/lib/types";
import type { PdfVariant } from "@/lib/pdf/downloadPdf";
import { formatDoseCard, whatsappShareUrl } from "@/lib/doseCard";
import { fillMissingBocetos } from "@/lib/fillBocetosClient";
import { isStaleLibraryBoceto } from "@/lib/bocetoMatch";
import { fetchJson } from "@/lib/http";
import { tx } from "@/lib/i18n";
import { useStudioStore } from "@/lib/store";
import { readTheme, setTheme, subscribeTheme } from "@/lib/theme";
import { ExerciseCard } from "./ExerciseCard";
import { HeroEnergy } from "./HeroEnergy";
import { HeroThunder } from "./HeroThunder";
import { LocaleToggle, useLocale } from "./LocaleToggle";
import { Reveal } from "./Reveal";
import { RevisionPanel } from "./RevisionPanel";
import { ThemeToggle } from "./ThemeToggle";
import "@/app/routine.css";

type RoutinePreviewProps = {
  routine: Routine;
  editable?: boolean;
  athleteView?: boolean;
};

function subscribeOrigin() {
  return () => {};
}

function getOrigin() {
  return window.location.origin;
}

function getOriginServer() {
  return "";
}

export function RoutinePreview({
  routine,
  editable = true,
  athleteView = false,
}: RoutinePreviewProps) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [dupBusy, setDupBusy] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const pageOrigin = useSyncExternalStore(
    subscribeOrigin,
    getOrigin,
    getOriginServer,
  );
  const [editMode, setEditMode] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const viewMode = useSyncExternalStore(
    subscribeTheme,
    readTheme,
    () => "studio" as PdfVariant,
  );
  const [busyMap, setBusyMap] = useState<
    Record<string, { text?: boolean; image?: boolean }>
  >({});
  const [activeId, setActiveId] = useState(routine.exercises[0]?.id ?? "");

  const current = useStudioStore((s) => s.current);
  const updateExercise = useStudioStore((s) => s.updateExercise);
  const replaceExercise = useStudioStore((s) => s.replaceExercise);
  const reorderExercise = useStudioStore((s) => s.reorderExercise);
  const removeExercise = useStudioStore((s) => s.removeExercise);
  const persist = useStudioStore((s) => s.persist);
  const setCurrent = useStudioStore((s) => s.setCurrent);
  const restorePrevious = useStudioStore((s) => s.restorePrevious);
  const hasPrevious = useStudioStore((s) => s.previous?.id === current?.id);
  const storeError = useStudioStore((s) => s.error);
  const setError = useStudioStore((s) => s.setError);
  const [doseMsg, setDoseMsg] = useState<string | null>(null);
  const [bocetoStatus, setBocetoStatus] = useState<string | null>(null);

  function setMode(mode: PdfVariant) {
    setTheme(mode);
  }

  useEffect(() => {
    if (current?.id !== routine.id) {
      useStudioStore.setState({ current: routine });
    }
  }, [current?.id, routine]);

  const live = current?.id === routine.id ? current : routine;

  const exercises = useMemo(
    () => [...live.exercises].sort((a, b) => a.order - b.order),
    [live.exercises],
  );
  const doseText = useMemo(() => formatDoseCard(live), [live]);
  const waUrl = whatsappShareUrl(doseText);

  useEffect(() => {
    if (!editable || athleteView) return;
    const needsFill = (ex: (typeof live.exercises)[number]) =>
      !ex.imageDataUrl || isStaleLibraryBoceto(ex);
    if (!live.exercises.some(needsFill)) return;
    const snapshot = live;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const pendingIds = snapshot.exercises.filter(needsFill).map((ex) => ex.id);
      if (pendingIds.length > 0) {
        setBusyMap((m) => {
          const next = { ...m };
          for (const id of pendingIds) {
            next[id] = { ...next[id], image: true };
          }
          return next;
        });
      }
      void fillMissingBocetos(
        null,
        snapshot,
        (msg) => {
          if (!cancelled) setBocetoStatus(msg);
        },
        {
          onExercise: (ex) => {
            if (cancelled || !ex.imageDataUrl) return;
            updateExercise(ex.id, { imageDataUrl: ex.imageDataUrl });
            setBusyMap((m) => ({
              ...m,
              [ex.id]: { ...m[ex.id], image: false },
            }));
          },
        },
      ).then(({ failedNames }) => {
        if (cancelled) return;
        setBusyMap((m) => {
          const next = { ...m };
          for (const id of pendingIds) {
            next[id] = { ...next[id], image: false };
          }
          return next;
        });
        setBocetoStatus(
          failedNames.length > 0
            ? `${failedNames.length} ${tx(locale, "statusBocetosFail")}`
            : null,
        );
      }).catch(() => {
        if (cancelled) return;
        setBusyMap((m) => {
          const next = { ...m };
          for (const id of pendingIds) {
            next[id] = { ...next[id], image: false };
          }
          return next;
        });
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Fill once per routine open; do not retrigger as images arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.id, editable, athleteView]);

  const titleWords = live.objective.trim().split(/\s+/);
  const accentFrom =
    titleWords.length > 3
      ? Math.max(2, Math.floor(titleWords.length / 2))
      : titleWords.length;
  const titleMain = titleWords.slice(0, accentFrom).join(" ");
  const titleAccent = titleWords.slice(accentFrom).join(" ");

  // Bring revision composer into view when opened from sticky bars
  useEffect(() => {
    if (!showChanges) return;
    const id = window.setTimeout(() => {
      document
        .getElementById("revision-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [showChanges]);

  // Scroll-spy for exercise nav
  useEffect(() => {
    const nodes = exercises
      .map((ex) => document.getElementById(`ex-${ex.id}`))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveId(visible.target.id.replace(/^ex-/, ""));
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [exercises]);

  async function handleCopyLink() {
    const url = `${window.location.origin}/rutina/${live.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg(tx(locale, "copyOk"));
    } catch {
      setCopyMsg(url);
    }
  }

  async function handleCopyAthleteLink() {
    const url = `${window.location.origin}/rutina/${live.id}?leer=1`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg(tx(locale, "copyOk"));
    } catch {
      setCopyMsg(url);
    }
  }

  async function handleCopyDose() {
    const text = formatDoseCard(live);
    try {
      await navigator.clipboard.writeText(text);
      setDoseMsg(tx(locale, "doseCopied"));
    } catch {
      setDoseMsg(text);
    }
  }

  async function handleUndo() {
    const ok = await restorePrevious();
    setDoseMsg(ok ? tx(locale, "undoOk") : tx(locale, "undoNone"));
  }

  async function handleDuplicate() {
    if (dupBusy) return;
    setDupBusy(true);
    try {
      const { duplicateRoutine } = await import("@/lib/storage");
      const copy = await duplicateRoutine(live);
      await setCurrent(copy);
      router.push(`/rutina/${copy.id}`);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : tx(locale, "dupFail"),
      );
    } finally {
      setDupBusy(false);
    }
  }

  async function handleShare() {
    setShareBusy(true);
    setShareMsg(null);
    try {
      await persist();
      const { publishRoutineClient } = await import("@/lib/publishClient");
      const result = await publishRoutineClient(live, setShareMsg);
      if (!result.ok) {
        setShareMsg(
          result.error || tx(locale, "blobFail"),
        );
        return;
      }
      const url =
        result.url || `${window.location.origin}/rutina/${live.id}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* clipboard may be blocked; still show the link */
      }
      if (navigator.share) {
        try {
          await navigator.share({
            title: `ARMATUS · ${live.clientName}`,
            text: `Rutina para ${live.clientName}`,
            url,
          });
        } catch {
          /* user cancelled share sheet — fine */
        }
      }
      setShareMsg(`Listo. Link listo para enviar:\n${url}`);
    } catch (err) {
      setShareMsg(
        err instanceof Error ? err.message : tx(locale, "shareFail"),
      );
    } finally {
      setShareBusy(false);
    }
  }

  async function handlePdf() {
    setPdfBusy(true);
    try {
      const { downloadRoutinePdf } = await import("@/lib/pdf/downloadPdf");
      await downloadRoutinePdf(live.clientName, live, viewMode, locale);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`${tx(locale, "pdfFail")}\n${msg}`);
    } finally {
      setPdfBusy(false);
    }
  }

  async function regenText(exercise: Exercise) {
    setBusyMap((m) => ({ ...m, [exercise.id]: { ...m[exercise.id], text: true } }));
    try {
      const { ok, data } = await fetchJson<{
        error?: string;
        exercise?: Exercise;
      }>("/api/regenerate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: { ...exercise, imageDataUrl: undefined },
          routineContext: {
            clientName: live.clientName,
            objective: live.objective,
            level: live.level,
            notes: live.notes,
          },
        }),
      });
      if (!ok || !data.exercise) {
        throw new Error(data.error || tx(locale, "regenTextFail"));
      }
      replaceExercise(exercise.id, {
        ...data.exercise,
        imageDataUrl: exercise.imageDataUrl,
        id: exercise.id,
        order: exercise.order,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : tx(locale, "regenTextFail"));
    } finally {
      setBusyMap((m) => ({
        ...m,
        [exercise.id]: { ...m[exercise.id], text: false },
      }));
    }
  }

  async function regenImage(exercise: Exercise) {
    setBusyMap((m) => ({
      ...m,
      [exercise.id]: { ...m[exercise.id], image: true },
    }));
    try {
      // Manual "Generar" always requests a fresh AI boceto using full coaching text
      const { ok, data } = await fetchJson<{
        error?: string;
        imageDataUrl?: string;
        sketchCaption?: string;
        source?: string;
      }>("/api/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceAi: true,
          exercise: {
            name: exercise.name,
            nameEn: exercise.nameEn,
            sketchCaption: exercise.sketchCaption,
            intro: exercise.intro,
            purpose: exercise.purpose,
            muscles: exercise.muscles,
            steps: exercise.steps,
            commonMistakes: exercise.commonMistakes,
          },
        }),
      });
      if (!ok || !data.imageDataUrl) {
        throw new Error(data.error || tx(locale, "regenImageFail"));
      }
      updateExercise(exercise.id, {
        imageDataUrl: data.imageDataUrl,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : tx(locale, "regenImageFail"));
    } finally {
      setBusyMap((m) => ({
        ...m,
        [exercise.id]: { ...m[exercise.id], image: false },
      }));
    }
  }

  function toggleChanges() {
    if (showChanges) {
      const panel = document.getElementById("revision-panel");
      if (panel?.getAttribute("data-busy") === "true") return;
      const ta = panel?.querySelector("textarea");
      if (
        ta instanceof HTMLTextAreaElement &&
        ta.value.trim() &&
        !window.confirm(tx(locale, "hideDraft"))
      ) {
        return;
      }
    }
    setShowChanges((v) => !v);
  }

  const canCoach = editable && !athleteView;
  const canEdit = canCoach && editMode;
  const isClara = viewMode === "clara";

  return (
    <div className={`routine-page${isClara ? " is-clara" : ""}`}>
      <header className="topbar">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand__mark"
            src="/favicon.png"
            alt="ARMATUS"
            width={36}
            height={36}
          />
          <div className="brand__text">
            <div className="brand__name">Armatus</div>
            <div className="brand__sub">Coach Studio</div>
          </div>
        </Link>
        <div className="topbar__end">
          {live.coachName ? (
            <div className="credit-pill">
              Coach <span>{live.coachName}</span>
            </div>
          ) : null}
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </header>

      {athleteView ? (
        <div className="athlete-banner no-print" role="status">
          <span>{tx(locale, "athleteBanner")}</span>
          <Link href={`/rutina/${live.id}`} className="btn btn--soft">
            {tx(locale, "openCoachView")}
          </Link>
        </div>
      ) : bocetoStatus ? (
        <div className="athlete-banner no-print" role="status">
          <span>{bocetoStatus}</span>
        </div>
      ) : null}

      <section className="hero">
        {isClara ? (
          <HeroThunder className="no-print opacity-55" />
        ) : (
          <>
            <HeroEnergy intensity="compact" className="no-print opacity-60" />
            <HeroThunder className="no-print opacity-50" />
          </>
        )}
        <div className="hero__grid motion-rise-2">
          <div className="hero__eyebrow">{tx(locale, "routineFor")} {live.clientName}</div>
          <h1 className="hero__title">
            {titleMain}
            {titleAccent ? (
              <>
                {" "}
                <span>{titleAccent}</span>
              </>
            ) : null}
          </h1>

          {live.coachName ? (
            <p className="hero__featuring">
              <span className="hero__featuring-label">Coach</span>
              <span className="hero__featuring-name">{live.coachName}</span>
            </p>
          ) : null}

          <p className="hero__lead">
            {isClara ? tx(locale, "leadClara") : tx(locale, "leadStudio")}
          </p>

          <div className="hero__actions no-print motion-rise-4">
            <a className="btn btn--primary" href={`#ex-${exercises[0]?.id}`}>
              {tx(locale, "startRoutine")}
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={pdfBusy}
              onClick={handlePdf}
            >
              {pdfBusy
                ? tx(locale, "pdfBusy")
                : isClara
                  ? tx(locale, "pdfClara")
                  : tx(locale, "pdfStudio")}
            </button>
            {canCoach ? (
              <button
                type="button"
                className="btn btn--ghost"
                disabled={shareBusy}
                onClick={handleShare}
              >
                {shareBusy ? tx(locale, "publishing") : tx(locale, "share")}
              </button>
            ) : null}
          </div>
          {canCoach && shareMsg ? (
            <div
              className="no-print mt-4 rounded-[14px] border border-[rgba(255,107,53,0.35)] bg-[rgba(255,107,53,0.1)] px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-pre-wrap break-all"
              role="status"
            >
              {shareMsg}
            </div>
          ) : null}

          {canCoach ? (
            <div className="share-strip no-print">
              <p className="share-strip__label">{tx(locale, "shareLabel")}</p>
              <div className="share-strip__row">
                <span className="share-strip__url">
                  {pageOrigin
                    ? `${pageOrigin}/rutina/${live.id}`
                    : `/rutina/${live.id}`}
                </span>
                <button
                  type="button"
                  className="btn btn--soft"
                  onClick={handleCopyLink}
                >
                  {tx(locale, "copyLink")}
                </button>
              </div>
              <p className="share-strip__label share-strip__label--next">
                {tx(locale, "athleteLink")}
              </p>
              <div className="share-strip__row">
                <span className="share-strip__url">
                  {pageOrigin
                    ? `${pageOrigin}/rutina/${live.id}?leer=1`
                    : `/rutina/${live.id}?leer=1`}
                </span>
                <button
                  type="button"
                  className="btn btn--soft"
                  onClick={handleCopyAthleteLink}
                >
                  {tx(locale, "copyAthlete")}
                </button>
              </div>
              <p className="share-strip__hint">
                {copyMsg || tx(locale, "athleteHint")}
              </p>
            </div>
          ) : null}

          <div className="dose-sheet">
            <p className="share-strip__label">{tx(locale, "doseSheet")}</p>
            <ol className="dose-sheet__list">
              {exercises.map((ex, i) => {
                const meta = [ex.dose.setsReps, ex.dose.rpe, ex.dose.rest]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={ex.id}>
                    <strong>
                      {String(i + 1).padStart(2, "0")}. {ex.name}
                    </strong>
                    {meta ? <span>{meta}</span> : null}
                  </li>
                );
              })}
            </ol>
            <div className="share-strip__row no-print">
              <button
                type="button"
                className="btn btn--soft"
                onClick={handleCopyDose}
              >
                {tx(locale, "copyDose")}
              </button>
              <a
                className="btn btn--soft"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tx(locale, "whatsapp")}
              </a>
            </div>
            {doseMsg ? (
              <p className="share-strip__hint no-print" role="status">
                {doseMsg}
              </p>
            ) : null}
          </div>

          <div className="hero__meta">
            <div className="meta-chip">
              <strong>{exercises.length}</strong>
              <span>{tx(locale, "blocks")}</span>
            </div>
            {live.duration ? (
              <div className="meta-chip">
                <strong>{live.duration}</strong>
                <span>{tx(locale, "durationChip")}</span>
              </div>
            ) : null}
            {live.frequency ? (
              <div className="meta-chip">
                <strong>{live.frequency}</strong>
                <span>{tx(locale, "frequencyChip")}</span>
              </div>
            ) : null}
            <div className="meta-chip">
              <strong>
                {live.level === "principiante"
                  ? tx(locale, "levelBeg")
                  : live.level === "avanzado"
                    ? tx(locale, "levelAdv")
                    : tx(locale, "levelMid")}
              </strong>
              <span>{tx(locale, "levelChip")}</span>
            </div>
            {live.coachName ? (
              <div className="meta-chip">
                <strong>{live.coachName}</strong>
                <span>Coach</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {canCoach && storeError && (
        <div className="no-print mx-auto mb-4 max-w-[1100px] alert-error">
          <div className="flex items-start justify-between gap-3">
            <span>{storeError}</span>
            <button
              type="button"
              className="shrink-0 text-[var(--primary-soft)] underline"
              onClick={() => setError(null)}
            >
              {tx(locale, "close")}
            </button>
          </div>
        </div>
      )}

      {canCoach && (
        <div className="coach-toolbar no-print">
          <div className="coach-toolbar__inner">
            <div className="coach-toolbar__hint">
              {editMode
                ? tx(locale, "editHint")
                : isClara
                  ? tx(locale, "claraHint")
                  : tx(locale, "studioHint")}
            </div>
            <div className="coach-toolbar__actions">
              <button
                type="button"
                className={`btn btn--soft ${editMode ? "is-on" : ""}`}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? tx(locale, "exitEdit") : tx(locale, "edit")}
              </button>
              <button
                type="button"
                className={`btn btn--soft ${showChanges ? "is-on" : ""}`}
                onClick={toggleChanges}
              >
                {showChanges ? tx(locale, "hideChanges") : tx(locale, "askChanges")}
              </button>
              <button
                type="button"
                className="btn btn--soft"
                disabled={dupBusy}
                onClick={handleDuplicate}
              >
                {dupBusy ? tx(locale, "copying") : tx(locale, "useAsBase")}
              </button>
              <button
                type="button"
                className="btn btn--soft"
                disabled={!hasPrevious}
                onClick={handleUndo}
              >
                {tx(locale, "undoChange")}
              </button>
              <button type="button" className="btn btn--soft" onClick={persist}>
                {tx(locale, "save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {canCoach && (
        <div
          hidden={!showChanges}
          className="revision-slot no-print"
        >
          <RevisionPanel
            routine={live}
            onClaraView={() => setMode("clara")}
            onRevised={async (next) => {
              await setCurrent(next);
            }}
          />
        </div>
      )}

      <div className="ex-nav-wrap">
        <nav className="ex-nav" aria-label={tx(locale, "exercisesNav")}>
          {exercises.map((ex, i) => (
            <a
              key={ex.id}
              href={`#ex-${ex.id}`}
              className={`ex-nav__btn ${activeId === ex.id ? "is-active" : ""}`}
              onClick={() => setActiveId(ex.id)}
            >
              <span className="ex-nav__num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="ex-nav__label">{ex.name}</span>
            </a>
          ))}
        </nav>
      </div>

      <main className="main">
        {exercises.map((ex, i) => (
          <Reveal key={ex.id} className="mb-0">
            <ExerciseCard
              exercise={ex}
              index={i}
              editable={canEdit}
              busy={busyMap[ex.id]}
              isFirst={i === 0}
              isLast={i === exercises.length - 1}
              onChange={(patch) => updateExercise(ex.id, patch)}
              onReorder={(dir) => reorderExercise(ex.id, dir)}
              onRegenerateText={() => regenText(ex)}
              onRegenerateImage={() => regenImage(ex)}
              onRemove={() => {
                if (confirm(`¿Eliminar ${ex.name}?`)) removeExercise(ex.id);
              }}
            />
          </Reveal>
        ))}
      </main>

      <footer className="footer">
        <p>
          <strong>ARMATUS</strong>
          {" · "}
          Coach Studio
          {live.coachName ? ` · ${live.coachName}` : ""}
          {" · "}
          para {live.clientName}
        </p>
      </footer>

      {canCoach && (
        <div className="studio-bar no-print">
          <div className="flex flex-wrap gap-2">
            <Link href="/crear" className="btn btn--ghost">
              {tx(locale, "newRoutine")}
            </Link>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? tx(locale, "cleanView") : tx(locale, "edit")}
            </button>
            <button
              type="button"
              className={`btn btn--ghost ${showChanges ? "is-on" : ""}`}
              onClick={toggleChanges}
            >
              {showChanges ? tx(locale, "hideChanges") : tx(locale, "askChanges")}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={dupBusy}
              onClick={handleDuplicate}
            >
              {dupBusy ? tx(locale, "copying") : tx(locale, "useAsBase")}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={!hasPrevious}
              onClick={handleUndo}
            >
              {tx(locale, "undoChange")}
            </button>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={pdfBusy}
            onClick={handlePdf}
          >
            {pdfBusy
              ? tx(locale, "pdfBusy")
              : isClara
                ? tx(locale, "pdfClara")
                : tx(locale, "pdfStudio")}
          </button>
        </div>
      )}
    </div>
  );
}
