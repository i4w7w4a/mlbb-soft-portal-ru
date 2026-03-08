import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";

import { SoftModeProvider } from "@/components/providers/soft-mode-provider";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOFT Rift",
  description: "Premium MLBB editorial portal centered on hero universes and the SOFT content layer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <SoftModeProvider>
          {children}
        </SoftModeProvider>
      </body>
    </html>
  );
}
