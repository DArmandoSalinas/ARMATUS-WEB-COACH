#!/usr/bin/env node
/**
 * Generate ARMATUS-style boceto JPGs via OpenAI and write them to:
 *   - public/bocetos/<key>.jpg  (Coach Studio)
 *   - optional: ../ARMATUS/mobile/assets/bocetos/<key>.jpg
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-bocetos.mjs --missing
 *   node --env-file=.env.local scripts/generate-bocetos.mjs hip90 glutebridge
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI, { toFile } from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "bocetos");
const armatusDir = path.resolve(root, "../ARMATUS/mobile/assets/bocetos");

/** refs: floor = pushup; pull = pullup; standing = squat + pullup (no barbell). */
const CATALOG = {
  hip90: {
    refs: "floor",
    name: "90/90 hip switch on the floor",
    caption:
      "athlete sitting on the floor, both knees and hips at 90 degrees, switching which shin is in front, torso tall, no forward lean, no cables or handles",
  },
  glutebridge: {
    refs: "floor",
    name: "glute bridge on the floor",
    caption:
      "lying on back, knees bent, feet flat, hips lifted into a bridge, no barbell, no bench",
  },
  catcow: {
    refs: "floor",
    name: "quadruped cat-cow spinal wave",
    caption: "hands and knees, mid-wave between flexion and extension, neutral head",
  },
  pigeon: {
    refs: "floor",
    name: "pigeon hip stretch",
    caption:
      "front shin across the floor, rear leg extended, torso upright over the front hip",
  },
  wgs: {
    refs: "floor",
    name: "world's greatest stretch with torso rotation",
    caption:
      "long lunge, both hands on the floor, torso rotating toward the front leg, rear knee extended, not a standing twist",
  },
  inchworm: {
    refs: "floor",
    name: "inchworm walkout",
    caption:
      "hands walking out from a pike toward a high plank, legs long, no push-up yet",
  },
  openbook: {
    refs: "floor",
    name: "side-lying open-book thoracic rotation",
    caption:
      "lying on side, knees stacked, top arm opening the chest toward the ceiling",
  },
  invertedrow: {
    refs: "pull",
    name: "inverted row under a bar",
    caption:
      "body in a straight plank hanging under a fixed bar, pulling chest to the bar, not a seated cable row",
  },
  latpulldown: {
    refs: "pull",
    name: "lat pulldown on a cable machine",
    caption:
      "seated under a lat pulldown bar, pulling the bar to the upper chest, not a pull-up",
  },
  internalrotation: {
    refs: "standing",
    name: "standing shoulder internal rotation with a light band",
    caption:
      "standing, elbow pinned at the side at 90 degrees, band in the working hand rotating the forearm inward, not hip rotation, not a cable row",
  },
  hollowhold: {
    refs: "floor",
    name: "hollow body hold",
    caption:
      "lying on back, lumbar pressed down, shoulders and legs hovering in a banana shape",
  },
  goodmorning: {
    refs: "standing",
    name: "standing good-morning hip hinge",
    caption:
      "standing hinge with a light bar across the upper back, spine long, slight knee bend, not a squat",
  },
  calfraise: {
    refs: "standing",
    name: "standing calf raise",
    caption: "standing heel elevation, full plantarflexion, bodyweight, not seated soleus",
  },
  sideplank: {
    refs: "floor",
    name: "side plank",
    caption:
      "side-lying forearm plank, body in a straight line, hips stacked, not a front plank",
  },
};

function promptFor(name, caption) {
  return `ARMATUS Coach Studio premium biomechanics boceto.
Pure black background (#000000).
White + molten orange (#FF6B35) dual-line neon technical drawing of: ${name}.
Pose / equipment lock: ${caption}.
UPPER BODY SHIRTLESS (no tank/t-shirt) so working muscles show orange fiber accents; athletic shorts + sneakers only; non-sexual coaching anatomy.
Exact equipment only — do not substitute machines or free weights unless the lock names them.
Clean anatomical line art, no fills, no stick figures, no photorealism.
CRITICAL: no text, letters, numbers, labels, watermarks, logos.
Landscape composition matching library bocetos (~3:2), centered subject, high contrast.

REFERENCE IMAGES = CHARACTER + ART STYLE ONLY.
Keep THAT exact man (hair, face, body, shorts/sneakers) and white/orange-on-black line art.
Do NOT copy the exercise or equipment from the references.`;
}

