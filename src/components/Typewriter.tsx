"use client";

import { useEffect, useMemo, useState } from "react";

type TypewriterProps = {
  lineA: string;
  lineB: string;
  className?: string;
};

/**
 * Two-line arming typewriter from ARMATUS marketing hero.
 */
export function Typewriter({ lineA, lineB, className = "" }: TypewriterProps) {
  const lines = useMemo(() => [lineA, lineB] as const, [lineA, lineB]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [phase, setPhase] = useState<"a" | "pause" | "b" | "done">("a");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = window.setTimeout(() => {
        setA(lines[0]);
        setB(lines[1]);
        setPhase("done");
      }, 0);
      return () => window.clearTimeout(t);
    }

    let cancelled = false;
    const timers: number[] = [];

    const type = (
      full: string,
      setter: (v: string) => void,
      speed: number,
    ): Promise<void> =>
      new Promise((resolve) => {
        let i = 0;
        const tick = () => {
          if (cancelled) return;
          i += 1;
          setter(full.slice(0, i));
          if (i >= full.length) resolve();
          else timers.push(window.setTimeout(tick, speed));
        };
        timers.push(window.setTimeout(tick, speed));
      });

    (async () => {
      setPhase("a");
      setA("");
      setB("");
      await type(lines[0], setA, 38);
      if (cancelled) return;
      setPhase("pause");
      await new Promise<void>((r) => {
        timers.push(window.setTimeout(() => r(), 420));
      });
      if (cancelled) return;
      setPhase("b");
      await type(lines[1], setB, 52);
      if (!cancelled) setPhase("done");
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [lines]);

  const arming = phase === "b" || phase === "done";
  const lit = phase === "done";
  const showCaretA = phase === "a";
  const showCaretB = phase === "b";

  return (
    <p
      className={`hero-type ${arming ? "is-arming" : ""} ${lit ? "is-lit" : ""} ${className}`.trim()}
      aria-label={`${lineA} ${lineB}`}
    >
      <span className="hero-type__line">
        {a}
        {showCaretA ? <span className="hero-type__caret" aria-hidden="true" /> : null}
      </span>
      {phase !== "a" ? (
        <>
          <br />
          <span
            className={`hero-type__line hero-type__line--b ${arming ? "is-arming" : ""}`}
          >
            {b}
            {showCaretB ? (
              <span className="hero-type__caret" aria-hidden="true" />
            ) : null}
          </span>
        </>
      ) : null}
    </p>
  );
}
