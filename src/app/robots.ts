import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  const { siteUrl } = getPublicEnv();

  return {
    host: siteUrl,
    rules: [
      {
        allow: "/",
        disallow: ["/admin", "/api/"],
        userAgent: "*",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
