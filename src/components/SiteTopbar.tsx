"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { LocaleToggle } from "./LocaleToggle";
import { ThemeToggle } from "./ThemeToggle";

type SiteTopbarProps = {
  end?: ReactNode;
};

export function SiteTopbar({ end }: SiteTopbarProps) {
  return (
    <header className="site-topbar no-print">
      <Link href="/" className="site-topbar__brand" aria-label="ARMATUS Coach Studio">
        <BrandMark size="compact" />
      </Link>
      <div className="site-topbar__end">
        {end}
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
