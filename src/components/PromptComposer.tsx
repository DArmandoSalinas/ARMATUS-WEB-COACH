"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fillMissingBocetos } from "@/lib/fillBocetosClient";
import { DEFAULT_PROMPT_PLACEHOLDER } from "@/lib/prompts";
import { SEED_PROMPT } from "@/lib/seed";
import { recoverStorageQuota } from "@/lib/storage";
import { useStudioStore } from "@/lib/store";
import type { Routine } from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { HeroEnergy } from "./HeroEnergy";
import { HeroThunder } from "./HeroThunder";
import { Reveal } from "./Reveal";

const COACH_STORAGE_KEY = "armatus-coach-name";

export function PromptComposer() {
  const router = useRouter();
  const setCurrent = useStudioStore((s) => s.setCurrent);
  // Always start empty so SSR + first client paint match (avoids stuck disabled button).
  const [coachName, setCoachName] = useState("");
  const [prompt, setPrompt] = useState(SEED_PROMPT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Listo para generar");

  useEffect(() => {
    try {
      recoverStorageQuota();
    } catch {
      /* ignore */
    }
    const saved = localStorage.getItem(COACH_STORAGE_KEY) ?? "";
    if (saved) setCoachName(saved);
  }, []);

  async function handleGenerate() {
    if (!prompt.trim() || busy) return;
    if (!coachName.trim()) {
      setError("Escribe el nombre del coach antes de generar.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus("Componiendo explicación biomecánica…");
    localStorage.setItem(COACH_STORAGE_KEY, coachName.trim());

    const statusTimer = window.setTimeout(() => {
      setStatus("Generando bocetos ARMATUS…");
    }, 2500);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          coachName: coachName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar la rutina");

      const draft = data.routine as Routine;
      const needsBocetos = draft.exercises.some((ex) => !ex.imageDataUrl);
      let routine = draft;
      if (needsBocetos) {
        setStatus("Generando bocetos ARMATUS…");
        const filled = await fillMissingBocetos(null, draft, setStatus);
        routine = filled.routine;
        if (filled.failedNames.length > 0) {
          console.warn(
            "[generate] Bocetos fallidos:",
            filled.failedNames.join(", "),
          );
        }
      }

      await setCurrent(routine);
      setStatus("Publicando link compartible…");
      try {
        const { publishRoutineClient } = await import("@/lib/publishClient");
        await publishRoutineClient(routine);
      } catch {
        // Local still works; share can retry from the routine page
      }
      setStatus("Rutina lista");
      router.push(`/rutina/${routine.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      if (message.toLowerCase().includes("quota")) {
        setError(
          "El almacenamiento del navegador estaba lleno. Ya lo liberamos: vuelve a generar la rutina.",
        );
        try {
          localStorage.removeItem("armatus-coach-routines");
        } catch {
          /* ignore */
        }
      } else {
        setError(message);
      }
      setStatus("Error");
    } finally {
      window.clearTimeout(statusTimer);
      setBusy(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-4xl flex-col overflow-hidden px-4 py-8 sm:px-6">
      <HeroEnergy intensity="compact" className="opacity-70" />
      <HeroThunder className="opacity-55" />

      <div className="relative z-[2] mb-8 motion-rise-1">
        <Link href="/" className="opacity-90 transition hover:opacity-100">
          <BrandMark size="compact" />
        </Link>
      </div>

      <div className="relative z-[2] motion-rise-2 mb-6">
        <div className="mb-2 text-[0.78rem] font-bold tracking-[0.22em] text-[var(--primary)] uppercase font-[family-name:var(--font-display)]">
          Prompt Composer
        </div>
        <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1] tracking-[0.03em] uppercase">
          Escribe la rutina.{" "}
          <span className="text-[var(--primary)]">Nosotros la forjamos.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          Escribe tu nombre como coach, pega el brief del atleta y genera la
          rutina. Después podrás editarla o pedir cambios con otro prompt.
        </p>
      </div>

      <Reveal className="relative z-[2]">
      <div className="glass relative overflow-hidden rounded-[28px] p-4 sm:p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,53,0.35), transparent 70%)",
          }}
        />

        <label className="relative mb-4 block">
          <span className="mb-2 block font-[family-name:var(--font-display)] text-[0.72rem] font-bold tracking-[0.18em] text-[var(--primary-soft)] uppercase">
            Coach
          </span>
          <input
            type="text"
            className="coach-input"
            value={coachName}
            onChange={(e) => setCoachName(e.target.value)}
            placeholder="Nombre del coach"
            disabled={busy}
            autoComplete="name"
          />
        </label>

        <textarea
          className="prompt-surface relative"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={DEFAULT_PROMPT_PLACEHOLDER}
          spellCheck
          disabled={busy}
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--text-secondary)]">
            {busy ? (
              <span className="inline-flex items-center gap-3">
                <span className="loading-core !h-7 !w-7 !border-[1.5px]" />
                {status}
              </span>
            ) : (
              status
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={() => setPrompt(SEED_PROMPT)}
            >
              Usar ejemplo
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || !prompt.trim() || !coachName.trim()}
              onClick={handleGenerate}
            >
              {busy ? "Generando…" : "Generar rutina"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-[14px] border border-[rgba(255,69,58,0.35)] bg-[rgba(255,69,58,0.1)] px-4 py-3 text-sm text-[#ffb4af]">
            {error}
          </div>
        )}
      </div>
      </Reveal>
    </div>
  );
}
