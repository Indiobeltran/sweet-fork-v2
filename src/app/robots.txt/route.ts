import { getPublicEnv } from "@/lib/env";

export function GET() {
  const { siteUrl } = getPublicEnv();
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nHost: ${siteUrl}\nSitemap: ${siteUrl}/sitemap.xml\n`;

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
