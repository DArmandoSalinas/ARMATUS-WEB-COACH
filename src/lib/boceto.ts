import type { Exercise } from "./types";
import {
  resolveBocetoCaption,
  resolveBocetoKey,
  resolveBocetoPath,
} from "./bocetoMatch";
import type { BocetoPromptContext } from "./bocetoBrief";
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
 * Weak/family aliases and unmatched names → AI with rich coaching context.
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
  // Back-compat: resolveExerciseBoceto(name, caption, opts)
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
    // Pass coaching text so library art is skipped when variation differs
    // (e.g. "remo a una mano" ≠ barbell row JPG).
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

export async function attachBocetos(exercises: Exercise[]): Promise<Exercise[]> {
  const settled = await Promise.allSettled(
    exercises.map(async (ex) => {
      const result = await resolveExerciseBoceto({
        name: ex.name,
        nameEn: ex.nameEn,
        sketchCaption: ex.sketchCaption,
        intro: ex.intro,
        purpose: ex.purpose,
        muscles: ex.muscles,
        steps: ex.steps,
        commonMistakes: ex.commonMistakes,
      });
      return {
        ...ex,
        imageDataUrl: result.imageDataUrl,
        sketchCaption: result.sketchCaption || ex.sketchCaption,
      };
    }),
  );

  return exercises.map((ex, i) => {
    const result = settled[i];
    if (result.status === "fulfilled") return result.value;
    console.error("Boceto failed for", ex.name, result.reason);
    const path = resolveBocetoPath(ex.name, {
      nameEn: ex.nameEn,
      sketchCaption: ex.sketchCaption,
      intro: ex.intro,
      purpose: ex.purpose,
    });
    return path ? { ...ex, imageDataUrl: path } : ex;
  });
}

async function generateAiBoceto(ctx: BocetoPromptContext): Promise<string> {
  const falKey = process.env.FAL_KEY?.trim();
  if (falKey) {
    try {
      return await generateWithFal(falKey, ctx);
    } catch (err) {
      console.error("[boceto] fal failed, falling back to OpenAI", err);
    }
  }

  const client = openaiClient();
  if (!client) {
    throw new Error(
      "No hay boceto en librería y falta OPENAI_API_KEY / FAL_KEY para generar uno.",
    );
  }

  const prompt = buildBocetoImagePrompt(ctx);

  try {
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
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
  } catch {
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
  }

  throw new Error("La generación de boceto no devolvió imagen.");
}

async function generateWithFal(
  falKey: string,
  ctx: BocetoPromptContext,
): Promise<string> {
  const prompt = `${buildBocetoImagePrompt(ctx)}

Reference style: ARMATUS fitness technical sketch — neon dual-line art, white primary strokes with molten orange (#FF6B35) accent lines on pure black, anatomical coaching illustration, no photorealism.`;

  const res = await fetch("https://fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "square_hd",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
      output_format: "png",
    }),
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
