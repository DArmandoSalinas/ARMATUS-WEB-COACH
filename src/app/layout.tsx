import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import { Ambient } from "@/components/Ambient";
import { LocaleSync } from "@/components/LocaleToggle";
import { ThemeSync } from "@/components/ThemeToggle";
import { LOCALE_BOOT_SCRIPT } from "@/lib/i18n";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "ARMATUS Coach Studio",
    template: "%s · ARMATUS",
  },
  description:
    "Studio para coaches: rutinas en español con biomecánica, bocetos ARMATUS y PDF listo para el atleta.",
  applicationName: "ARMATUS Coach Studio",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${barlow.variable} ${outfit.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
      </head>
      <body className="relative min-h-full font-[family-name:var(--font-body)] antialiased">
        <ThemeSync />
        <LocaleSync />
        <Ambient />
        {children}
      </body>
    </html>
  );
}
