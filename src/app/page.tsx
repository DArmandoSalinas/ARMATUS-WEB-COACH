"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
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
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-16 text-center">
        <div className="motion-rise">
          <BrandMark size="hero" />
        </div>

        <h1 className="motion-rise-delay mt-10 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(1.7rem,4.5vw,2.6rem)] font-extrabold leading-[1.05] tracking-[0.04em] uppercase">
          Studio para coaches.
        </h1>
        <p className="motion-rise-delay mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)] sm:text-lg">
          Cada coach escribe su nombre, genera la rutina con un prompt, ajusta a
          mano o pide cambios con otro prompt, y descarga el PDF para el atleta.
        </p>

        <div className="motion-rise-delay mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/crear" className="btn btn--primary">
            Crear rutina con prompt
          </Link>
          <Link href={`/rutina/${lastId}`} className="btn btn--ghost">
            Ver última rutina
          </Link>
        </div>

        <Link
          href={`/rutina/${SEED_ROUTINE_ID}`}
          className="motion-rise-delay mt-6 text-sm tracking-[0.08em] text-[var(--primary-soft)] uppercase transition hover:text-[var(--primary)]"
        >
          Abrir plantilla ejemplo
        </Link>
      </section>
    </main>
  );
}
