const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.thesweetfork.com");

export function GET() {
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
