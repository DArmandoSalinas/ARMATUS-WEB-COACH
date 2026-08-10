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
  /** data URL from OpenAI, or public path for seed assets */
  imageDataUrl?: string;
};

export type Routine = {
  id: string;
  createdAt: string;
  updatedAt: string;
  coachName: string;
  clientName: string;
  objective: string;
  level: Level;
  duration: string;
  frequency: string;
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
