"use client";

import { pdf, Font } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { Routine } from "@/lib/types";
import { RoutineDocument } from "./RoutineDocument";

let fontsReady: Promise<boolean> | null = null;

async function toBase64Font(path: string): Promise<string> {
  const res = await fetch(`${window.location.origin}${path}`);
  if (!res.ok) throw new Error(`No se pudo cargar fuente ${path}`);
  const buf = await res.arrayBuffer();
  const head = new TextDecoder().decode(buf.slice(0, 16));
  if (head.includes("<!DOCTYPE") || head.includes("<html")) {
    throw new Error(`Fuente inválida (HTML) en ${path}`);
  }
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // data: URLs are the reliable path for @react-pdf in the browser
  return `data:font/ttf;base64,${btoa(binary)}`;
}

/** Registers custom fonts. Returns false → use Helvetica fallback. */
function ensureFonts(): Promise<boolean> {
  if (fontsReady) return fontsReady;
  fontsReady = (async () => {
    try {
      const [barlowBold, barlowExtra, outfitReg, outfitSemi] =
        await Promise.all([
          toBase64Font("/fonts/BarlowCondensed-Bold.ttf"),
          toBase64Font("/fonts/BarlowCondensed-ExtraBold.ttf"),
          toBase64Font("/fonts/Outfit-Regular.ttf"),
          toBase64Font("/fonts/Outfit-SemiBold.ttf"),
        ]);

      Font.register({
        family: "BarlowCondensed",
        fonts: [
          { src: barlowBold, fontWeight: 700 },
          { src: barlowExtra, fontWeight: 800 },
        ],
      });
      Font.register({
        family: "Outfit",
        fonts: [
          { src: outfitReg, fontWeight: 400 },
          { src: outfitSemi, fontWeight: 600 },
        ],
      });
      return true;
    } catch (err) {
      console.warn("[pdf] Custom fonts unavailable, using Helvetica", err);
      return false;
    }
  })();
  return fontsReady;
}

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "Atleta"
  );
}

async function toDataUrl(src: string): Promise<string | undefined> {
  try {
    if (src.startsWith("data:")) return src;
    const url = src.startsWith("http")
      ? src
      : `${window.location.origin}${src.startsWith("/") ? src : `/${src}`}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || undefined));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function hydrateImages(routine: Routine): Promise<Routine> {
  const exercises = await Promise.all(
    routine.exercises.map(async (ex) => {
      if (!ex.imageDataUrl) return ex;
      const data = await toDataUrl(ex.imageDataUrl);
      return data
        ? { ...ex, imageDataUrl: data }
        : { ...ex, imageDataUrl: undefined };
    }),
  );
  return { ...routine, exercises };
}

async function renderBlob(
  routine: Routine,
  useFallbackFonts: boolean,
): Promise<Blob> {
  const doc = (
    <RoutineDocument routine={routine} useFallbackFonts={useFallbackFonts} />
  ) as unknown as ReactElement<DocumentProps>;
  return pdf(doc).toBlob();
}

/**
 * Professional multi-page PDF (cover + one exercise page each).
 */
export async function downloadRoutinePdf(
  clientName: string,
  routine: Routine,
): Promise<void> {
  const customFontsOk = await ensureFonts();
  const prepared = await hydrateImages(routine);

  let blob: Blob;
  try {
    blob = await renderBlob(prepared, !customFontsOk);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!customFontsOk || !/font/i.test(msg)) throw err;
    console.warn("[pdf] Retrying with Helvetica after font error", err);
    blob = await renderBlob(prepared, true);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ARMATUS-Rutina-${slugify(clientName)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
