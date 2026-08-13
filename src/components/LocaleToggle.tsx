"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  applyLocale,
  readLocale,
  setLocale,
  subscribeLocale,
  tx,
  type Locale,
} from "@/lib/i18n";

function getServerLocale(): Locale {
  return "es";
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, readLocale, getServerLocale);
}

export function LocaleToggle() {
  const locale = useLocale();

  return (
    <div className="theme-toggle" role="group" aria-label={tx(locale, "localeGroup")}>
      <button
        type="button"
        className={`theme-toggle__btn${locale === "es" ? " is-on" : ""}`}
        aria-pressed={locale === "es"}
        aria-label="Español"
        onClick={() => setLocale("es")}
      >
        ES
      </button>
      <button
        type="button"
        className={`theme-toggle__btn${locale === "en" ? " is-on" : ""}`}
        aria-pressed={locale === "en"}
        aria-label="English"
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}

export function LocaleSync() {
  const locale = useLocale();
  useEffect(() => {
    applyLocale(locale);
  }, [locale]);
  return null;
}
