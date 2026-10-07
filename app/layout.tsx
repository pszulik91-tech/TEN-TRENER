import { AboutProject } from "./about-project";
import { ThemeStudio } from "./theme-studio";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./themes.css";
import "./onboarding.css";
import "./release.css";

export const metadata: Metadata = {
  title: "TEN TRENER — kariera polskiego trenera",
  description: "Realistyczny przeglądarkowy symulator kariery trenera w polskiej piłce.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e9eced",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">{children}<ThemeStudio /><AboutProject /></body>
    </html>
  );
}
