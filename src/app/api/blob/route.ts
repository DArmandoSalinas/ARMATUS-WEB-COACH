import { NextResponse } from "next/server";
import { readBlobStream } from "@/lib/remoteRoutine";

export const maxDuration = 30;

/** Proxy private Blob files so shared routines can render images. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pathname = (searchParams.get("p") || "").trim();
    if (!pathname || pathname.includes("..")) {
      return NextResponse.json({ error: "path inválido" }, { status: 400 });
    }
    if (!pathname.startsWith("routines/")) {
      return NextResponse.json({ error: "path no permitido" }, { status: 403 });
    }

    const blob = await readBlobStream(pathname);
    if (!blob) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("[api/blob]", err);
    return NextResponse.json({ error: "Error de blob" }, { status: 500 });
  }
}
