"use client";

import { useState } from "react";
import { fillMissingBocetos } from "@/lib/fillBocetosClient";
import { fetchJson } from "@/lib/http";
import { tx, type Locale } from "@/lib/i18n";
import { isOpenAiCreditsError } from "@/lib/openaiError";
import { parseChangeIntent, summarizeRevision } from "@/lib/reviseIntent";
import type { Routine } from "@/lib/types";
import { useLocale } from "./LocaleToggle";

type RevisionPanelProps = {
  routine: Routine;
  onRevised: (routine: Routine) => void | Promise<void>;
  onClaraView?: () => void;
};

function composeChangePrompt(
  locale: Locale,
  prompt: string,
  variationHint: string,
  noteHint: string,
): string {
  const parts: string[] = [];
  if (prompt.trim()) parts.push(prompt.trim());
  if (variationHint.trim()) {
    parts.push(
      locale === "en"
        ? `VARIATIONS (mandatory): Do NOT add exercises. Keep the same ids and count. Fill "variation" on EVERY exercise with one substitute: "Instead of [this], you can do [that] — when/why." Extra constraint: ${variationHint.trim()}`
        : `VARIACIONES (obligatorio): NO añadas ejercicios. Conserva los mismos ids y el mismo número. Rellena "variation" en CADA ejercicio: "En vez de [esto], puedes hacer [eso] — cuándo/por qué." Extra: ${variationHint.trim()}`,
    );
  }
  if (noteHint.trim()) {
    parts.push(
      locale === "en"
        ? `EXTRA BOX (mandatory): Fill "note" on the relevant exercise(s) with this explanation. Do not dump it into intro. Text: ${noteHint.trim()}`
        : `CAJA EXTRA (obligatorio): Rellena "note" en el/los ejercicios con esta explicación. No la metas en intro. Texto: ${noteHint.trim()}`,
    );
  }
  return parts.join("\n\n");
}

