#!/usr/bin/env node
/**
 * Generate ARMATUS-style boceto JPGs via OpenAI and write them to:
 *   - public/bocetos/<key>.jpg  (Coach Studio)
 *   - optional: ../ARMATUS/mobile/assets/bocetos/<key>.jpg
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-bocetos.mjs birddog deadbug wallsit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "bocetos");
const armatusDir = path.resolve(root, "../ARMATUS/mobile/assets/bocetos");

const CATALOG = {
  clamshell: {
    name: "side-lying hip external rotation drill",
    caption:
      "athlete lying on side, knees bent 90 degrees, top knee lifting while feet stay together, coaching anatomy sketch",
  },
  birddog: {
    name: "quadruped opposite arm and leg reach",
    caption: "hands and knees, opposite arm and leg extended, neutral spine",
  },
  deadbug: {
    name: "supine opposite arm and leg reach",
    caption: "lying on back, opposite arm and leg extending, low back flat",
  },
  wallsit: {
    name: "isometric wall squat hold",
    caption: "back against wall, thighs parallel to floor, arms relaxed",
  },
  calfraise: {
    name: "standing heel raise",
    caption: "standing heel elevation on step edge, full plantarflexion",
  },
  anklecircle: {
    name: "controlled ankle mobility circles",
    caption: "seated ankle circling through dorsiflexion and plantarflexion",
  },
};

function promptFor(name, caption) {
  return `ARMATUS Coach Studio premium biomechanics boceto.
Pure black background (#000000).
White + molten orange (#FF6B35) dual-line neon technical drawing of: ${name}.
Pose / equipment lock: ${caption}.
UPPER BODY SHIRTLESS (no tank/t-shirt) so working muscles show orange fiber accents; athletic shorts + sneakers only; non-sexual coaching anatomy.
Exact equipment only — do not substitute machines or free weights.
Clean anatomical line art, no fills, no stick figures, no photorealism.
CRITICAL: no text, letters, numbers, labels, watermarks, logos.
Square composition, centered subject, high contrast.`;
}

async function generateOne(client, key) {
  const entry = CATALOG[key];
  if (!entry) {
    throw new Error(
      `Unknown key "${key}". Known: ${Object.keys(CATALOG).join(", ")}`,
    );
  }

  console.log(`→ Generating ${key}…`);
  const prompt = promptFor(entry.name, entry.caption);
  let bytes;

  try {
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "high",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (b64) bytes = Buffer.from(b64, "base64");
    else if (result.data?.[0]?.url) {
      const res = await fetch(result.data[0].url);
      bytes = Buffer.from(await res.arrayBuffer());
    }
  } catch (err) {
    console.warn("gpt-image-1 failed:", err.message);
  }

  if (!bytes) {
    const result = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "hd",
      n: 1,
    });
    const url = result.data?.[0]?.url;
    if (!url) throw new Error(`No image for ${key}`);
    const res = await fetch(url);
    bytes = Buffer.from(await res.arrayBuffer());
  }

  const jpg = await sharp(bytes).jpeg({ quality: 88, mozjpeg: true }).toBuffer();

  const dest = path.join(outDir, `${key}.jpg`);
  fs.writeFileSync(dest, jpg);
  console.log(`  wrote ${dest}`);

  if (fs.existsSync(armatusDir)) {
    const dest2 = path.join(armatusDir, `${key}.jpg`);
    fs.writeFileSync(dest2, jpg);
    console.log(`  wrote ${dest2}`);
  }
}

async function main() {
  const keys = process.argv.slice(2);
  if (!keys.length) {
    console.log(
      "Usage: node --env-file=.env.local scripts/generate-bocetos.mjs <key…>",
    );
    console.log("Keys:", Object.keys(CATALOG).join(", "));
    process.exit(1);
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    process.exit(1);
  }
  const client = new OpenAI({ apiKey });
  for (const key of keys) {
    await generateOne(client, key);
  }
  console.log(
    "Done. Wire new keys into BocetoKey + RULES in bocetoMatch.ts / exerciseBoceto.ts",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
