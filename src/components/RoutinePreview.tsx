"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Exercise, Routine } from "@/lib/types";
import { downloadRoutinePdf } from "@/lib/pdf/downloadPdf";
import { useStudioStore } from "@/lib/store";
import { ExerciseCard } from "./ExerciseCard";
import { HeroEnergy } from "./HeroEnergy";
import { HeroThunder } from "./HeroThunder";
import { Reveal } from "./Reveal";
import { RevisionPanel } from "./RevisionPanel";
import "@/app/routine.css";

type RoutinePreviewProps = {
  routine: Routine;
  editable?: boolean;
};

export function RoutinePreview({
  routine,
  editable = true,
}: RoutinePreviewProps) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
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
  const storeError = useStudioStore((s) => s.error);
  const setError = useStudioStore((s) => s.setError);

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

  async function handlePdf() {
    setPdfBusy(true);
    try {
      await downloadRoutinePdf(live.clientName, live);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`No se pudo generar el PDF.\n${msg}`);
    } finally {
      setPdfBusy(false);
    }
  }

  async function regenText(exercise: Exercise) {
    setBusyMap((m) => ({ ...m, [exercise.id]: { ...m[exercise.id], text: true } }));
    try {
      const res = await fetch("/api/regenerate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise,
          routineContext: {
            clientName: live.clientName,
            objective: live.objective,
            level: live.level,
            notes: live.notes,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al regenerar texto");
      replaceExercise(exercise.id, data.exercise as Exercise);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al regenerar texto");
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
      const res = await fetch("/api/regenerate-image", {
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al regenerar boceto");
      updateExercise(exercise.id, {
        imageDataUrl: data.imageDataUrl as string,
        ...(data.sketchCaption
          ? { sketchCaption: data.sketchCaption as string }
          : {}),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al regenerar boceto");
    } finally {
      setBusyMap((m) => ({
        ...m,
        [exercise.id]: { ...m[exercise.id], image: false },
      }));
    }
  }

  const canEdit = editable && editMode;

  return (
    <div className="routine-page">
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
        {live.coachName ? (
          <div className="credit-pill">
            Coach <span>{live.coachName}</span>
          </div>
        ) : null}
      </header>

      <section className="hero">
        <HeroEnergy intensity="compact" className="no-print opacity-60" />
        <HeroThunder className="no-print opacity-50" />
        <div className="hero__grid motion-rise-2">
          <div className="hero__eyebrow">Rutina para {live.clientName}</div>
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
            Protocolo biomecánico con dosificación, ejecución técnica, errores
            comunes y bocetos ARMATUS — listo para enviar al atleta.
          </p>

          <div className="hero__actions no-print motion-rise-4">
            <a className="btn btn--primary" href={`#ex-${exercises[0]?.id}`}>
              Empezar rutina
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={pdfBusy}
              onClick={handlePdf}
            >
              {pdfBusy ? "Generando PDF…" : "Descargar PDF"}
            </button>
          </div>

          <div className="hero__meta">
            <div className="meta-chip">
              <strong>{exercises.length}</strong>
              <span>Bloques</span>
            </div>
            <div className="meta-chip">
              <strong>{live.duration}</strong>
              <span>Duración</span>
            </div>
            <div className="meta-chip">
              <strong>{live.frequency}</strong>
              <span>Frecuencia</span>
            </div>
            <div className="meta-chip">
              <strong style={{ textTransform: "capitalize" }}>
                {live.level}
              </strong>
              <span>Nivel</span>
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

      {editable && storeError && (
        <div className="no-print mx-auto mb-4 max-w-[1100px] rounded-[14px] border border-[rgba(255,69,58,0.35)] bg-[rgba(255,69,58,0.1)] px-4 py-3 text-sm text-[#ffb4af]">
          <div className="flex items-start justify-between gap-3">
            <span>{storeError}</span>
            <button
              type="button"
              className="shrink-0 text-[var(--primary-soft)] underline"
              onClick={() => setError(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {editable && (
        <div className="coach-toolbar no-print">
          <div className="coach-toolbar__inner">
            <div className="coach-toolbar__hint">
              {editMode
                ? "Modo edición: ajusta textos, orden y bocetos."
                : "Vista atleta: limpia para revisar y enviar."}
            </div>
            <div className="coach-toolbar__actions">
              <button
                type="button"
                className={`btn btn--soft ${editMode ? "is-on" : ""}`}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? "Salir de edición" : "Editar"}
              </button>
              <button
                type="button"
                className={`btn btn--soft ${showChanges ? "is-on" : ""}`}
                onClick={() => setShowChanges((v) => !v)}
              >
                {showChanges ? "Ocultar cambios" : "Pedir cambios"}
              </button>
              <button type="button" className="btn btn--soft" onClick={persist}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {editable && showChanges && (
        <div id="revision-panel" className="revision-slot no-print">
          <RevisionPanel
            routine={live}
            onRevised={async (next) => {
              await setCurrent(next);
              setShowChanges(false);
            }}
          />
        </div>
      )}

      <div className="ex-nav-wrap">
        <nav className="ex-nav" aria-label="Ejercicios">
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
          <strong style={{ color: "#fff" }}>ARMATUS</strong>
          {" · "}
          Coach Studio
          {live.coachName ? ` · ${live.coachName}` : ""}
          {" · "}
          para {live.clientName}
        </p>
      </footer>

      {editable && (
        <div className="studio-bar no-print">
          <div className="flex flex-wrap gap-2">
            <Link href="/crear" className="btn btn--ghost">
              Nueva rutina
            </Link>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "Vista limpia" : "Editar"}
            </button>
            <button
              type="button"
              className={`btn btn--ghost ${showChanges ? "is-on" : ""}`}
              onClick={() => setShowChanges((v) => !v)}
            >
              {showChanges ? "Ocultar cambios" : "Pedir cambios"}
            </button>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={pdfBusy}
            onClick={handlePdf}
          >
            {pdfBusy ? "Generando PDF…" : "Descargar PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
