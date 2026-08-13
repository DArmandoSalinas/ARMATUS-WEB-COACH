import fs from "node:fs";
import path from "node:path";
import { toFile } from "openai";
import {
  CHARACTER_REFERENCE_FILES,
  FLOOR_CHARACTER_REFERENCE_FILES,
  PRESS_CHARACTER_REFERENCE_FILES,
  SAFE_CHARACTER_REFERENCE_FILES,
} from "./bocetoCharacter";
import {
  shouldExcludeBarbellReferences,
  shouldExcludePullingReferences,
  shouldUseFloorCharacterReferences,
  type VisualBrief,
} from "./bocetoBrief";
import {
  classifyLift,
  shouldSkipCharacterReferences,
} from "./bocetoFidelity";

function pathsForFiles(files: readonly string[]): string[] {
  const dir = path.join(process.cwd(), "public", "bocetos");
  return files.map((f) => path.join(dir, f)).filter((p) => fs.existsSync(p));
}

export function characterReferencePaths(brief?: VisualBrief): string[] {
  if (brief && shouldSkipCharacterReferences(classifyLift(brief.primaryVariation))) {
    return [];
  }
  const files = !brief
    ? CHARACTER_REFERENCE_FILES
    : shouldUseFloorCharacterReferences(brief)
      ? FLOOR_CHARACTER_REFERENCE_FILES
      : shouldExcludePullingReferences(brief)
        ? PRESS_CHARACTER_REFERENCE_FILES
        : shouldExcludeBarbellReferences(brief)
          ? SAFE_CHARACTER_REFERENCE_FILES
          : CHARACTER_REFERENCE_FILES;
  return pathsForFiles(files);
}

/** OpenAI uploadable Files for images.edit (character consistency). */
export async function loadCharacterReferenceFiles(brief?: VisualBrief) {
  const paths = characterReferencePaths(brief);
  const files = await Promise.all(
    paths.map(async (p) => {
      const buf = fs.readFileSync(p);
      return toFile(buf, path.basename(p), { type: "image/jpeg" });
    }),
  );
  return files;
}

/** Data URLs for fal / other providers that want image_urls. */
export function characterReferenceDataUrls(brief?: VisualBrief): string[] {
  return characterReferencePaths(brief).map((p) => {
    const buf = fs.readFileSync(p);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  });
}
