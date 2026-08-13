import { NextResponse } from "next/server";
import { generateRoutineFromPrompt } from "@/lib/openai";
import { openaiPublicMessage, openaiRouteStatus } from "@/lib/openaiError";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      prompt?: string;
      coachName?: string;
      locale?: string;
    };
    const prompt = body.prompt?.trim();
    const coachName = body.coachName?.trim() || "";
    const locale = body.locale === "en" ? "en" : "es";

    if (!prompt) {
      return NextResponse.json(
        { error: "El prompt es obligatorio." },
        { status: 400 },
      );
    }

    if (!coachName) {
      return NextResponse.json(
        { error: "El nombre del coach es obligatorio." },
        { status: 400 },
      );
    }

    const routine = await generateRoutineFromPrompt(prompt, coachName, locale);
    return NextResponse.json({ routine });
  } catch (err) {
    const message = openaiPublicMessage(err, "Error al generar la rutina.");
    console.error("[api/generate]", err);
    return NextResponse.json({ error: message }, { status: openaiRouteStatus(err) });
  }
}
