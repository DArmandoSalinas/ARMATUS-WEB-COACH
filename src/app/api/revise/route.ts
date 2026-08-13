import { NextResponse } from "next/server";
import { reviseRoutineText } from "@/lib/openai";
import type { Routine } from "@/lib/types";
import { openaiPublicMessage, openaiRouteStatus } from "@/lib/openaiError";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      routine?: Routine;
      changePrompt?: string;
    };

    const changePrompt = body.changePrompt?.trim();
    if (!body.routine) {
      return NextResponse.json(
        { error: "Falta la rutina actual." },
        { status: 400 },
      );
    }
    if (!changePrompt) {
      return NextResponse.json(
        { error: "Escribe qué quieres cambiar." },
        { status: 400 },
      );
    }

    // Text-only revision (no base64 images in / out)
    const lean: Routine = {
      ...body.routine,
      exercises: body.routine.exercises.map((ex) => ({
        ...ex,
        imageDataUrl: undefined,
      })),
    };

    const result = await reviseRoutineText(lean, changePrompt);
    return NextResponse.json({
      routine: result.routine,
      imageRegenIds: result.imageRegenIds,
    });
  } catch (err) {
    const message = openaiPublicMessage(err, "Error al aplicar los cambios.");
    console.error("[api/revise]", err);
    return NextResponse.json({ error: message }, { status: openaiRouteStatus(err) });
  }
}
