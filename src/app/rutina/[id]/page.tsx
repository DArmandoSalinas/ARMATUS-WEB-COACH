"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { RoutinePreview } from "@/components/RoutinePreview";
import { SiteTopbar } from "@/components/SiteTopbar";
import { useLocale } from "@/components/LocaleToggle";
import { tx } from "@/lib/i18n";
import { fetchPublishedRoutine } from "@/lib/publishClient";
import {
  getRoutineHydrated,
  recoverStorageQuota,
  saveRoutine,
} from "@/lib/storage";
import { useStudioStore } from "@/lib/store";
import type { Routine } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ leer?: string | string[] }>;
};

/**
 * Prefer local storage; if missing (shared link / other browser),
 * fetch the published copy from /api/routines/[id].
 */
export default function RutinaPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const query = use(searchParams);
  const leer = query.leer;
  const athleteView =
    leer === "1" || (Array.isArray(leer) && leer.includes("1"));
  const locale = useLocale();
  const current = useStudioStore((s) => s.current);
  const [hydrated, setHydrated] = useState<Routine | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    recoverStorageQuota();

    (async () => {
      const remotePromise = fetchPublishedRoutine(id);
      const local = await getRoutineHydrated(id);
      if (cancelled) return;

      let remote: Routine | null = null;
      try {
        remote = await remotePromise;
      } catch {
        remote = null;
      }
      if (cancelled) return;

      const pick =
        local && remote
          ? remote.updatedAt > local.updatedAt
            ? remote
            : local
          : (local ?? remote);

      if (pick) {
        if (remote && pick === remote) {
          try {
            await saveRoutine(pick);
          } catch {
            // still show even if local cache fails
          }
        }
        useStudioStore.setState({ current: pick, error: null });
        setHydrated(pick);
        return;
      }

      setHydrated(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const live =
    current?.id === id ? current : hydrated === undefined ? null : hydrated;

  if (hydrated === undefined && current?.id !== id) {
    return (
      <div className="relative z-10 flex min-h-dvh flex-col">
        <SiteTopbar />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="loading-core mb-4" />
          <p className="text-sm tracking-[0.14em] text-[var(--text-secondary)] uppercase">
            {tx(locale, "loadingRoutine")}
          </p>
        </div>
      </div>
    );
  }

  if (!live) {
    return (
      <div className="relative z-10 flex min-h-dvh flex-col">
        <SiteTopbar />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[0.08em] uppercase">
            {tx(locale, "missingTitle")}
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            {tx(locale, "missingBody")}
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/crear" className="btn btn--primary">
              {tx(locale, "ctaCreate")}
            </Link>
            <Link href="/" className="btn btn--ghost">
              {tx(locale, "home")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <RoutinePreview routine={live} editable athleteView={athleteView} />;
}
