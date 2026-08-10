import type { Exercise } from "./types";
import {
  resolveBocetoCaption,
  resolveBocetoKey,
  resolveBocetoPath,
} from "./bocetoMatch";
import type { BocetoPromptContext } from "./bocetoBrief";
import {
  characterReferenceDataUrls,
  loadCharacterReferenceFiles,
} from "./bocetoCharacter.server";
import { buildBocetoImagePrompt } from "./prompts";
import OpenAI from "openai";

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
        sketchCaption: caption || ctx.sketchCaption,
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
          sketchCaption: caption || ex.sketchCaption,
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

async function generateAiBoceto(ctx: BocetoPromptContext): Promise<string> {
  const client = openaiClient();
  const prompt = buildBocetoImagePrompt(ctx);

  // Prefer OpenAI edit-with-refs (same library athlete). fal is fallback only.
  if (client) {
    try {
      const refs = await loadCharacterReferenceFiles();
      if (refs.length > 0) {
        const edited = await client.images.edit({
          model: "gpt-image-1",
          image: refs,
          prompt: `${prompt}

REFERENCE IMAGES: the attached bocetos are the official ARMATUS athlete in different lifts. Keep THAT exact man (hair, face shape, body, shorts/sneakers style) and the same white/orange-on-black line-art language. Do not invent a new character. EQUIPMENT must match the brief exactly (barbell ≠ dumbbell).`,
          // Landscape matches library bocetos (~3:2) and sketch UI
          size: "1536x1024",
          quality: "high",
          // low = keep identity/style cues but allow a new pose/exercise
          input_fidelity: "low",
        });
        const b64 = edited.data?.[0]?.b64_json;
        if (b64) return `data:image/png;base64,${b64}`;
        const url = edited.data?.[0]?.url;
        if (url) {
          const res = await fetch(url);
          const buf = Buffer.from(await res.arrayBuffer());
          return `data:image/png;base64,${buf.toString("base64")}`;
        }
      }
    } catch (err) {
      console.warn(
        "[boceto] Character-reference edit failed, trying generate/fal",
        err,
      );
    }

    try {
      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1536x1024",
        quality: "high",
      });
      const b64 = result.data?.[0]?.b64_json;
      if (b64) return `data:image/png;base64,${b64}`;
      const url = result.data?.[0]?.url;
      if (url) {
        const res = await fetch(url);
        const buf = Buffer.from(await res.arrayBuffer());
        return `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch (err) {
      console.warn("[boceto] gpt-image generate failed", err);
    }
  }

  const falKey = process.env.FAL_KEY?.trim();
  if (falKey) {
    try {
      return await generateWithFal(falKey, ctx);
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
      console.error("[boceto] dall-e-3 failed", err);
    }
  }

  throw new Error(
    "No hay boceto en librería y falta OPENAI_API_KEY / FAL_KEY (o falló la generación).",
  );
}

async function generateWithFal(
  falKey: string,
  ctx: BocetoPromptContext,
): Promise<string> {
  const refs = characterReferenceDataUrls();
  const prompt = `${buildBocetoImagePrompt(ctx)}

Reference style + SAME athlete as ARMATUS library bocetos — neon dual-line art, white primary strokes with molten orange (#FF6B35) accents on pure black.`;

  // Image-to-image when we have a character anchor; else plain Flux
  const endpoint = refs[0]
    ? "https://fal.run/fal-ai/flux/dev/image-to-image"
    : "https://fal.run/fal-ai/flux/dev";

  const body: Record<string, unknown> = {
    prompt,
    image_size: {
      width: 1536,
      height: 1024,
    },
    num_inference_steps: 36,
    guidance_scale: 3.8,
    enable_safety_checker: true,
    output_format: "png",
  };
  if (refs[0]) {
    body.image_url = refs[0];
    // Keep identity loosely; allow new pose
    body.strength = 0.58;
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
