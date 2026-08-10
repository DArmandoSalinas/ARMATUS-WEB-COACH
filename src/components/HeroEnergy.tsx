type HeroEnergyProps = {
  /** Compact = fewer particles (tool pages). Full = marketing hero. */
  intensity?: "full" | "compact";
  className?: string;
};

/**
 * Flash / ripple / ember stack from ARMATUS marketing hero.
 */
export function HeroEnergy({
  intensity = "full",
  className = "",
}: HeroEnergyProps) {
  const embers = intensity === "full" ? 8 : 4;
  const ripples = intensity === "full" ? 4 : 2;

  return (
    <div className={`hero-energy ${className}`.trim()} aria-hidden="true">
      <span className="hero-flash" />
      {Array.from({ length: ripples }, (_, i) => (
        <span key={`r-${i}`} className={`ripple ripple--${i + 1}`} />
      ))}
      {Array.from({ length: embers }, (_, i) => (
        <span key={`e-${i}`} className={`ember ember--${i + 1}`} />
      ))}
    </div>
  );
}
