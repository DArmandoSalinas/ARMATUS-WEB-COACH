export type Level = "principiante" | "intermedio" | "avanzado";

export type ExerciseStep = {
  title: string;
  body: string;
};

export type ExerciseDose = {
  setsReps: string;
  rpe?: string;
  rest?: string;
};

export type SupportLink = {
  label?: string;
  url: string;
};

export type Exercise = {
  id: string;
  order: number;
  name: string;
  nameEn?: string;
  badge: string;
  intro: string;
  dose: ExerciseDose;
  purpose: string;
  muscles: string[];
  steps: ExerciseStep[];
  commonMistakes: string[];
  benefit: string;
  sketchCaption: string;
  /** Substitute: "instead of this, you can do that" — not a new exercise */
  variation?: string;
  /** Extra explanation box when the coach asks for one */
  note?: string;
  /** data URL from OpenAI, or public path for seed assets */
  imageDataUrl?: string;
  /** Videos / búsqueda de técnica (YouTube) */
  supportLinks?: SupportLink[];
};

export type Routine = {
  id: string;
  createdAt: string;
  updatedAt: string;
  coachName: string;
  clientName: string;
  objective: string;
  level: Level;
  /** Only set when the coach specified it — never invent. */
  duration?: string;
  /** Only set when the coach specified it — never invent. */
  frequency?: string;
  notes?: string;
  sourcePrompt: string;
  exercises: Exercise[];
};

export type RoutineMeta = {
  id: string;
  clientName: string;
  objective: string;
  updatedAt: string;
};
