import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";

import { SoftModeProvider } from "@/components/providers/soft-mode-provider";
import { createRootMetadata } from "@/lib/seo";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = createRootMetadata();

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
