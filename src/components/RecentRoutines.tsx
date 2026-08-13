"use client";

import { useEffect, useId, useState } from "react";
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
  const titleId = useId();
  const [items, setItems] = useState<RoutineMeta[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
      setOpen(false);
      const copy = await duplicateRoutine(source);
      router.push(`/rutina/${copy.id}`);
    } finally {
      setBusyId(null);
    }
  }

  const count = String(visible.length).padStart(2, "0");

  return (
    <>
      <button
        type="button"
        className="archive-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {tx(locale, "archive")}
        <span className="archive-trigger__count">{count}</span>
      </button>

      {open ? (
        <div className="archive no-print">
          <button
            type="button"
            className="archive__scrim"
            aria-label={tx(locale, "close")}
            onClick={() => setOpen(false)}
          />
          <aside
            className="archive__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="archive__head">
              <div>
                <p id={titleId} className="archive__title">
                  {tx(locale, "archive")}
                </p>
                <p className="archive__hint">{tx(locale, "archiveHint")}</p>
              </div>
              <button
                type="button"
                className="archive__close"
                onClick={() => setOpen(false)}
              >
                {tx(locale, "close")}
              </button>
            </header>

            {visible.length > 2 ? (
              <label className="archive__search">
                <span className="sr-only">{tx(locale, "searchRecent")}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tx(locale, "searchRecent")}
                  autoComplete="off"
                  autoFocus
                />
              </label>
            ) : null}

            <div className="archive__list">
              {filtered.length === 0 ? (
                <p className="archive__empty">{tx(locale, "noRecentMatch")}</p>
              ) : (
                filtered.map((r) => (
                  <article key={r.id} className="archive-row">
                    <Link
                      href={`/rutina/${r.id}`}
                      className="archive-row__main"
                      onClick={() => setOpen(false)}
                    >
                      <span className="archive-row__name">{r.clientName}</span>
                      <span className="archive-row__goal">{r.objective}</span>
                    </Link>
                    {r.updatedAt ? (
                      <time
                        className="archive-row__when"
                        dateTime={r.updatedAt}
                      >
                        {formatWhen(r.updatedAt, locale)}
                      </time>
                    ) : null}
                    <div className="archive-row__tools">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => handleDuplicate(r.id)}
                      >
                        {tx(locale, "archiveBase")}
                      </button>
                      <button
                        type="button"
                        className="is-danger"
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
          </aside>
        </div>
      ) : null}
    </>
  );
}
