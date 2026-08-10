"use client";

import { useState } from "react";
import { fillMissingBocetos } from "@/lib/fillBocetosClient";
import type { Routine } from "@/lib/types";

const PLACEHOLDER = `Ejemplos:
• Baja la intensidad a principiante y reduce series
• Cambia el Single-Leg RDL por bridge unipodal
• Añade un bloque de movilidad de cadera al inicio
• Haz las explicaciones más cortas y directas
• Cambia el cliente a María y enfoca prevención de ITBS`;

type RevisionPanelProps = {
  routine: Routine;
  onRevised: (routine: Routine) => void | Promise<void>;
};

export function RevisionPanel({ routine, onRevised }: RevisionPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleRevise() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    setStatus("Aplicando cambios de texto…");

    try {
      const lean: Routine = {
        ...routine,
        exercises: routine.exercises.map((ex) => ({
          ...ex,
          imageDataUrl: undefined,
        })),
      };

      const res = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changePrompt: prompt.trim(),
          routine: lean,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudieron aplicar los cambios");
      }

      const revisedText = data.routine as Routine;
      // Preserve coach name from current session
      revisedText.coachName = routine.coachName;

      const { routine: withImages, failedNames } = await fillMissingBocetos(
        routine,
        revisedText,
        setStatus,
      );

      await onRevised(withImages);
      setPrompt("");
      if (failedNames.length > 0) {
        setStatus(
          `Cambios aplicados. ${failedNames.length} boceto(s) pendiente(s) — usa Generar en cada ejercicio.`,
        );
      } else {
        setStatus("Cambios aplicados");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass no-print mb-8 rounded-[24px] p-4 sm:p-5">
      <div className="mb-2 font-[family-name:var(--font-display)] text-[0.72rem] font-bold tracking-[0.18em] text-[var(--primary)] uppercase">
        Pedir cambios
      </div>
      <p className="mb-3 text-sm text-[var(--text-secondary)]">
        Describe qué quieres ajustar. Actualizamos la rutina sin empezar de cero.
        También puedes editar cada bloque a mano más abajo.
      </p>
      <textarea
        className="prompt-surface !min-h-[140px] !rounded-[18px] !p-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={busy}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--text-secondary)]">
          {busy ? (
            <span className="inline-flex items-center gap-3">
              <span className="loading-core !h-6 !w-6 !border-[1.5px]" />
              {status}
            </span>
          ) : (
            status || "Listo para revisar"
          )}
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !prompt.trim()}
          onClick={handleRevise}
        >
          {busy ? "Aplicando…" : "Aplicar cambios"}
        </button>
      </div>
      {error && (
        <div className="mt-3 rounded-[14px] border border-[rgba(255,69,58,0.35)] bg-[rgba(255,69,58,0.1)] px-4 py-3 text-sm text-[#ffb4af]">
          {error}
        </div>
      )}
    </section>
  );
}
