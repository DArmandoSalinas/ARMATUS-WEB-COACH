"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleToggle";
import { tx } from "@/lib/i18n";
import { SEED_ROUTINE_ID } from "@/lib/seed";
import {
  deleteRoutine,
  duplicateRoutine,
  getRoutineHydrated,
  listRoutineMeta,
} from "@/lib/storage";
import type { RoutineMeta } from "@/lib/types";

function formatWhen(iso: string, locale: "es" | "en"): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function RecentRoutines() {
  const router = useRouter();
  const locale = useLocale();
  const [items, setItems] = useState<RoutineMeta[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const refresh = () => setItems(listRoutineMeta());
    refresh();
    window.addEventListener("armatus-routine-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("armatus-routine-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const visible = items.filter((r) => r.id !== SEED_ROUTINE_ID);
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? visible.filter(
        (r) =>
          r.clientName.toLowerCase().includes(needle) ||
          r.objective.toLowerCase().includes(needle),
      )
    : visible;
  if (visible.length === 0) return null;

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`${tx(locale, "deleteConfirm")} ${name}?`)) return;
    setBusyId(id);
    try {
      await deleteRoutine(id);
      setItems(listRoutineMeta());
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    try {
      const source = await getRoutineHydrated(id);
      if (!source) return;
      const copy = await duplicateRoutine(source);
      router.push(`/rutina/${copy.id}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
      <h2 className="mb-3 font-[family-name:var(--font-display)] text-[0.72rem] font-bold tracking-[0.22em] text-[var(--primary)] uppercase">
        {tx(locale, "recentTitle")}
      </h2>
      {visible.length > 1 ? (
        <label className="recent-search">
          <span className="sr-only">{tx(locale, "searchRecent")}</span>
          <input
            className="field-edit"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tx(locale, "searchRecent")}
            autoComplete="off"
          />
        </label>
      ) : null}
      <div className="recent-list">
        {filtered.length === 0 ? (
          <p className="recent-empty">{tx(locale, "noRecentMatch")}</p>
        ) : (
          filtered.map((r) => (
          <article key={r.id} className="recent-card">
            <div>
              <h3 className="recent-card__title">{r.clientName}</h3>
              <p className="recent-card__meta">
                {r.objective}
                {r.updatedAt ? ` · ${formatWhen(r.updatedAt, locale)}` : ""}
              </p>
            </div>
            <div className="recent-card__actions no-print">
              <Link href={`/rutina/${r.id}`} className="btn btn--soft">
                {tx(locale, "open")}
              </Link>
              <button
                type="button"
                className="btn btn--soft"
                disabled={busyId === r.id}
                onClick={() => handleDuplicate(r.id)}
              >
                {tx(locale, "useAsBase")}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={busyId === r.id}
                onClick={() => handleDelete(r.id, r.clientName)}
              >
                {tx(locale, "delete")}
              </button>
            </div>
          </article>
          ))
        )}
      </div>
    </section>
  );
}
