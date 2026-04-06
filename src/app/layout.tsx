import "@/app/globals.css";
import { buildRootMetadata } from "@/lib/seo";

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
      <body>{children}</body>
    </html>
  );
}
