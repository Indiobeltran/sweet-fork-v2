const routes = [
  "",
  "/custom-cakes",
  "/wedding-cakes",
  "/cupcakes",
  "/sugar-cookies",
  "/macarons",
  "/diy-kits",
  "/gallery",
  "/pricing",
  "/how-to-order",
  "/faq",
  "/about",
  "/start-order",
  "/terms",
  "/privacy",
];

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const updatedAt = new Date().toISOString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    const priority = route === "" ? "1.0" : "0.8";
    const changefreq = route === "" ? "weekly" : "monthly";

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
