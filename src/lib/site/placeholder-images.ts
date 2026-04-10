import "server-only";

import { access } from "node:fs/promises";
import path from "node:path";

const galleryPlaceholderImageMap = {
  "gal-01": "/placeholders/marketing/wedding-tier.jpg",
  "gal-02": "/placeholders/marketing/garden-cake.jpg",
  "gal-03": "/placeholders/marketing/macaron-tower.jpg",
  "gal-04": "/placeholders/marketing/cookie-favors.jpg",
  "gal-05": "/placeholders/marketing/cupcake-set.jpg",
  "gal-06": "/placeholders/marketing/diy-kit.jpg",
} as const;

export async function resolveGalleryPlaceholderImageUrl(itemId: string) {
  const publicPath = galleryPlaceholderImageMap[itemId as keyof typeof galleryPlaceholderImageMap];

  if (!publicPath) {
    return null;
  }

  try {
    await access(path.join(process.cwd(), "public", publicPath.replace(/^\//, "")));
    return publicPath;
  } catch {
    return null;
  }
}
