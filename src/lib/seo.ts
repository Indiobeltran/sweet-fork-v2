import "server-only";

import type { Metadata } from "next";

import { getPublicEnv } from "@/lib/env";
import { getPublicSeoData } from "@/lib/site/marketing";

const defaultSocialImage = {
  alt: "The Sweet Fork logo",
  height: 1932,
  url: "/brand/logo-social.jpg",
  width: 3400,
} as const;

type PageMetadataInput = {
  description?: string;
  image?: typeof defaultSocialImage;
  path: string;
  title: string;
};

function getCanonicalUrl(path: string, siteUrl: string) {
  return new URL(path, siteUrl).toString();
}

export async function buildRootMetadata(): Promise<Metadata> {
  const { siteUrl } = getPublicEnv();
  const seo = await getPublicSeoData();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${seo.siteName} | Custom Cakes & Desserts | Centerville, Utah`,
      template: `%s | ${seo.titleSuffix}`,
    },
    description: seo.defaultDescription,
    category: "food",
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: seo.siteName,
      description: seo.defaultDescription,
      siteName: seo.siteName,
      locale: "en_US",
      type: "website",
      url: siteUrl,
      images: [defaultSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.siteName,
      description: seo.defaultDescription,
      images: [defaultSocialImage.url],
    },
    robots: {
      follow: true,
      index: true,
      googleBot: {
        follow: true,
        index: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [{ type: "image/jpeg", url: "/brand/favicon.jpg" }],
      apple: [{ type: "image/jpeg", url: "/brand/favicon.jpg" }],
    },
  };
}

export async function buildMetadata({
  title,
  description,
  image,
  path,
}: PageMetadataInput): Promise<Metadata> {
  const { siteUrl } = getPublicEnv();
  const seo = await getPublicSeoData();
  const resolvedDescription = description ?? seo.defaultDescription;
  const canonicalUrl = getCanonicalUrl(path, siteUrl);
  const resolvedImage = image ?? defaultSocialImage;

  return {
    metadataBase: new URL(siteUrl),
    title,
    category: "food",
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | ${seo.titleSuffix}`,
      description: resolvedDescription,
      url: canonicalUrl,
      type: "website",
      siteName: seo.siteName,
      images: [resolvedImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${seo.titleSuffix}`,
      description: resolvedDescription,
      images: [resolvedImage.url],
    },
  };
}
