/**
 * Canonical ARMATUS boceto athlete — same “mono” across the library.
 * Safe for client + server (no Node builtins).
 */
export const ARMATUS_ATHLETE_LOCK = `SAME ATHLETE as the reference bocetos (the ARMATUS library character):
- Adult muscular male, athletic hybrid-athlete build, sharp jaw, short textured slightly messy/spiky dark hair
- Shirtless upper body (always), simple athletic shorts, low-top sneakers
- Clean white + molten orange (#FF6B35) dual-line neon technical sketch on pure black
- Anatomical muscle definition with orange fiber accents on working muscles
- NOT a different person, NOT photoreal, NOT a stick figure, NOT clothed on the torso
Keep face/hair/body proportions consistent with the references while changing ONLY the exercise pose and equipment.`;

/** Best multi-angle character/style anchors from the existing library. */
export const CHARACTER_REFERENCE_FILES = [
  "squat.jpg", // 3/4 rear standing
  "bench.jpg", // side profile lying (BARBELL — exclude when target is DB/band)
  "pullup.jpg", // rear hanging
] as const;

/** Safe standing anchors when barbell refs would contaminate equipment. */
export const SAFE_CHARACTER_REFERENCE_FILES = [
  "squat.jpg",
  "pullup.jpg",
  "pushup.jpg",
] as const;
