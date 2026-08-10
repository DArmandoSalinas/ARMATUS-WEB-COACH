"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { HeroEnergy } from "@/components/HeroEnergy";
import { HeroThunder } from "@/components/HeroThunder";
import { Reveal } from "@/components/Reveal";
import { Typewriter } from "@/components/Typewriter";
import { SEED_ROUTINE_ID } from "@/lib/seed";
import {
  ensureSeedRoutine,
  getLastRoutineId,
  recoverStorageQuota,
} from "@/lib/storage";

function subscribe() {
  return () => {};
}

function getLastIdClient() {
  recoverStorageQuota();
  ensureSeedRoutine();
  return getLastRoutineId() ?? SEED_ROUTINE_ID;
}

function getLastIdServer() {
  return SEED_ROUTINE_ID;
}

export default function HomePage() {
  const lastId = useSyncExternalStore(
    subscribe,
    getLastIdClient,
    getLastIdServer,
  );

  return (
    <main className="relative z-10 flex min-h-dvh flex-col">
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
        <HeroEnergy />
        <HeroThunder />

        <div className="relative z-[2] flex w-full max-w-3xl flex-col items-center">
          <div className="motion-rise-1">
            <BrandMark size="hero" />
          </div>

          <div className="motion-rise-2 mt-8 w-full max-w-xl">
            <Typewriter
              lineA="La rutina no se improvisa."
              lineB="Se arma con el coach."
            />
          </div>

          <h1 className="motion-rise-3 mt-8 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(1.7rem,4.5vw,2.6rem)] font-extrabold leading-[1.05] tracking-[0.04em] uppercase">
            Studio para coaches.
          </h1>
          <p className="motion-rise-4 mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)] sm:text-lg">
            Cada coach escribe su nombre, genera la rutina con un prompt, ajusta
            a mano o pide cambios con otro prompt, y descarga el PDF para el
            atleta.
          </p>

          <div className="motion-rise-5 mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/crear" className="btn btn--primary">
              Crear rutina con prompt
            </Link>
            <Link href={`/rutina/${lastId}`} className="btn btn--ghost">
              Ver última rutina
            </Link>
          </div>

          <Link
            href={`/rutina/${SEED_ROUTINE_ID}`}
            className="motion-rise-5 mt-6 text-sm tracking-[0.08em] text-[var(--primary-soft)] uppercase transition hover:text-[var(--primary)]"
          >
            Abrir plantilla ejemplo
          </Link>
        </div>
      </section>

      <Reveal stagger className="relative z-10 mx-auto grid w-full max-w-3xl gap-3 px-5 pb-20 sm:grid-cols-3">
        <div className="reveal-child sm:col-span-3 mb-1 font-[family-name:var(--font-display)] text-[0.72rem] font-bold tracking-[0.22em] text-[var(--primary)] uppercase">
          Flujo
        </div>
        {[
          { n: "01", t: "Prompt", d: "Describe al atleta y el objetivo." },
          { n: "02", t: "Forja", d: "Texto biomecánico + bocetos ARMATUS." },
          { n: "03", t: "PDF", d: "Edita, pide cambios y envía." },
        ].map((step) => (
          <div
            key={step.n}
            className="reveal-child rounded-[18px] border border-[var(--border)] bg-[rgba(28,28,30,0.65)] px-4 py-4 text-left"
          >
            <div className="font-[family-name:var(--font-display)] text-[0.7rem] font-bold tracking-[0.2em] text-[var(--primary)]">
              {step.n}
            </div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-[0.04em] uppercase">
              {step.t}
            </div>
            <p className="mt-1 m-0 text-sm text-[var(--text-secondary)]">
              {step.d}
            </p>
          </div>
        ))}
      </Reveal>
    </main>
  );
}
