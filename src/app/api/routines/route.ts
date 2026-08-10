import { NextResponse } from "next/server";
import type { Routine } from "@/lib/types";
import { publishRoutine } from "@/lib/remoteRoutine";

export const maxDuration = 60;

/** Publish a routine so it can be opened on another device via /rutina/[id]. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { routine?: Routine };
    const routine = body.routine;
    if (!routine?.id || !Array.isArray(routine.exercises)) {
      return NextResponse.json(
        { error: "routine inválida." },
        { status: 400 },
      );
    }

    const result = await publishRoutine(routine);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "No se pudo publicar." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: routine.id,
      blobUrl: result.url,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al publicar la rutina.";
    console.error("[api/routines POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
