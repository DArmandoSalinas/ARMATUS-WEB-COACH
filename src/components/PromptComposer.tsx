"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fillMissingBocetos } from "@/lib/fillBocetosClient";
import {
  briefIsReady,
  buildRoutineBrief,
  clearBriefDraft,
  EMPTY_BRIEF,
  exampleBrief,
  loadBriefDraft,
  saveBriefDraft,
  type BriefFields,
} from "@/lib/briefForm";
import { fetchJson } from "@/lib/http";
import { tx } from "@/lib/i18n";
import { recoverStorageQuota } from "@/lib/storage";
import { useStudioStore } from "@/lib/store";
import type { Level, Routine } from "@/lib/types";
import { HeroEnergy } from "./HeroEnergy";
import { HeroThunder } from "./HeroThunder";
import { useLocale } from "./LocaleToggle";
import { Reveal } from "./Reveal";
import { SiteTopbar } from "./SiteTopbar";

const COACH_STORAGE_KEY = "armatus-coach-name";

export function PromptComposer() {
  const router = useRouter();
  const locale = useLocale();
  const setCurrent = useStudioStore((s) => s.setCurrent);
  const [coachName, setCoachName] = useState("");
  const [mode, setMode] = useState<"form" | "brief">("form");
  const [fields, setFields] = useState<BriefFields>(EMPTY_BRIEF);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const skipDraftSave = useRef(false);

  useEffect(() => {
    try {
      recoverStorageQuota();
    } catch {
      /* ignore */
    }
    const draft = loadBriefDraft();
    const savedCoach = localStorage.getItem(COACH_STORAGE_KEY) ?? "";
    const frame = requestAnimationFrame(() => {
      if (draft) {
        setCoachName(draft.coachName || savedCoach);
        setMode(draft.mode);
        setFields(draft.fields);
        setDraftReady(true);
      } else if (savedCoach) {
        setCoachName(savedCoach);
      }
      setDraftHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!draftHydrated || busy || skipDraftSave.current) return;
    const timer = window.setTimeout(() => {
      if (skipDraftSave.current) return;
      saveBriefDraft({ coachName, mode, fields });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [coachName, mode, fields, busy, draftHydrated]);

  function patch(partial: Partial<BriefFields>) {
    setFields((prev) => ({ ...prev, ...partial }));
  }

  const prompt = buildRoutineBrief(fields, locale);
  const canGenerate = Boolean(coachName.trim() && briefIsReady(fields));
  const generateHint = !coachName.trim()
    ? tx(locale, "hintCoach")
    : !briefIsReady(fields)
      ? tx(locale, "hintBrief")
      : null;

  async function handleGenerate() {
    if (!canGenerate || busy) return;
    if (!coachName.trim()) {
      setError(tx(locale, "errorCoach"));
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(tx(locale, "statusText"));
    localStorage.setItem(COACH_STORAGE_KEY, coachName.trim());

    try {
      const { ok, data } = await fetchJson<{
        error?: string;
        routine?: Routine;
      }>("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          coachName: coachName.trim(),
          locale,
        }),
        timeoutMs: 115_000,
      });
      if (!ok || !data.routine) {
        throw new Error(data.error || "No se pudo generar la rutina");
      }

      const draft = data.routine;
      const needsBocetos = draft.exercises.some((ex) => !ex.imageDataUrl);
      let routine = draft;
      if (needsBocetos) {
        setStatus(tx(locale, "statusBocetos"));
        const filled = await fillMissingBocetos(null, draft, setStatus);
        routine = filled.routine;
        if (filled.failedNames.length > 0) {
          setStatus(
            `${tx(locale, "statusDone")}. ${filled.failedNames.length} ${tx(locale, "statusBocetosFail")}`,
          );
        }
      }

      await setCurrent(routine);
      setStatus(tx(locale, "statusPublish"));
      try {
        const { publishRoutineClient } = await import("@/lib/publishClient");
        await publishRoutineClient(routine);
      } catch {
        /* share can retry from the routine page */
      }
      setStatus(tx(locale, "statusDone"));
      skipDraftSave.current = true;
      clearBriefDraft();
      router.push(`/rutina/${routine.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      if (message.toLowerCase().includes("quota")) {
        setError(tx(locale, "errorQuota"));
        try {
          localStorage.removeItem("armatus-coach-routines");
        } catch {
          /* ignore */
        }
      } else {
        setError(
          message.includes("2 minutos")
            ? `${message} ${tx(locale, "errorTimeout")}`
            : message,
        );
      }
      setStatus(tx(locale, "statusError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-dvh">
      <HeroEnergy intensity="compact" className="opacity-70" />
      <HeroThunder className="opacity-55" />
      <SiteTopbar />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="relative z-[2] motion-rise-2 mt-6 mb-6">
          <div className="mb-2 text-[0.78rem] font-bold tracking-[0.22em] text-[var(--primary)] uppercase font-[family-name:var(--font-display)]">
            {tx(locale, "composerEyebrow")}
          </div>
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1] tracking-[0.03em] uppercase">
            {tx(locale, "composerTitle")}{" "}
            <span className="text-[var(--primary)]">
              {tx(locale, "composerAccent")}
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            {tx(locale, "composerLead")}
          </p>
        </div>

        <Reveal className="relative z-[2]">
          <form
            className="glass relative overflow-hidden rounded-[28px] p-4 sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              void handleGenerate();
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void handleGenerate();
              }
            }}
          >
            <label className="relative mb-4 block">
              <span className="field-kicker">{tx(locale, "coach")}</span>
              <input
                type="text"
                className="coach-input"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                placeholder={tx(locale, "coachPh")}
                disabled={busy}
                autoComplete="name"
                autoCapitalize="words"
              />
            </label>

            <div
              className="theme-toggle mb-5"
              role="group"
              aria-label={tx(locale, "modeForm")}
            >
              <button
                type="button"
                className={`theme-toggle__btn${mode === "form" ? " is-on" : ""}`}
                aria-pressed={mode === "form"}
                disabled={busy}
                onClick={() => setMode("form")}
              >
                {tx(locale, "modeForm")}
              </button>
              <button
                type="button"
                className={`theme-toggle__btn${mode === "brief" ? " is-on" : ""}`}
                aria-pressed={mode === "brief"}
                disabled={busy}
                onClick={() => setMode("brief")}
              >
                {tx(locale, "modeBrief")}
              </button>
            </div>

            {mode === "form" ? (
              <div className="brief-grid">
                <div className="brief-grid--2">
                  <label className="block">
                    <span className="field-kicker">{tx(locale, "client")}</span>
                    <input
                      className="field-edit"
                      value={fields.client}
                      onChange={(e) => patch({ client: e.target.value })}
                      placeholder={tx(locale, "clientPh")}
                      disabled={busy}
                    />
                  </label>
                  <label className="block">
                    <span className="field-kicker">{tx(locale, "level")}</span>
                    <select
                      className="field-edit"
                      value={fields.level}
                      onChange={(e) =>
                        patch({ level: e.target.value as Level })
                      }
                      disabled={busy}
                    >
                      <option value="principiante">{tx(locale, "levelBeg")}</option>
                      <option value="intermedio">{tx(locale, "levelMid")}</option>
                      <option value="avanzado">{tx(locale, "levelAdv")}</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="field-kicker">{tx(locale, "objective")}</span>
                  <input
                    className="field-edit"
                    value={fields.objective}
                    onChange={(e) => patch({ objective: e.target.value })}
                    placeholder={tx(locale, "objectivePh")}
                    disabled={busy}
                  />
                </label>

                <label className="block">
                  <span className="field-kicker">{tx(locale, "equipment")}</span>
                  <input
                    className="field-edit"
                    value={fields.equipment}
                    onChange={(e) => patch({ equipment: e.target.value })}
                    placeholder={tx(locale, "equipmentPh")}
                    disabled={busy}
                  />
                </label>

                <div className="brief-grid--2">
                  <label className="block">
                    <span className="field-kicker">{tx(locale, "duration")}</span>
                    <input
                      className="field-edit"
                      value={fields.duration}
                      onChange={(e) => patch({ duration: e.target.value })}
                      placeholder={tx(locale, "durationPh")}
                      disabled={busy}
                    />
                  </label>
                  <label className="block">
                    <span className="field-kicker">{tx(locale, "frequency")}</span>
                    <input
                      className="field-edit"
                      value={fields.frequency}
                      onChange={(e) => patch({ frequency: e.target.value })}
                      placeholder={tx(locale, "frequencyPh")}
                      disabled={busy}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="field-kicker">{tx(locale, "warmup")}</span>
                  <textarea
                    className="prompt-surface !min-h-[120px] !rounded-[16px] !p-4"
                    value={fields.warmup}
                    onChange={(e) => patch({ warmup: e.target.value })}
                    placeholder={tx(locale, "warmupPh")}
                    disabled={busy}
                  />
                </label>

                <label className="block">
                  <span className="field-kicker">{tx(locale, "mainBlock")}</span>
                  <textarea
                    className="prompt-surface !min-h-[160px] !rounded-[16px] !p-4"
                    value={fields.main}
                    onChange={(e) => patch({ main: e.target.value })}
                    placeholder={tx(locale, "mainPh")}
                    disabled={busy}
                  />
                </label>

                <label className="block">
                  <span className="field-kicker">{tx(locale, "constraints")}</span>
                  <textarea
                    className="prompt-surface !min-h-[88px] !rounded-[16px] !p-4"
                    value={fields.constraints}
                    onChange={(e) => patch({ constraints: e.target.value })}
                    placeholder={tx(locale, "constraintsPh")}
                    disabled={busy}
                  />
                </label>

                <label className="block">
                  <span className="field-kicker">{tx(locale, "notes")}</span>
                  <textarea
                    className="prompt-surface !min-h-[88px] !rounded-[16px] !p-4"
                    value={fields.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    placeholder={tx(locale, "notesPh")}
                    disabled={busy}
                  />
                </label>
              </div>
            ) : (
              <label className="relative block">
                <span className="field-kicker">{tx(locale, "freeBrief")}</span>
                <textarea
                  className="prompt-surface relative"
                  value={fields.freeBrief}
                  onChange={(e) => patch({ freeBrief: e.target.value })}
                  placeholder={tx(locale, "freeBriefPh")}
                  spellCheck
                  disabled={busy}
                />
              </label>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="text-sm text-[var(--text-secondary)]"
                aria-live="polite"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-3">
                    <span className="loading-core !h-7 !w-7 !border-[1.5px]" />
                    {status}
                  </span>
                ) : generateHint ? (
                  generateHint
                ) : draftReady ? (
                  tx(locale, "draftSaved")
                ) : (
                  status || tx(locale, "readyForm")
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={busy}
                  onClick={() => {
                    setMode("form");
                    setFields(exampleBrief(locale));
                  }}
                >
                  {tx(locale, "useExample")}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={busy}
                  onClick={() => {
                    setFields(EMPTY_BRIEF);
                    setMode("form");
                    clearBriefDraft();
                    setDraftReady(false);
                    setStatus(null);
                  }}
                >
                  {tx(locale, "clearDraft")}
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={busy || !canGenerate}
                  aria-busy={busy || undefined}
                  title={generateHint ?? undefined}
                >
                  {busy ? tx(locale, "generating") : tx(locale, "generate")}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert-error mt-4" role="alert">
                {error}
              </div>
            )}
          </form>
        </Reveal>
      </div>
    </div>
  );
}
