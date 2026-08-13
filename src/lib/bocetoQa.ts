import type OpenAI from "openai";
import type { BocetoPromptContext } from "./bocetoBrief";
import {
  classifyLift,
  isPoseSensitiveLift,
  qaSpecForLift,
  type LiftClass,
} from "./bocetoFidelity";

export type BocetoQaResult = {
  match: boolean;
  depicted: string;
  reason: string;
};

function parseQaJson(raw: string): BocetoQaResult | null {
  try {
    const data = JSON.parse(raw) as Partial<BocetoQaResult>;
    if (typeof data.match !== "boolean") return null;
    return {
      match: data.match,
      depicted: String(data.depicted || "").slice(0, 200),
      reason: String(data.reason || "").slice(0, 240),
    };
  } catch {
    return null;
  }
}

/**
 * Vision check: reject a generated boceto that depicts the wrong lift
 * (press drawn as a row, etc.). Fail-open if the QA call itself errors.
 */
export async function qaBocetoImage(
  client: OpenAI,
  imageDataUrl: string,
  ctx: BocetoPromptContext,
  cls?: LiftClass,
): Promise<BocetoQaResult | null> {
  const lift = cls || classifyLift(ctx.name, ctx.nameEn);
  if (!isPoseSensitiveLift(lift)) return { match: true, depicted: "", reason: "unclassified" };

  const title = ctx.nameEn ? `${ctx.name} (${ctx.nameEn})` : ctx.name;
  const spec = qaSpecForLift(lift, title);

  try {
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 180,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a strict strength-coach image QA for a silent technical sketch.
Reply JSON only: {"match":boolean,"depicted":"what the image actually shows","reason":"one sentence"}.
match=false if FAIL IF applies.
match=false if there is ANY text, letters, labels, titles, captions, or gibberish in the image.
match=false if a shoulder-press machine is drawn reclined, behind-the-neck, or as a row.
When unsure between press vs row, match=false.
When unsure between bear plank vs high plank, match=false.
When unsure between side kick vs front kick, match=false.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `TITLE: ${title}
MUST SHOW: ${spec.mustShow}
MUST NOT SHOW: ${spec.mustNotShow}
FAIL IF: ${spec.failIf}`,
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
    });
    const raw = result.choices[0]?.message?.content || "";
    return parseQaJson(raw);
  } catch (err) {
    console.warn("[boceto] vision QA failed (fail-open)", err);
    return null;
  }
}
