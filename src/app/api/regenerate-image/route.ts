import { NextResponse } from "next/server";
import { resolveExerciseBoceto } from "@/lib/boceto";
import { openaiPublicMessage, openaiRouteStatus } from "@/lib/openaiError";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      exerciseName?: string;
      sketchCaption?: string;
      forceAi?: boolean;
      nameEn?: string | null;
      intro?: string;
      purpose?: string;
      muscles?: string[];
      steps?: { title: string; body: string }[];
      commonMistakes?: string[];
      /** Full exercise payload (preferred) */
      exercise?: {
        name?: string;
        nameEn?: string | null;
        sketchCaption?: string;
        intro?: string;
        purpose?: string;
        muscles?: string[];
        steps?: { title: string; body: string }[];
        commonMistakes?: string[];
      };
    };

    const ex = body.exercise;
    const exerciseName = (ex?.name || body.exerciseName || "").trim();
    const sketchCaption =
      (ex?.sketchCaption || body.sketchCaption || "").trim() || "Vista técnica";

    if (!exerciseName) {
      return NextResponse.json(
        { error: "exerciseName es obligatorio." },
        { status: 400 },
      );
    }

    const result = await resolveExerciseBoceto(
      {
        name: exerciseName,
        nameEn: ex?.nameEn ?? body.nameEn,
        sketchCaption,
        intro: ex?.intro ?? body.intro,
        purpose: ex?.purpose ?? body.purpose,
        muscles: ex?.muscles ?? body.muscles,
        steps: ex?.steps ?? body.steps,
        commonMistakes: ex?.commonMistakes ?? body.commonMistakes,
      },
      { forceAi: body.forceAi === true },
    );

    return NextResponse.json({
      imageDataUrl: result.imageDataUrl,
      sketchCaption: result.sketchCaption,
      source: result.source,
    });
  } catch (err) {
    const message = openaiPublicMessage(err, "Error al regenerar el boceto.");
    console.error("[api/regenerate-image]", err);
    return NextResponse.json({ error: message }, { status: openaiRouteStatus(err) });
  }
}
