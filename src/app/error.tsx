"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleToggle";
import { SiteTopbar } from "@/components/SiteTopbar";
import { tx } from "@/lib/i18n";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  useEffect(() => {
    console.error("[armatus]", error);
  }, [error]);

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <SiteTopbar />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[0.08em] uppercase">
          {tx(locale, "errTitle")}
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          {tx(locale, "errBody")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn--primary" onClick={reset}>
            {tx(locale, "retry")}
          </button>
          <Link href="/" className="btn btn--ghost">
            {tx(locale, "home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
