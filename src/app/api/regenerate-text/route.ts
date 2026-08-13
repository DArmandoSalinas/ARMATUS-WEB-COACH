import { NextResponse } from "next/server";
import { regenerateExerciseText } from "@/lib/openai";
import type { Exercise, Level } from "@/lib/types";
import { openaiPublicMessage, openaiRouteStatus } from "@/lib/openaiError";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      exercise?: Exercise;
      routineContext?: {
        clientName: string;
        objective: string;
        level: Level;
        notes?: string;
      };
    };

    if (!body.exercise || !body.routineContext) {
      return NextResponse.json(
        { error: "Faltan exercise o routineContext." },
        { status: 400 },
      );
    }

    const exercise = await regenerateExerciseText({
      exercise: { ...body.exercise, imageDataUrl: undefined },
      routineContext: body.routineContext,
    });

    return NextResponse.json({ exercise });
  } catch (err) {
    const message = openaiPublicMessage(err, "Error al regenerar el texto.");
    console.error("[api/regenerate-text]", err);
    return NextResponse.json({ error: message }, { status: openaiRouteStatus(err) });
  }
}
