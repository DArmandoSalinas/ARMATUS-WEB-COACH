"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { RoutinePreview } from "@/components/RoutinePreview";
import { getRoutineHydrated, recoverStorageQuota } from "@/lib/storage";
import { useStudioStore } from "@/lib/store";
import type { Routine } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Routines live in localStorage/IndexedDB — unavailable on the server.
 * Wait for client mount before rendering so we don't hydrate-mismatch
 * "not found" (SSR) vs the real routine (client).
 */
export default function RutinaPage({ params }: PageProps) {
  const { id } = use(params);
  const current = useStudioStore((s) => s.current);
  const [hydrated, setHydrated] = useState<Routine | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    recoverStorageQuota();
    getRoutineHydrated(id).then((routine) => {
      if (cancelled) return;
      if (routine) {
        useStudioStore.setState({ current: routine, error: null });
      }
      setHydrated(routine);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const live =
    current?.id === id ? current : hydrated === undefined ? null : hydrated;

  if (hydrated === undefined && current?.id !== id) {
    return (
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-5 text-center">
        <div className="loading-core mb-4" />
        <p className="text-sm tracking-[0.14em] text-[var(--text-secondary)] uppercase">
          Cargando rutina…
        </p>
      </div>
    );
  }

  if (!live) {
    return (
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-5 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[0.08em] uppercase">
          Rutina no encontrada
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Esta rutina no está en este navegador. Genera una nueva o abre la
          plantilla de ejemplo.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/crear" className="btn btn--primary">
            Crear rutina
          </Link>
          <Link href="/" className="btn btn--ghost">
            Inicio
          </Link>
        </div>
      </div>
    );
  }

  return <RoutinePreview routine={live} editable />;
}
