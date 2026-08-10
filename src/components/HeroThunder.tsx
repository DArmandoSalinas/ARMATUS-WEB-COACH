"use client";

import { useId } from "react";

type HeroThunderProps = {
  className?: string;
};

/**
 * Full-bleed diagonal thunder — iconic ARMATUS marketing signature.
 */
export function HeroThunder({ className = "" }: HeroThunderProps) {
  const uid = useId().replace(/:/g, "");
  const glow = `thunder-glow-${uid}`;
  const soft = `thunder-glow-soft-${uid}`;
  const grad = `thunder-grad-${uid}`;

  const mainPath =
    "M40 48 L220 110 L165 145 L410 230 L330 275 L620 370 L530 420 L860 520 L760 575 L1120 680 L1000 740 L1380 820 L1280 860 L1560 890";
  const ghostPath =
    "M120 10 L300 80 L250 110 L480 200 L410 240 L680 340 L600 380 L900 470 L820 520 L1180 640 L1080 690 L1420 780";

  return (
    <div className={`hero-thunder ${className}`.trim()} aria-hidden="true">
      <span className="thunder-strike-flash" />
      <svg
        className="thunder-svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={soft} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient
            id={grad}
            x1="40"
            y1="20"
            x2="1560"
            y2="880"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFB48A" />
            <stop offset="40%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#E04A12" />
          </linearGradient>
        </defs>

        <path
          className="thunder-bloom"
          d={mainPath}
          stroke={`url(#${grad})`}
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${soft})`}
        />
        <path
          className="thunder-main"
          d={mainPath}
          stroke={`url(#${grad})`}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="miter"
          filter={`url(#${glow})`}
        />
        <path
          className="thunder-core"
          d={mainPath}
          stroke="#FFE0C8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="miter"
        />
        <path
          className="thunder-ghost"
          d={ghostPath}
          stroke="#FF6B35"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="miter"
          filter={`url(#${glow})`}
        />

        <path
          className="thunder-branch thunder-branch--1"
          d="M220 110 L310 70 L295 40"
          stroke="#FFB48A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glow})`}
        />
        <path
          className="thunder-branch thunder-branch--2"
          d="M410 230 L520 195 L505 155"
          stroke="#FF6B35"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glow})`}
        />
        <path
          className="thunder-branch thunder-branch--3"
          d="M620 370 L540 330 L500 290"
          stroke="#E04A12"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glow})`}
        />
        <path
          className="thunder-branch thunder-branch--4"
          d="M860 520 L980 480 L960 430"
          stroke="#FFB48A"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glow})`}
        />
        <path
          className="thunder-branch thunder-branch--5"
          d="M1120 680 L1240 640 L1210 590"
          stroke="#FF6B35"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glow})`}
        />
        <path
          className="thunder-branch thunder-branch--6"
          d="M1000 740 L920 800 L860 830"
          stroke="#E04A12"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glow})`}
        />
      </svg>

      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className={`thunder-spark thunder-spark--${i + 1}`} />
      ))}
    </div>
  );
}
