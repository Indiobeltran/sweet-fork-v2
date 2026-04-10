import "@/app/globals.css";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { buildRootMetadata } from "@/lib/seo";

const displayFont = Cormorant_Garamond({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

const bodyFont = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-body",
});

export async function generateMetadata() {
  return buildRootMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
