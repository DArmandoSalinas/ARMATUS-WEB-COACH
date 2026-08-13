"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { HeroEnergy } from "@/components/HeroEnergy";
import { HeroThunder } from "@/components/HeroThunder";
import { useLocale } from "@/components/LocaleToggle";
import { Reveal } from "@/components/Reveal";
import { SiteTopbar } from "@/components/SiteTopbar";
import { Typewriter } from "@/components/Typewriter";
import { tx } from "@/lib/i18n";
import { SEED_ROUTINE_ID } from "@/lib/seed";
import {
  ensureSeedRoutine,
  getLastRoutineId,
  recoverStorageQuota,
} from "@/lib/storage";

export default function HomePage() {
  const locale = useLocale();
  const [lastId, setLastId] = useState<string | null>(null);

  useEffect(() => {
    recoverStorageQuota();
    ensureSeedRoutine();
    const refresh = () => {
      const id = getLastRoutineId();
      setLastId(id && id !== SEED_ROUTINE_ID ? id : null);
    };
    refresh();
    window.addEventListener("armatus-routine-updated", refresh);
    return () => window.removeEventListener("armatus-routine-updated", refresh);
  }, []);

  return (
    <main className="relative z-10 flex min-h-dvh flex-col">
      <SiteTopbar />
      <section className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
        <HeroEnergy />
        <HeroThunder />

        <div className="relative z-[2] flex w-full max-w-3xl flex-col items-center">
          <div className="motion-rise-1">
            <BrandMark size="hero" />
          </div>

          <div className="motion-rise-2 mt-8 w-full max-w-xl">
            <Typewriter
              lineA={tx(locale, "sloganA")}
              lineB={tx(locale, "sloganB")}
            />
          </div>

          <h1 className="motion-rise-3 mt-8 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(1.7rem,4.5vw,2.6rem)] font-extrabold leading-[1.05] tracking-[0.04em] uppercase">
            {tx(locale, "homeTitle")}
          </h1>
          <p className="motion-rise-4 mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)] sm:text-lg">
            {tx(locale, "homeLead")}
          </p>

          <div className="motion-rise-5 mt-10">
            <Link href="/crear" className="btn btn--primary">
              {tx(locale, "ctaCreate")}
            </Link>
          </div>
          <p className="motion-rise-5 mt-4 max-w-md text-sm text-[var(--text-tertiary)]">
            {tx(locale, "flow3d")}
          </p>

          {lastId ? (
            <Link
              href={`/rutina/${lastId}`}
              className="motion-rise-5 mt-8 text-[0.72rem] tracking-[0.14em] text-[var(--text-tertiary)] uppercase transition hover:text-[var(--text-secondary)]"
            >
              {tx(locale, "lastRoutineQuiet")}
            </Link>
          ) : null}
        </div>
      </section>

      <Reveal stagger className="relative z-10 mx-auto grid w-full max-w-3xl gap-3 px-5 pb-10 sm:grid-cols-3">
        <div className="reveal-child sm:col-span-3 mb-1 font-[family-name:var(--font-display)] text-[0.72rem] font-bold tracking-[0.22em] text-[var(--primary)] uppercase">
          {tx(locale, "flow")}
        </div>
        {(
          [
            ["flow1t", "flow1d"],
            ["flow2t", "flow2d"],
            ["flow3t", "flow3d"],
          ] as const
        ).map(([tKey, dKey], i) => (
          <div
            key={tKey}
            className="reveal-child rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left"
          >
            <div className="font-[family-name:var(--font-display)] text-[0.7rem] font-bold tracking-[0.2em] text-[var(--primary)]">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-[0.04em] uppercase">
              {tx(locale, tKey)}
            </div>
            <p className="mt-1 m-0 text-sm text-[var(--text-secondary)]">
              {tx(locale, dKey)}
            </p>
          </div>
        ))}
      </Reveal>
    </main>
  );
}
