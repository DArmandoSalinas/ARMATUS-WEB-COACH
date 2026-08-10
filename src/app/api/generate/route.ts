import { NextResponse } from "next/server";
import { generateRoutineFromPrompt } from "@/lib/openai";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: string; coachName?: string };
    const prompt = body.prompt?.trim();
    const coachName = body.coachName?.trim() || "";

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

    const routine = await generateRoutineFromPrompt(prompt, coachName);
    return NextResponse.json({ routine });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar la rutina.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 502;
    console.error("[api/generate]", err);
    return NextResponse.json({ error: message }, { status });
  }
}
