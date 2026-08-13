"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleToggle";
import { SiteTopbar } from "@/components/SiteTopbar";
import { tx } from "@/lib/i18n";

export default function NotFound() {
  const locale = useLocale();
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <SiteTopbar />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[0.08em] uppercase">
          {tx(locale, "notFound")}
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          {tx(locale, "notFoundBody")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
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
