type BrandMarkProps = {
  size?: "hero" | "compact";
  showStudio?: boolean;
};

export function BrandMark({ size = "compact", showStudio = true }: BrandMarkProps) {
  const isHero = size === "hero";
  return (
    <div className={isHero ? "text-center" : ""}>
      <div
        className={
          isHero
            ? "font-[family-name:var(--font-display)] text-[clamp(4.2rem,14vw,8.5rem)] font-extrabold leading-none tracking-[0.22em] uppercase"
            : "font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[0.22em] uppercase"
        }
      >
        ARMATUS
      </div>
      {isHero && <span className="wordmark-underline mx-auto w-40" />}
      {showStudio && (
        <div
          className={
            isHero
              ? "mt-5 font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.42em] text-[var(--primary)] uppercase sm:text-base"
              : "mt-1 font-[family-name:var(--font-display)] text-[0.68rem] font-bold tracking-[0.28em] text-[var(--primary)] uppercase"
          }
        >
          Coach Studio
        </div>
      )}
    </div>
  );
}
