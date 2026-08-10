"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger direct children marked with .reveal-child */
  stagger?: boolean;
};

/**
 * Scroll-triggered fade-up — same contract as marketing `.reveal` → `.is-in`.
 */
export function Reveal({
  children,
  className = "",
  stagger = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }

    const narrow = window.matchMedia("(max-width: 899px)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      {
        rootMargin: narrow ? "0px 0px -2% 0px" : "0px 0px -8% 0px",
        threshold: narrow ? 0.06 : 0.12,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${stagger ? "reveal--stagger" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
