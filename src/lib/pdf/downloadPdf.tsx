"use client";

import { pdf, Font } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { Routine } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { RoutineDocument, type PdfVariant } from "./RoutineDocument";

export type { PdfVariant };

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
          { src: outfitSemi, fontWeight: 700 },
          { src: outfitSemi, fontWeight: 800 },
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

const PDF_IMG_MAX_W = 1200;
const PDF_IMG_MAX_H = 800;

function resolveImageSrc(src: string): string | undefined {
  if (src.startsWith("idb:")) return undefined;
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return src;
  }
  return `${window.location.origin}${src.startsWith("/") ? src : `/${src}`}`;
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.src = src;
  });
}

/**
 * Decode in the browser and re-encode a compact JPEG. Huge AI PNGs and
 * odd JPEG encodings make @react-pdf drop later images silently even
 * when the same src already renders on the page.
 */
async function rasterizeForPdf(src: string): Promise<string | undefined> {
  const resolved = resolveImageSrc(src);
  if (!resolved) return undefined;

  let objectUrl: string | undefined;
  try {
    let loadSrc = resolved;
    if (!resolved.startsWith("data:")) {
      const res = await fetch(resolved);
      if (!res.ok) return undefined;
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      loadSrc = objectUrl;
    }

    const img = await loadHtmlImage(loadSrc);
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    if (!nw || !nh) return undefined;

    const scale = Math.min(1, PDF_IMG_MAX_W / nw, PDF_IMG_MAX_H / nh);
    const w = Math.max(1, Math.round(nw * scale));
    const h = Math.max(1, Math.round(nh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return undefined;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

async function hydrateImages(routine: Routine): Promise<Routine> {
  const exercises: Routine["exercises"] = [];
  for (const ex of routine.exercises) {
    if (!ex.imageDataUrl) {
      exercises.push(ex);
      continue;
    }
    const data = await rasterizeForPdf(ex.imageDataUrl);
    exercises.push(
      data ? { ...ex, imageDataUrl: data } : { ...ex, imageDataUrl: undefined },
    );
  }
  return { ...routine, exercises };
}

async function renderBlob(
  routine: Routine,
  useFallbackFonts: boolean,
  variant: PdfVariant,
  locale: Locale,
): Promise<Blob> {
  const doc = (
    <RoutineDocument
      routine={routine}
      useFallbackFonts={useFallbackFonts}
      variant={variant}
      locale={locale}
    />
  ) as unknown as ReactElement<DocumentProps>;
  return pdf(doc).toBlob();
}

/**
 * Multi-page PDF. `clara` uses the same layout as studio, light colors.
 */
export async function downloadRoutinePdf(
  clientName: string,
  routine: Routine,
  variant: PdfVariant = "studio",
  locale: Locale = "es",
): Promise<void> {
  const customFontsOk = await ensureFonts();
  const prepared = await hydrateImages(routine);

  let blob: Blob;
  try {
    blob = await renderBlob(prepared, !customFontsOk, variant, locale);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!customFontsOk || !/font/i.test(msg)) throw err;
    console.warn("[pdf] Retrying with Helvetica after font error", err);
    blob = await renderBlob(prepared, true, variant, locale);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ARMATUS-Rutina-${slugify(clientName)}${variant === "clara" ? "-clara" : ""}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
