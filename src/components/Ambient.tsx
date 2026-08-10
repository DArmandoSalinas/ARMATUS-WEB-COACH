/**
 * Page-wide atmospheric layer — ported from ARMATUS marketing web.
 */
export function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="ambient-orb ambient-orb--a" />
      <span className="ambient-orb ambient-orb--b" />
      <span className="ambient-orb ambient-orb--c" />
      <span className="ambient-orb ambient-orb--d" />
      <div className="ambient__vignette" />
    </div>
  );
}