export function RevisionPanel({
  routine,
  onRevised,
  onClaraView,
}: RevisionPanelProps) {
  const locale = useLocale();
  const shortcuts = [
    {
      label: tx(locale, "shortcutBeginner"),
      prompt: tx(locale, "shortcutBeginnerPrompt"),
    },
    {
      label: tx(locale, "shortcutAdult"),
      prompt: tx(locale, "shortcutAdultPrompt"),
    },
    {
      label: tx(locale, "shortcutWarmup"),
      prompt: tx(locale, "shortcutWarmupPrompt"),
    },
    {
      label: tx(locale, "shortcutVariations"),
      prompt: tx(locale, "shortcutVariationsPrompt"),
    },
    {
      label: tx(locale, "shortcutNote"),
      prompt: tx(locale, "shortcutNotePrompt"),
    },
  ];
  const [prompt, setPrompt] = useState("");
  const [variationHint, setVariationHint] = useState("");
  const [noteHint, setNoteHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [diff, setDiff] = useState<string[]>([]);

  async function handleRevise() {
    const changePrompt = composeChangePrompt(
      locale,
      prompt,
      variationHint,
      noteHint,
    );
    if (!changePrompt || busy) return;
    const intent = parseChangeIntent(changePrompt);

    setBusy(true);
    setError(null);
    setDiff([]);
    setStatus("Aplicando cambios…");

    try {
      if (intent.wantsClaraView) {
        onClaraView?.();
      }

      if (!intent.wantsContentChange && !intent.wantsNewBocetos) {
        setStatus(
          "Listo: activé la apariencia clara (blanco y naranja). El PDF usa el mismo modo.",
        );
        setPrompt("");
        setVariationHint("");
        setNoteHint("");
        return;
      }

      let next: Routine = routine;
      let imageRegenIds: string[] = [];

      if (intent.wantsContentChange) {
        setStatus("Aplicando cambios de texto…");
        const lean: Routine = {
          ...routine,
          exercises: routine.exercises.map((ex) => ({
            ...ex,
            imageDataUrl: undefined,
          })),
        };

        const { ok, data } = await fetchJson<{
          error?: string;
          routine?: Routine;
          imageRegenIds?: string[];
        }>("/api/revise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            changePrompt,
            routine: lean,
          }),
        });

        if (!ok || !data.routine) {
          throw new Error(data.error || "No se pudieron aplicar los cambios");
        }

        next = data.routine;
        next.coachName = routine.coachName;
        imageRegenIds = Array.isArray(data.imageRegenIds)
          ? data.imageRegenIds
          : [];
        await onRevised(next);
      }

      const forceAllBocetos =
        intent.wantsNewBocetos && imageRegenIds.length === 0;
      const mustFill =
        intent.wantsNewBocetos ||
        imageRegenIds.length > 0 ||
        next.exercises.some((ex) => !ex.imageDataUrl);

      if (mustFill) {
        const { routine: withImages, failedNames } = await fillMissingBocetos(
          routine,
          next,
          setStatus,
          {
            forceAi: intent.wantsNewBocetos,
            forceIds: forceAllBocetos ? undefined : imageRegenIds,
            onExercise: (ex) => {
              next = {
                ...next,
                exercises: next.exercises.map((e) =>
                  e.id === ex.id ? { ...e, imageDataUrl: ex.imageDataUrl } : e,
                ),
              };
              void onRevised(next);
            },
          },
        );
        next = withImages;
        const summary = summarizeRevision(routine, next);
        setDiff(summary);
        await onRevised(next);
        setPrompt("");
        setVariationHint("");
        setNoteHint("");
        if (failedNames.length > 0) {
          setStatus(
            `Cambios aplicados. ${failedNames.length} boceto(s) pendiente(s) — pulsa Reintentar boceto en el ejercicio.`,
          );
        } else if (intent.wantsClaraView) {
          setStatus("Cambios aplicados. Versión clara activada.");
        } else {
          setStatus("Cambios aplicados");
        }
        return;
      }

      const summary = summarizeRevision(routine, next);
      setDiff(summary);
      await onRevised(next);
      setPrompt("");
      setVariationHint("");
      setNoteHint("");
      setStatus(
        intent.wantsClaraView
          ? "Cambios aplicados. Versión clara activada."
          : "Cambios aplicados",
      );
    } catch (err) {
      setError(
        isOpenAiCreditsError(err)
          ? tx(locale, "errorCredits")
          : err instanceof Error
            ? err.message
            : "Error desconocido",
      );
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="revision-panel"
      data-busy={busy ? "true" : "false"}
      className="glass no-print mb-8 rounded-[24px] p-4 sm:p-5"
    >
      <div className="mb-2 font-[family-name:var(--font-display)] text-[0.72rem] font-bold tracking-[0.18em] text-[var(--primary)] uppercase">
        {tx(locale, "reviseTitle")}
      </div>
      <p className="mb-3 text-sm text-[var(--text-secondary)]">
        {tx(locale, "reviseLead")}
      </p>
      <div className="coach-chip-row" role="group" aria-label={tx(locale, "askChanges")}>
        {shortcuts.map((chip) => (
          <button
            key={chip.label}
            type="button"
            className="coach-chip"
            disabled={busy}
            onClick={() => setPrompt(chip.prompt)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="revise-minis">
        <label className="revise-mini">
          <span>{tx(locale, "miniVariation")}</span>
          <input
            value={variationHint}
            disabled={busy}
            placeholder={tx(locale, "miniVariationPh")}
            onChange={(e) => setVariationHint(e.target.value)}
          />
        </label>
        <label className="revise-mini">
          <span>{tx(locale, "miniNote")}</span>
          <input
            value={noteHint}
            disabled={busy}
            placeholder={tx(locale, "miniNotePh")}
            onChange={(e) => setNoteHint(e.target.value)}
          />
        </label>
      </div>
      <label className="sr-only" htmlFor="revision-prompt">
        {tx(locale, "askChanges")}
      </label>
      <textarea
        id="revision-prompt"
        className="prompt-surface !min-h-[140px] !rounded-[18px] !p-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={tx(locale, "revisePh")}
        disabled={busy}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--text-secondary)]" aria-live="polite">
          {busy ? (
            <span className="inline-flex items-center gap-3">
              <span className="loading-core !h-6 !w-6 !border-[1.5px]" />
              {status}
            </span>
          ) : (
            status || tx(locale, "reviseReady")
          )}
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={
            busy ||
            (!prompt.trim() && !variationHint.trim() && !noteHint.trim())
          }
          aria-busy={busy || undefined}
          onClick={handleRevise}
        >
          {busy ? tx(locale, "applying") : tx(locale, "apply")}
        </button>
      </div>
      {diff.length > 0 && !busy ? (
        <div className="diff-list" role="status">
          <p>{tx(locale, "whatChanged")}</p>
          <ul>
            {diff.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {error && (
        <div className="alert-error mt-3" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
