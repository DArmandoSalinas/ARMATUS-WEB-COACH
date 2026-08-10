import { NextResponse } from "next/server";
import { publishExerciseImage } from "@/lib/remoteRoutine";

export const maxDuration = 60;

/** Upload a single exercise image to Blob. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      routineId?: string;
      exerciseId?: string;
      dataUrl?: string;
    };
    const routineId = body.routineId?.trim();
    const exerciseId = body.exerciseId?.trim();
    const dataUrl = body.dataUrl?.trim();
    if (!routineId || !exerciseId || !dataUrl?.startsWith("data:")) {
      return NextResponse.json(
        { error: "routineId, exerciseId y dataUrl son obligatorios." },
        { status: 400 },
      );
    }

    const result = await publishExerciseImage({
      routineId,
      exerciseId,
      dataUrl,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }
    return NextResponse.json({ ok: true, url: result.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al subir imagen.";
    console.error("[api/routines/image]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
