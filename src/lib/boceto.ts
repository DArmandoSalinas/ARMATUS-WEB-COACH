import type { Exercise } from "./types";
import {
  resolveBocetoCaption,
  resolveBocetoKey,
  resolveBocetoPath,
} from "./bocetoMatch";
import {
  buildVisualBrief,
  type BocetoPromptContext,
} from "./bocetoBrief";
import {
  characterReferenceDataUrls,
  loadCharacterReferenceFiles,
} from "./bocetoCharacter.server";
import { buildBocetoImagePrompt } from "./prompts";
import OpenAI from "openai";
import {
  isOpenAiCreditsError,
  openaiPublicMessage,
} from "./openaiError";
import {
  classifyLift,
  isPoseSensitiveLift,
  shouldSkipCharacterReferences,
} from "./bocetoFidelity";
import { qaBocetoImage } from "./bocetoQa";

function openaiClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-..." || key === "your-key-here") return null;
  return new OpenAI({ apiKey: key });
}

export type BocetoResolveInput = BocetoPromptContext;

function toPromptContext(input: BocetoResolveInput): BocetoPromptContext {
  return {
    name: input.name.trim(),
    nameEn: input.nameEn,
    sketchCaption: input.sketchCaption?.trim() || "Vista técnica del ejercicio",
    intro: input.intro,
    purpose: input.purpose,
    muscles: input.muscles,
    steps: input.steps,
    commonMistakes: input.commonMistakes,
  };
}

/**
 * Prefer ARMATUS library boceto only on a STRONG name match.
 * Weak/family aliases and unmatched names → AI with rich coaching context
 * + library character references so the same athlete appears.
 */
export async function resolveExerciseBoceto(
  input: BocetoResolveInput | string,
  sketchCaptionOrOpts?: string | { forceAi?: boolean },
  maybeOpts?: { forceAi?: boolean },
): Promise<{
  imageDataUrl: string;
  sketchCaption?: string;
  source: "library" | "ai";
}> {
  const ctx: BocetoPromptContext =
    typeof input === "string"
      ? {
          name: input,
          sketchCaption:
            typeof sketchCaptionOrOpts === "string"
              ? sketchCaptionOrOpts
              : "Vista técnica",
        }
      : toPromptContext(input);

  const opts =
    typeof input === "string"
      ? maybeOpts
      : typeof sketchCaptionOrOpts === "object"
        ? sketchCaptionOrOpts
        : maybeOpts;

  if (!opts?.forceAi) {
    const textCtx = {
      nameEn: ctx.nameEn,
      sketchCaption: ctx.sketchCaption,
      intro: ctx.intro,
      purpose: ctx.purpose,
    };
    const path = resolveBocetoPath(ctx.name, textCtx);
    if (path) {
      const caption = resolveBocetoCaption(ctx.name, textCtx);
      return {
        imageDataUrl: path,
        // Never replace a coach-written caption with a generic library label.
        sketchCaption: ctx.sketchCaption || caption || undefined,
        source: "library",
      };
    }
  }

  const ai = await generateAiBoceto(ctx);
  return { imageDataUrl: ai, source: "ai" };
}

export type AttachBocetosOptions = {
  /**
   * Only resolve strong library matches. Skip AI image generation so API
   * responses stay small (client fills AI bocetos via /api/regenerate-image).
   */
  libraryOnly?: boolean;
};

export async function attachBocetos(
  exercises: Exercise[],
  opts?: AttachBocetosOptions,
): Promise<Exercise[]> {
  return Promise.all(
    exercises.map(async (ex) => {
      const textCtx = {
        nameEn: ex.nameEn,
        sketchCaption: ex.sketchCaption,
        intro: ex.intro,
        purpose: ex.purpose,
      };
      const path = resolveBocetoPath(ex.name, textCtx);
      if (path) {
        const caption = resolveBocetoCaption(ex.name, textCtx);
        return {
          ...ex,
          imageDataUrl: path,
          sketchCaption: ex.sketchCaption || caption || "Vista técnica",
        };
      }

      if (opts?.libraryOnly) {
        return ex;
      }

      try {
        const result = await resolveExerciseBoceto(
          {
            name: ex.name,
            nameEn: ex.nameEn,
            sketchCaption: ex.sketchCaption,
            intro: ex.intro,
            purpose: ex.purpose,
            muscles: ex.muscles,
            steps: ex.steps,
            commonMistakes: ex.commonMistakes,
          },
          { forceAi: true },
        );
        return {
          ...ex,
          imageDataUrl: result.imageDataUrl,
          sketchCaption: result.sketchCaption || ex.sketchCaption,
        };
      } catch (err) {
        console.error("Boceto failed for", ex.name, err);
        return ex;
      }
    }),
  );
}

const BOCETO_SIZE = "1536x1024" as const;
/** High is 4× slower/costlier; medium is enough for neon line art. */
const BOCETO_QUALITY = "medium" as const;
const BOCETO_FORMAT = "jpeg" as const;
const BOCETO_MIME = "image/jpeg";

