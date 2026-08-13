"use client";

import { useEffect, useId, useMemo, useState } from "react";
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
import type { Level, RoutineMeta } from "@/lib/types";

const LEVELS: Level[] = ["principiante", "intermedio", "avanzado"];

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

function levelLabel(locale: "es" | "en", level: Level): string {
  if (level === "principiante") return tx(locale, "levelBeg");
  if (level === "avanzado") return tx(locale, "levelAdv");
  return tx(locale, "levelMid");
}

export function RecentRoutines() {
  const router = useRouter();
  const locale = useLocale();
  const titleId = useId();
  const [items, setItems] = useState<RoutineMeta[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [athlete, setAthlete] = useState("all");
  const [level, setLevel] = useState<"all" | Level>("all");
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
  const athletes = useMemo(() => {
    const names = [...new Set(visible.map((r) => r.clientName.trim()).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b, locale));
  }, [visible, locale]);

  const needle = query.trim().toLowerCase();
  const filtered = visible.filter((r) => {
    if (athlete !== "all" && r.clientName !== athlete) return false;
    if (level !== "all" && r.level !== level) return false;
    if (!needle) return true;
    const blob = `${r.clientName} ${r.objective} ${r.level} ${levelLabel(locale, r.level)}`.toLowerCase();
    return blob.includes(needle);
  });

  useEffect(() => {
    if (visible.length === 0) {
      document.documentElement.classList.remove("has-routines-dock");
      return;
    }
    document.documentElement.classList.add("has-routines-dock");
    return () => document.documentElement.classList.remove("has-routines-dock");
  }, [visible.length]);

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
    <div
      className="routines-dock no-print"
      data-open={open ? "true" : "false"}
    >
      {open ? (
        <button
          type="button"
          className="routines-dock__scrim"
          aria-label={tx(locale, "close")}
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className="routines-dock__sheet"
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="routines-dock__tab"
          aria-expanded={open}
          aria-controls={titleId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="routines-dock__grip" aria-hidden />
          <span className="routines-dock__tab-label">{tx(locale, "archive")}</span>
          <span className="routines-dock__count">{count}</span>
        </button>

        {open ? (
          <div className="routines-dock__body">
            <header className="routines-dock__head">
              <div>
                <p id={titleId} className="routines-dock__title">
                  {tx(locale, "archive")}
                </p>
                <p className="routines-dock__hint">{tx(locale, "archiveHint")}</p>
              </div>
              <button
                type="button"
                className="routines-dock__close"
                onClick={() => setOpen(false)}
              >
                {tx(locale, "close")}
              </button>
            </header>

            <div className="routines-dock__filters">
              <label className="routines-dock__search">
                <span>{tx(locale, "filterKeywords")}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tx(locale, "filterKeywordsPh")}
                  autoComplete="off"
                  autoFocus
                />
              </label>

              {athletes.length > 1 ? (
                <div className="routines-dock__chips" role="group" aria-label={tx(locale, "filterAthlete")}>
                  <span className="routines-dock__chip-label">
                    {tx(locale, "filterAthlete")}
                  </span>
                  <button
                    type="button"
                    className={athlete === "all" ? "is-on" : ""}
                    onClick={() => setAthlete("all")}
                  >
                    {tx(locale, "filterAll")}
                  </button>
                  {athletes.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={athlete === name ? "is-on" : ""}
                      onClick={() => setAthlete(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="routines-dock__chips" role="group" aria-label={tx(locale, "filterLevel")}>
                <span className="routines-dock__chip-label">
                  {tx(locale, "filterLevel")}
                </span>
                <button
                  type="button"
                  className={level === "all" ? "is-on" : ""}
                  onClick={() => setLevel("all")}
                >
                  {tx(locale, "filterAll")}
                </button>
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    className={level === lv ? "is-on" : ""}
                    onClick={() => setLevel(lv)}
                  >
                    {levelLabel(locale, lv)}
                  </button>
                ))}
              </div>
            </div>

            <div className="routines-dock__list">
              {filtered.length === 0 ? (
                <p className="routines-dock__empty">{tx(locale, "noRecentMatch")}</p>
              ) : (
                filtered.map((r) => (
                  <article key={r.id} className="routine-card">
                    <Link
                      href={`/rutina/${r.id}`}
                      className="routine-card__main"
                      onClick={() => setOpen(false)}
                    >
                      <div className="routine-card__meta">
                        <span className="routine-card__level">
                          {levelLabel(locale, r.level)}
                        </span>
                        {r.updatedAt ? (
                          <time dateTime={r.updatedAt}>
                            {formatWhen(r.updatedAt, locale)}
                          </time>
                        ) : null}
                      </div>
                      <h3 className="routine-card__name">{r.clientName}</h3>
                      <p className="routine-card__goal">{r.objective}</p>
                      <p className="routine-card__blocks">
                        {String(r.blocks).padStart(2, "0")} {tx(locale, "blocks")}
                      </p>
                    </Link>
                    <div className="routine-card__tools">
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