async function loadRefs(kind) {
  const files =
    kind === "floor"
      ? ["pushup.jpg"]
      : kind === "pull"
        ? ["pullup.jpg"]
        : ["squat.jpg", "pullup.jpg"];
  const loaded = [];
  for (const f of files) {
    const p = path.join(outDir, f);
    if (!fs.existsSync(p)) continue;
    loaded.push(await toFile(fs.readFileSync(p), f, { type: "image/jpeg" }));
  }
  return loaded;
}

function writeLibraryJpg(bytes, dest) {
  const tmp = `${dest}.src.bin`;
  fs.writeFileSync(tmp, bytes);
  execFileSync("sips", [
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    "88",
    "-z",
    "512",
    "768",
    tmp,
    "--out",
    dest,
  ]);
  fs.unlinkSync(tmp);
}

async function bytesFromImage(image) {
  if (image?.b64_json) return Buffer.from(image.b64_json, "base64");
  if (image?.url) {
    const res = await fetch(image.url);
    return Buffer.from(await res.arrayBuffer());
  }
  return null;
}

async function generateOne(client, key, { force = false } = {}) {
  const entry = CATALOG[key];
  if (!entry) {
    throw new Error(
      `Unknown key "${key}". Known: ${Object.keys(CATALOG).join(", ")}`,
    );
  }

  const dest = path.join(outDir, `${key}.jpg`);
  if (fs.existsSync(dest) && !force) {
    console.log(`skip ${key} (exists)`);
    return;
  }

  console.log(`→ Generating ${key}…`);
  const prompt = promptFor(entry.name, entry.caption);
  let bytes;

  try {
    const refs = await loadRefs(entry.refs || "standing");
    if (refs.length > 0) {
      const edited = await client.images.edit({
        model: "gpt-image-1",
        image: refs,
        prompt,
        size: "1536x1024",
        quality: "medium",
        output_format: "jpeg",
        output_compression: 86,
        input_fidelity: "low",
      });
      bytes = await bytesFromImage(edited.data?.[0]);
    }
  } catch (err) {
    console.warn("  edit failed:", err.message);
  }

  if (!bytes) {
    try {
      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1536x1024",
        quality: "medium",
        output_format: "jpeg",
        output_compression: 86,
      });
      bytes = await bytesFromImage(result.data?.[0]);
    } catch (err) {
      console.warn("  generate failed:", err.message);
    }
  }

  if (!bytes) throw new Error(`No image for ${key}`);

  writeLibraryJpg(bytes, dest);
  console.log(`  wrote ${dest}`);

  if (fs.existsSync(armatusDir)) {
    const dest2 = path.join(armatusDir, `${key}.jpg`);
    fs.copyFileSync(dest, dest2);
    console.log(`  wrote ${dest2}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const missing = args.includes("--missing");
  const keys = args.filter((a) => !a.startsWith("--"));
  const targets = missing
    ? Object.keys(CATALOG).filter(
        (k) => force || !fs.existsSync(path.join(outDir, `${k}.jpg`)),
      )
    : keys;

  if (!targets.length) {
    console.log(
      "Usage: node --env-file=.env.local scripts/generate-bocetos.mjs --missing",
    );
    console.log("Keys:", Object.keys(CATALOG).join(", "));
    process.exit(targets === keys && !keys.length ? 1 : 0);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    process.exit(1);
  }
  const client = new OpenAI({ apiKey });
  let failed = 0;
  for (const key of targets) {
    try {
      await generateOne(client, key, { force });
    } catch (err) {
      failed += 1;
      console.error(`  FAIL ${key}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(
    failed
      ? `Done with ${failed} failure(s). Matching lives in src/lib/bocetoMatch.ts`
      : "Done. Matching lives in src/lib/bocetoMatch.ts",
  );
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
