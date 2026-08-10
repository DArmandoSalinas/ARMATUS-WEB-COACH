import fs from "node:fs";
import path from "node:path";
import { toFile } from "openai";
import { CHARACTER_REFERENCE_FILES } from "./bocetoCharacter";

export function characterReferencePaths(): string[] {
  const dir = path.join(process.cwd(), "public", "bocetos");
  return CHARACTER_REFERENCE_FILES.map((f) => path.join(dir, f)).filter((p) =>
    fs.existsSync(p),
  );
}

/** OpenAI uploadable Files for images.edit (character consistency). */
export async function loadCharacterReferenceFiles() {
  const paths = characterReferencePaths();
  const files = await Promise.all(
    paths.map(async (p) => {
      const buf = fs.readFileSync(p);
      return toFile(buf, path.basename(p), { type: "image/jpeg" });
    }),
  );
  return files;
}

/** Data URLs for fal / other providers that want image_urls. */
export function characterReferenceDataUrls(): string[] {
  return characterReferencePaths().map((p) => {
    const buf = fs.readFileSync(p);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  });
}
