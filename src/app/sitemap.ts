import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";
import { getPublicSitemapPaths } from "@/lib/site/marketing";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = getPublicEnv();
  const routes = await getPublicSitemapPaths();
  // Public content does not yet expose a reliable per-route modification date.
  // Omit lastModified instead of reporting cache regeneration as a content edit.

  return routes.map((route) => ({
    changeFrequency:
      route === "/" || route === "/gallery"
        ? "weekly"
        : route === "/pricing" || route === "/start-order"
          ? "monthly"
          : "yearly",
    priority: route === "/" ? 1 : route === "/start-order" ? 0.9 : 0.8,
    url: new URL(route, siteUrl).toString(),
  }));
}
