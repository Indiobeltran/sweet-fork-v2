import "server-only";

import type { Metadata } from "next";

import { getPublicEnv } from "@/lib/env";
import { getPublicSeoData } from "@/lib/site/marketing";

const socialImageSize = {
  height: 630,
  width: 1200,
} as const;

const routeTitleOverrides: Record<string, string> = {
  "/about": "About The Sweet Fork",
  "/faq": "Sweet Fork FAQ",
  "/gallery": "Cake & Dessert Gallery",
  "/how-to-order": "How To Order",
  "/pricing": "Custom Cake Pricing Guide",
  "/privacy": "Privacy Policy",
  "/terms": "Order Terms & Policies",
};

type SocialImage = {
  alt: string;
  height: number;
  url: string;
  width: number;
};

type PageMetadataInput = {
  description?: string;
  image?: SocialImage;
  path: string;
  title: string;
};

function getCanonicalUrl(path: string, siteUrl: string) {
  return new URL(path, siteUrl).toString();
}

function getResolvedTitle(path: string, title: string) {
  return routeTitleOverrides[path] ?? title;
}

function getSocialImageUrl(path: string, title: string) {
  const searchParams = new URLSearchParams({
    path,
    title,
  });

  return `/og?${searchParams.toString()}`;
}

function buildSocialImage({
  path,
  siteName,
  title,
}: {
  path: string;
  siteName: string;
  title: string;
}): SocialImage {
  return {
    alt: `${title} | ${siteName}`,
    height: socialImageSize.height,
    url: getSocialImageUrl(path, title),
    width: socialImageSize.width,
  };
}

export async function buildRootMetadata(): Promise<Metadata> {
  const { siteUrl } = getPublicEnv();
  const seo = await getPublicSeoData();
  const rootSocialImage = buildSocialImage({
    path: "/",
    siteName: seo.siteName,
    title: seo.siteName,
  });

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
      images: [rootSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.siteName,
      description: seo.defaultDescription,
      images: [rootSocialImage.url],
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
  const resolvedTitle = getResolvedTitle(path, title);
  const resolvedDescription = description ?? seo.defaultDescription;
  const canonicalUrl = getCanonicalUrl(path, siteUrl);
  const resolvedImage =
    image ??
    buildSocialImage({
      path,
      siteName: seo.siteName,
      title: resolvedTitle,
    });

  return {
    metadataBase: new URL(siteUrl),
    title: resolvedTitle,
    category: "food",
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${resolvedTitle} | ${seo.titleSuffix}`,
      description: resolvedDescription,
      url: canonicalUrl,
      type: "website",
      siteName: seo.siteName,
      images: [resolvedImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${resolvedTitle} | ${seo.titleSuffix}`,
      description: resolvedDescription,
      images: [resolvedImage.url],
    },
  };
}
