import { NextResponse } from "next/server";
import { fetchRemoteRoutine } from "@/lib/remoteRoutine";

export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

/** Fetch a published routine by id (for other browsers / shared links). */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const routine = await fetchRemoteRoutine(id);
    if (!routine) {
      return NextResponse.json(
        { error: "Rutina no encontrada en el servidor." },
        { status: 404 },
      );
    }
    return NextResponse.json({ routine });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al cargar la rutina.";
    console.error("[api/routines GET]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
