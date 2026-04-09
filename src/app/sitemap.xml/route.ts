import { getPublicSitemapPaths } from "@/lib/site/marketing";

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://www.thesweetfork.com");
  const updatedAt = new Date().toISOString();
  const routes = await getPublicSitemapPaths();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    const priority = route === "/" ? "1.0" : "0.8";
    const changefreq = route === "/" ? "weekly" : "monthly";

    return `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
