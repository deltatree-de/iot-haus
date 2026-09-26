import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { THEME_FARBE, THEME_SKRIPT } from "@/ui/themeSkript";
import { tokenCss } from "@/ui/farbtokens";
import { T } from "@/ui/texte";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: T.seite.titel,
  description: T.seite.beschreibung,
  applicationName: "IoT-Haus",
  appleWebApp: { title: "IoT-Haus", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "32x32" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

// Keine Zoom-Sperre (NFR-2); theme-color setzt das Inline-Skript passend zum Theme.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" data-theme="hell" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={THEME_FARBE.hell} />
        <style dangerouslySetInnerHTML={{ __html: tokenCss() }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_SKRIPT }} />
      </head>
      <body className={`${geistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
