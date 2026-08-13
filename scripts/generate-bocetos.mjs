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
  treadmillwalk: {
    refs: "none",
    name: "walking on a treadmill",
    caption:
      "upright walking pace on a treadmill, not sprinting, not running, no text",
  },
  toetouch: {
    refs: "none",
    name: "standing toe-touch hinge",
    caption:
      "ONLY the athlete, no machines, no cables, no bench. Feet together, knees locked straight, hinging at the hips, hands reaching toward the toes. Empty black around him",
  },
  sidekick: {
    refs: "none",
    name: "standing side kick to the SIDE",
    caption:
      "NO cable, NO machine, NO ankle strap. Athlete standing on one leg. The other leg kicks STRAIGHT OUT TO THE SIDE (frontal plane, like a side martial-arts kick), hip height. Torso upright. Not a front kick, not a kickback",
  },
  backkick: {
    refs: "none",
    name: "standing back kick bodyweight",
    caption:
      "NO cable, NO machine, NO ankle strap. Athlete standing upright on one leg, the other leg kicking STRAIGHT BACK behind him (glute). Hands on hips. Not a quadruped donkey kick, not a cable kickback",
  },
  lyingabduction: {
    refs: "none",
    name: "side-lying hip abduction on the floor",
    caption:
      "NO cable, NO machine, NO bench. Athlete lying on the FLOOR on one side, bottom leg stacked, TOP leg lifting up in a half-circle (hip abduction). Head resting on the bottom arm",
  },
  bander: {
    refs: "none",
    name: "standing band EXTERNAL rotation viewed from behind",
    caption:
      "Camera BEHIND the athlete. Right elbow pinned to the ribs at 90 degrees. The right fist points OUT to the right edge of the frame, away from the spine. A thin band goes from that fist further right to an anchor. You can see the back, the triceps, and the rear deltoid. The hand is NOT in front of the belly",
  },
  bandir: {
    refs: "none",
    name: "standing band INTERNAL rotation of the shoulder",
    caption:
      "Standing. Elbow glued to the ribs at 90 degrees. A thin resistance BAND (not a cable tower) coming across the body. Forearm rotating INWARD toward the belly (internal rotation). Not external rotation, not a press",
  },
  machineshoulderpress: {
    refs: "none",
    name: "seated machine shoulder press mid-rep",
    caption:
      "UPRIGHT seated, full back on the pad. MID-REP: elbows bent ~90 degrees, two independent lever handles at EAR height, pressing straight up — NOT locked out overhead, not reclined, not behind the neck, not a row, not cables",
  },
  inclinedbpress: {
    refs: "none",
    name: "incline dumbbell press both arms together",
    caption:
      "lying on an INCLINE bench ~30-45 degrees. TWO dumbbells at the SAME height, both at the upper chest, elbows ~90 degrees, pressing together. Not alternating, not one arm hanging, not flat bench, not a barbell, not a machine",
  },
  bearplank: {
    refs: "none",
    name: "bear plank with knees hovering",
    caption:
      "quadruped TABLE position: hands under shoulders, KNEES BENT 90 degrees under the hips, knees HOVERING a few cm off the floor. Short base, not a long high plank, not straight legs, not a bear crawl",
  },
  legpresscalf: {
    refs: "none",
    name: "calf raise on the leg press sled",
    caption:
      "seated in the 45-degree sled. ONLY the BALLS of the feet on the BOTTOM EDGE of the platform, heels hanging off, ankles extending (toes pointing). Knees almost straight. NOT a full leg press with feet in the center of the plate",
  },
  wallpushup: {
    refs: "none",
    name: "wall half push-up",
    caption:
      "standing, hands on a wall at chest height, body in a straight line, elbows bending as the chest moves toward the wall. Not a floor push-up, not a plank",
  },
  legpress: {
    refs: "none",
    name: "seated leg press",
    caption:
      "seated in a leg-press sled, feet on the platform, knees bent mid-rep pushing the sled away. Not a calf raise, not a hack squat",
  },
  legextension: {
    refs: "none",
    name: "seated leg extension machine",
    caption:
      "seated, pad on the shins, knees extending until the legs are straight. Not a leg press",
  },
};

function promptFor(name, caption) {
  return `ARMATUS Coach Studio premium biomechanics boceto.
=== HARD LOCK ===
SILENT SKETCH: ZERO letters, words, numbers, labels, arrows-with-captions, or legends in the pixels.
A coach asked an image model for ONE silent sketch of: ${name}.
POSE / EQUIPMENT: ${caption}.
Exact equipment only — do not invent a second machine, a cable stack, a bench, or another person unless the pose names them.
UPPER BODY SHIRTLESS (no tank/t-shirt) so working muscles show orange fiber accents; athletic shorts + sneakers only; non-sexual coaching anatomy.
Clean anatomical line art, no fills, no stick figures, no photorealism.
Landscape ~3:2, athlete + named equipment centered, the rest empty black.`;
}

async function loadRefs(kind) {
  if (!kind || kind === "none") return [];
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
