import type { Exercise, Routine, RoutineMeta } from "./types";
import { createSeedRoutine, SEED_ROUTINE_ID } from "./seed";
import { nanoid } from "nanoid";
import {
  deleteImagesForRoutine,
  getImage,
  imageRef,
  isDataUrl,
  isImageRef,
  putImage,
} from "./imageStore";

const ROUTINES_KEY = "armatus-coach-routines";
const LAST_ID_KEY = "armatus-coach-last-id";
const MAX_SAVED_ROUTINES = 8;
const LEGACY_SEED_ID = "seed-lalo-piernas";

let memoryCache: Record<string, Routine> | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("armatus-routine-updated"));
  }
}

/** Strip heavy base64 payloads so localStorage stays under quota. */
function toLeanRoutine(routine: Routine): Routine {
  return {
    ...routine,
    exercises: routine.exercises.map((ex) => {
      if (isDataUrl(ex.imageDataUrl)) {
        return {
          ...ex,
          imageDataUrl: imageRef(routine.id, ex.id),
        };
      }
      return ex;
    }),
  };
}

function stripAllDataUrls(map: Record<string, Routine>): Record<string, Routine> {
  const next: Record<string, Routine> = {};
  for (const [id, routine] of Object.entries(map)) {
    next[id] = {
      ...routine,
      exercises: routine.exercises.map((ex) =>
        isDataUrl(ex.imageDataUrl)
          ? { ...ex, imageDataUrl: imageRef(routine.id, ex.id) }
          : ex,
      ),
    };
  }
  return next;
}

function pruneRoutines(map: Record<string, Routine>): Record<string, Routine> {
  const seed = map[SEED_ROUTINE_ID];
  const others = Object.values(map)
    .filter((r) => r.id !== SEED_ROUTINE_ID)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const kept = others.slice(0, MAX_SAVED_ROUTINES);
  const keptIds = new Set(kept.map((r) => r.id));
  if (seed) keptIds.add(SEED_ROUTINE_ID);

  const dropped = others.slice(MAX_SAVED_ROUTINES);
  for (const r of dropped) {
    void deleteImagesForRoutine(r.id);
  }

  const next: Record<string, Routine> = {};
  for (const id of keptIds) {
    if (map[id]) next[id] = map[id];
  }
  return next;
}

function readAllRaw(): Record<string, Routine> {
  if (!canUseStorage()) return memoryCache ?? {};
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    memoryCache = raw ? (JSON.parse(raw) as Record<string, Routine>) : {};
  } catch {
    memoryCache = {};
  }
  return memoryCache;
}

function writeAllSync(map: Record<string, Routine>) {
  const lean = stripAllDataUrls(pruneRoutines(map));
  memoryCache = lean;

  if (!canUseStorage()) {
    notify();
    return;
  }

  const payload = JSON.stringify(lean);
  try {
    localStorage.setItem(ROUTINES_KEY, payload);
  } catch {
    // Quota exceeded — nuclear cleanup of bloated data URLs / old entries
    try {
      localStorage.removeItem(ROUTINES_KEY);
      const seedOnly: Record<string, Routine> = {
        [SEED_ROUTINE_ID]: toLeanRoutine(createSeedRoutine()),
      };
      // Keep only the most recent non-seed routine (lean)
      const recent = Object.values(lean)
        .filter((r) => r.id !== SEED_ROUTINE_ID)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      if (recent) seedOnly[recent.id] = toLeanRoutine(recent);
      memoryCache = seedOnly;
      localStorage.setItem(ROUTINES_KEY, JSON.stringify(seedOnly));
    } catch {
      memoryCache = {
        [SEED_ROUTINE_ID]: toLeanRoutine(createSeedRoutine()),
      };
      try {
        localStorage.setItem(ROUTINES_KEY, JSON.stringify(memoryCache));
      } catch {
        // Give up persisting text; keep in memory only
      }
    }
  }
  notify();
}

async function persistImages(routine: Routine): Promise<void> {
  await Promise.all(
    routine.exercises.map(async (ex) => {
      if (isDataUrl(ex.imageDataUrl)) {
        const key = `${routine.id}:${ex.id}`;
        await putImage(key, ex.imageDataUrl!);
      }
    }),
  );
}

async function hydrateRoutine(routine: Routine): Promise<Routine> {
  const exercises: Exercise[] = await Promise.all(
    routine.exercises.map(async (ex) => {
      if (!ex.imageDataUrl) return ex;

      if (isImageRef(ex.imageDataUrl)) {
        const key = ex.imageDataUrl.replace(/^idb:/, "");
        const data = await getImage(key);
        return data ? { ...ex, imageDataUrl: data } : { ...ex, imageDataUrl: undefined };
      }

      // Legacy: data URL still in localStorage — migrate out
      if (isDataUrl(ex.imageDataUrl)) {
        const key = `${routine.id}:${ex.id}`;
        try {
          await putImage(key, ex.imageDataUrl);
        } catch {
          // ignore migrate failure
        }
        return ex;
      }

      return ex;
    }),
  );

  return { ...routine, exercises };
}

