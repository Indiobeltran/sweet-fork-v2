import type { MetadataRoute } from "next";

import { buildCanonicalUrl, canonicalSiteUrl } from "@/lib/public-seo";

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  return {
    host: canonicalSiteUrl,
    rules: [
      {
        allow: "/",
        disallow: ["/admin", "/admin/", "/api", "/api/"],
        userAgent: "*",
      },
    ],
    sitemap: buildCanonicalUrl("/sitemap.xml"),
  };
}
