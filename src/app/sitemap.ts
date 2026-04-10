import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";
import { getPublicSitemapPaths } from "@/lib/site/marketing";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = getPublicEnv();
  const routes = await getPublicSitemapPaths();
  const lastModified = new Date();

  return routes.map((route) => ({
    changeFrequency:
      route === "/" || route === "/gallery"
        ? "weekly"
        : route === "/pricing" || route === "/start-order"
          ? "monthly"
          : "yearly",
    lastModified,
    priority: route === "/" ? 1 : route === "/start-order" ? 0.9 : 0.8,
    url: new URL(route, siteUrl).toString(),
  }));
}