export function ensureSeedRoutine(): Routine {
  const map = { ...readAllRaw() };
  let dirty = false;

  if (map[LEGACY_SEED_ID]) {
    delete map[LEGACY_SEED_ID];
    dirty = true;
    if (
      canUseStorage() &&
      localStorage.getItem(LAST_ID_KEY) === LEGACY_SEED_ID
    ) {
      localStorage.setItem(LAST_ID_KEY, SEED_ROUTINE_ID);
    }
  }

  if (!map[SEED_ROUTINE_ID]) {
    map[SEED_ROUTINE_ID] = createSeedRoutine();
    dirty = true;
    if (canUseStorage() && !localStorage.getItem(LAST_ID_KEY)) {
      localStorage.setItem(LAST_ID_KEY, SEED_ROUTINE_ID);
    }
  }

  // Refresh seed if still pointing at old /examples assets
  {
    const existing = map[SEED_ROUTINE_ID];
    const needsRefresh = existing?.exercises?.some((ex) =>
      ex.imageDataUrl?.includes("/examples/"),
    );
    if (needsRefresh) {
      const fresh = createSeedRoutine();
      map[SEED_ROUTINE_ID] = {
        ...fresh,
        createdAt: existing?.createdAt || fresh.createdAt,
        coachName: existing?.coachName || "Coach",
      };
      dirty = true;
    }
  }

  let hasLegacyDataUrls = false;
  for (const id of Object.keys(map)) {
    const routine = map[id];
    if (!routine.coachName) {
      map[id] = { ...routine, coachName: "Coach" };
      dirty = true;
    }
    for (const ex of routine.exercises) {
      if (isDataUrl(ex.imageDataUrl)) {
        dirty = true;
        hasLegacyDataUrls = true;
        break;
      }
    }
  }

  if (dirty) {
    if (hasLegacyDataUrls) {
      // Migrate base64 → IndexedDB before stripping localStorage
      void migrateThenWrite(map);
    } else {
      writeAllSync(map);
    }
  }
  return map[SEED_ROUTINE_ID];
}

async function migrateThenWrite(map: Record<string, Routine>): Promise<void> {
  try {
    await Promise.all(Object.values(map).map((r) => persistImages(r)));
  } catch (err) {
    console.warn("[storage] migrate data URLs failed", err);
  }
  writeAllSync(map);
}

/** Clear bloated localStorage immediately (safe to call on app boot). */
export function recoverStorageQuota(): void {
  if (!canUseStorage()) return;
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    if (!raw) return;
    // Heuristic: anything over ~2MB almost certainly has base64 images
    if (raw.length > 2_000_000 || raw.includes("data:image")) {
      const parsed = JSON.parse(raw) as Record<string, Routine>;
      void migrateThenWrite(parsed);
    }
  } catch {
    localStorage.removeItem(ROUTINES_KEY);
    memoryCache = null;
    ensureSeedRoutine();
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  const updated: Routine = {
    ...routine,
    updatedAt: new Date().toISOString(),
  };

  await persistImages(updated);

  const map = { ...readAllRaw() };
  map[updated.id] = toLeanRoutine(updated);
  writeAllSync(map);

  // Keep the hydrated routine (with data URLs) available in-session
  memoryCache = {
    ...readAllRaw(),
    [updated.id]: updated,
  };

  if (canUseStorage()) {
    localStorage.setItem(LAST_ID_KEY, updated.id);
  }
}

export function getRoutine(id: string): Routine | null {
  ensureSeedRoutine();
  const map = readAllRaw();
  return map[id] ?? null;
}

export async function getRoutineHydrated(id: string): Promise<Routine | null> {
  recoverStorageQuota();
  ensureSeedRoutine();
  const map = readAllRaw();
  const routine = map[id];
  if (!routine) return null;
  const hydrated = await hydrateRoutine(routine);
  memoryCache = { ...readAllRaw(), [id]: hydrated };
  return hydrated;
}

export function getLastRoutineId(): string | null {
  if (!canUseStorage()) return null;
  recoverStorageQuota();
  ensureSeedRoutine();
  return localStorage.getItem(LAST_ID_KEY) ?? SEED_ROUTINE_ID;
}

export function getLastRoutine(): Routine | null {
  const id = getLastRoutineId();
  if (!id) return null;
  return getRoutine(id);
}

export function listRoutineMeta(): RoutineMeta[] {
  ensureSeedRoutine();
  const map = readAllRaw();
  return Object.values(map)
    .map((r) => ({
      id: r.id,
      clientName: r.clientName,
      objective: r.objective,
      updatedAt: r.updatedAt,
      level: r.level || "intermedio",
      blocks: Array.isArray(r.exercises) ? r.exercises.length : 0,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteRoutine(id: string): Promise<void> {
  if (id === SEED_ROUTINE_ID) return;
  const map = { ...readAllRaw() };
  delete map[id];
  writeAllSync(map);
  await deleteImagesForRoutine(id);
  if (canUseStorage() && localStorage.getItem(LAST_ID_KEY) === id) {
    localStorage.setItem(LAST_ID_KEY, SEED_ROUTINE_ID);
  }
}

/** Copy a routine (new ids) so the coach can usar esta como base. */
export async function duplicateRoutine(source: Routine): Promise<Routine> {
  const now = new Date().toISOString();
  const id = nanoid(12);
  const exercises: Exercise[] = source.exercises.map((ex, i) => ({
    ...ex,
    id: nanoid(10),
    order: i,
  }));
  const copy: Routine = {
    ...source,
    id,
    createdAt: now,
    updatedAt: now,
    exercises,
  };
  await saveRoutine(copy);
  return copy;
}
