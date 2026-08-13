"use client";

import { useEffect, useSyncExternalStore } from "react";
import { tx } from "@/lib/i18n";
import {
  applyTheme,
  readTheme,
  setTheme,
  subscribeTheme,
  type ThemeMode,
} from "@/lib/theme";
import { useLocale } from "./LocaleToggle";

function getServerTheme(): ThemeMode {
  return "studio";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readTheme,
    getServerTheme,
  );
  const locale = useLocale();
  const isClara = theme === "clara";

  return (
    <div className="theme-toggle" role="group" aria-label={tx(locale, "themeGroup")}>
      <button
        type="button"
        className={`theme-toggle__btn${!isClara ? " is-on" : ""}`}
        aria-pressed={!isClara}
        aria-label={tx(locale, "dark")}
        onClick={() => setTheme("studio")}
      >
        {tx(locale, "dark")}
      </button>
      <button
        type="button"
        className={`theme-toggle__btn${isClara ? " is-on" : ""}`}
        aria-pressed={isClara}
        aria-label={tx(locale, "light")}
        onClick={() => setTheme("clara")}
      >
        {tx(locale, "light")}
      </button>
    </div>
  );
}

/** Keeps html[data-theme] in sync after hydration. */
export function ThemeSync() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readTheme,
    getServerTheme,
  );
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}