async function dataUrlFromOpenAiImage(image: {
  b64_json?: string;
  url?: string;
}): Promise<string | undefined> {
  if (image.b64_json) return `data:${BOCETO_MIME};base64,${image.b64_json}`;
  if (!image.url) return undefined;
  const res = await fetch(image.url);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${BOCETO_MIME};base64,${buf.toString("base64")}`;
}

async function generateAiBoceto(ctx: BocetoPromptContext): Promise<string> {
  const client = openaiClient();
  const cls = classifyLift(ctx.name, ctx.nameEn);
  const skipRefs = shouldSkipCharacterReferences(cls);
  const prompt = buildBocetoImagePrompt(ctx);

  let image = await generateBocetoCandidate(ctx, prompt, {
    client,
    allowRefs: !skipRefs,
  });

  if (image && client && isPoseSensitiveLift(cls)) {
    const qa = await qaBocetoImage(client, image, ctx, cls);
    if (qa && qa.match === false) {
      console.warn("[boceto] QA rejected first image", ctx.name, qa);
      const retryPrompt = `${prompt}

PREVIOUS ATTEMPT FAILED: the sketch looked like "${qa.depicted}".
${qa.reason}
Draw the HARD LOCK lift only. Do NOT draw ${qa.depicted}.`;
      const retry = await generateBocetoCandidate(ctx, retryPrompt, {
        client,
        allowRefs: false,
      });
      if (retry) image = retry;
    }
  }

  if (image) return image;

  throw new Error(
    "No hay boceto en librería y falta OPENAI_API_KEY / FAL_KEY (o falló la generación).",
  );
}

async function generateBocetoCandidate(
  ctx: BocetoPromptContext,
  prompt: string,
  opts: { client: OpenAI | null; allowRefs: boolean },
): Promise<string | undefined> {
  const { client, allowRefs } = opts;
  const brief = buildVisualBrief(ctx);

  if (client && allowRefs) {
    try {
      const refs = await loadCharacterReferenceFiles(brief);
      if (refs.length > 0) {
        const edited = await client.images.edit({
          model: "gpt-image-1",
          image: refs,
          prompt: `${prompt}

REFERENCE IMAGES = CHARACTER + ART STYLE ONLY.
Keep THAT exact man (hair, face, body, shorts/sneakers) and white/orange-on-black line art.
Do NOT copy equipment or pose from the references. Locked equipment: ${brief.equipment}
Movement: ${brief.movementPattern}
Body: ${brief.bodyPosition}
Hard forbid: ${brief.forbidEquipment.join(", ") || "wrong implements"}.`,
          size: BOCETO_SIZE,
          quality: BOCETO_QUALITY,
          output_format: BOCETO_FORMAT,
          output_compression: 86,
          input_fidelity: "low",
        });
        const url = edited.data?.[0]
          ? await dataUrlFromOpenAiImage(edited.data[0])
          : undefined;
        if (url) return url;
      }
    } catch (err) {
      if (isOpenAiCreditsError(err)) {
        throw new Error(openaiPublicMessage(err, ""));
      }
      console.warn(
        "[boceto] Character-reference edit failed, trying generate/fal",
        err,
      );
    }
  }

  if (client) {
    try {
      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: BOCETO_SIZE,
        quality: BOCETO_QUALITY,
        output_format: BOCETO_FORMAT,
        output_compression: 86,
      });
      const url = result.data?.[0]
        ? await dataUrlFromOpenAiImage(result.data[0])
        : undefined;
      if (url) return url;
    } catch (err) {
      if (isOpenAiCreditsError(err)) {
        throw new Error(openaiPublicMessage(err, ""));
      }
      console.warn("[boceto] gpt-image generate failed", err);
    }
  }

  const falKey = process.env.FAL_KEY?.trim();
  if (falKey) {
    try {
      return await generateWithFal(falKey, ctx, prompt, allowRefs);
    } catch (err) {
      console.error("[boceto] fal failed", err);
    }
  }

  if (client) {
    try {
      const result = await client.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        quality: "hd",
        n: 1,
      });
      const url = result.data?.[0]?.url;
      const b64 = result.data?.[0]?.b64_json;
      if (b64) return `data:image/png;base64,${b64}`;
      if (url) {
        const res = await fetch(url);
        const buf = Buffer.from(await res.arrayBuffer());
        return `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch (err) {
      if (isOpenAiCreditsError(err)) {
        throw new Error(openaiPublicMessage(err, ""));
      }
      console.error("[boceto] dall-e-3 failed", err);
    }
  }

  return undefined;
}

async function generateWithFal(
  falKey: string,
  ctx: BocetoPromptContext,
  prompt: string,
  allowRefs: boolean,
): Promise<string> {
  const brief = buildVisualBrief(ctx);
  const refs = allowRefs ? characterReferenceDataUrls(brief) : [];
  const fullPrompt = `${prompt}

Reference style + SAME athlete as ARMATUS library bocetos — neon dual-line art, white primary strokes with molten orange (#FF6B35) accents on pure black. Ignore equipment and pose in any reference; use HARD LOCK only.`;

  const endpoint = refs[0]
    ? "https://fal.run/fal-ai/flux/dev/image-to-image"
    : "https://fal.run/fal-ai/flux/dev";

  const body: Record<string, unknown> = {
    prompt: fullPrompt,
    image_size: {
      width: 1536,
      height: 1024,
    },
    num_inference_steps: 28,
    guidance_scale: 3.8,
    enable_safety_checker: true,
    output_format: "png",
  };
  if (refs[0]) {
    body.image_url = refs[0];
    body.strength = 0.42;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    images?: { url?: string }[];
  };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("fal.ai no devolvió imagen");

  const imgRes = await fetch(url);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export function libraryKeyFor(name: string): string | null {
  return resolveBocetoKey(name);
}
