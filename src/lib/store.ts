"use client";

import { create } from "zustand";
import type { Exercise, Routine } from "./types";
import {
  ensureSeedRoutine,
  getLastRoutine,
  getRoutineHydrated,
  recoverStorageQuota,
  saveRoutine,
} from "./storage";

type StudioState = {
  hydrated: boolean;
  current: Routine | null;
  generating: boolean;
  error: string | null;
  hydrate: () => void;
  loadRoutine: (id: string) => Promise<Routine | null>;
  setCurrent: (routine: Routine) => Promise<void>;
  persist: () => Promise<void>;
  updateExercise: (exerciseId: string, patch: Partial<Exercise>) => void;
  replaceExercise: (exerciseId: string, next: Exercise) => void;
  reorderExercise: (exerciseId: string, direction: "up" | "down") => void;
  removeExercise: (exerciseId: string) => void;
  setGenerating: (v: boolean) => void;
  setError: (msg: string | null) => void;
};

function reindex(exercises: Exercise[]): Exercise[] {
  return exercises.map((ex, i) => ({ ...ex, order: i }));
}

async function persistSafe(
  routine: Routine,
  set: (partial: Partial<StudioState>) => void,
) {
  try {
    await saveRoutine(routine);
  } catch (err) {
    console.error("[storage]", err);
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo guardar la rutina en este navegador.";
    set({
      error: `Guardado incompleto: ${message}. La rutina sigue en pantalla; no cierres la pestaña.`,
    });
  }
}

export const useStudioStore = create<StudioState>((set, get) => ({
  hydrated: false,
  current: null,
  generating: false,
  error: null,

  hydrate: () => {
    recoverStorageQuota();
    ensureSeedRoutine();
    const last = getLastRoutine();
    set({ hydrated: true, current: last });
  },

  loadRoutine: async (id) => {
    recoverStorageQuota();
    const routine = await getRoutineHydrated(id);
    if (routine) set({ current: routine, error: null });
    return routine;
  },

  setCurrent: async (routine) => {
    set({ current: routine, error: null });
    await persistSafe(routine, set);
  },

  persist: async () => {
    const { current } = get();
    if (!current) return;
    const next = { ...current, updatedAt: new Date().toISOString() };
    set({ current: next, error: null });
    await persistSafe(next, set);
  },

  updateExercise: (exerciseId, patch) => {
    const { current } = get();
    if (!current) return;
    const exercises = current.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, ...patch } : ex,
    );
    const next = {
      ...current,
      exercises,
      updatedAt: new Date().toISOString(),
    };
    set({ current: next });
    void persistSafe(next, set);
  },

  replaceExercise: (exerciseId, nextEx) => {
    const { current } = get();
    if (!current) return;
    const exercises = current.exercises.map((ex) =>
      ex.id === exerciseId ? nextEx : ex,
    );
    const next = {
      ...current,
      exercises,
      updatedAt: new Date().toISOString(),
    };
    set({ current: next });
    void persistSafe(next, set);
  },

  reorderExercise: (exerciseId, direction) => {
    const { current } = get();
    if (!current) return;
    const list = [...current.exercises].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((ex) => ex.id === exerciseId);
    if (idx < 0) return;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    const next = {
      ...current,
      exercises: reindex(list),
      updatedAt: new Date().toISOString(),
    };
    set({ current: next });
    void persistSafe(next, set);
  },

  removeExercise: (exerciseId) => {
    const { current } = get();
    if (!current) return;
    const list = current.exercises
      .filter((ex) => ex.id !== exerciseId)
      .sort((a, b) => a.order - b.order);
    const next = {
      ...current,
      exercises: reindex(list),
      updatedAt: new Date().toISOString(),
    };
    set({ current: next });
    void persistSafe(next, set);
  },

  setGenerating: (v) => set({ generating: v }),
  setError: (msg) => set({ error: msg }),
}));
