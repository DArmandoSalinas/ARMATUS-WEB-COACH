import type { Routine } from "./types";

export function formatDoseCard(routine: Routine): string {
  const lines = [
    `ARMATUS · ${routine.clientName}`,
    routine.coachName ? `Coach ${routine.coachName}` : "",
    routine.objective,
    routine.duration || routine.frequency
      ? [routine.duration, routine.frequency].filter(Boolean).join(" · ")
      : "",
    "",
  ].filter((line, i, arr) => line !== "" || arr[i - 1] !== "");

  const exercises = [...routine.exercises].sort((a, b) => a.order - b.order);
  for (const [i, ex] of exercises.entries()) {
    const n = String(i + 1).padStart(2, "0");
    const meta = [ex.dose.setsReps, ex.dose.rpe, ex.dose.rest]
      .filter(Boolean)
      .join(" · ");
    lines.push(`${n}. ${ex.name}`);
    if (meta) lines.push(`    ${meta}`);
  }

  return lines.join("\n").trim();
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
