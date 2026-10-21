export const canonicalSiteUrl = "https://thesweetfork.com";
export const bakeryEntityId = `${canonicalSiteUrl}/#bakery`;

export const bakeryServiceArea = [
  { "@type": "City", name: "Centerville, Utah" },
  { "@type": "City", name: "Bountiful, Utah" },
  { "@type": "City", name: "Farmington, Utah" },
  { "@type": "City", name: "Kaysville, Utah" },
  { "@type": "AdministrativeArea", name: "Davis County, Utah" },
  { "@type": "AdministrativeArea", name: "Salt Lake County, Utah" },
  { "@type": "AdministrativeArea", name: "Weber County, Utah" },
  "Northern Utah",
];

export function buildCanonicalUrl(path: string) {
  // A route's canonical origin is independent of preview or local configuration.
  const source = new URL(path, canonicalSiteUrl);
  const canonical = new URL(canonicalSiteUrl);
  // Assign the pathname without parsing it as a relative URL: a leading // in
  // a managed path must not be interpreted as a different host.
  canonical.pathname = source.pathname;
  return canonical.toString();
}

export function buildBrandedTitle(title: string, suffix: string) {
  const suffixParts = suffix.split("|").map((part) => part.trim()).filter(Boolean)
    .filter((part, index, parts) => parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index);
  const parts = title.split("|").map((part) => part.trim()).filter(Boolean);
  if (suffixParts.length === 0) return parts.join(" | ");

  // Remove repeated whole suffixes, or a trailing standalone brand when the
  // suffix also contains a location. Never alter brand words inside prose.
  while (parts.length > 0) {
    const hasFullSuffix = parts.length >= suffixParts.length && suffixParts.every(
      (part, index) => parts[parts.length - suffixParts.length + index]?.toLowerCase() === part.toLowerCase(),
    );
    if (hasFullSuffix) {
      parts.splice(-suffixParts.length);
    } else if (parts.at(-1)?.toLowerCase() === suffixParts[0].toLowerCase()) {
      parts.pop();
    } else {
      break;
    }
  }
  return [...parts, ...suffixParts].join(" | ");
}

type PricingEntry = {
  slug?: string;
  product: string;
  startingAt: string;
};

export function buildBakeryPriceRange(matrix: PricingEntry[]) {
  const pricedEntries = matrix.flatMap((entry) => {
    const match = /^\$([\d,]+(?:\.\d{1,2})?)$/.exec(entry.startingAt.trim());
    const amount = match ? Number(match[1].replaceAll(",", "")) : NaN;
    return Number.isFinite(amount) && amount > 0 ? [{ ...entry, amount }] : [];
  });
  const lowest = pricedEntries.reduce<(typeof pricedEntries)[number] | undefined>(
    (minimum, entry) => !minimum || entry.amount < minimum.amount ? entry : minimum,
    undefined,
  );
  if (!lowest) return undefined;
  const customCakes = pricedEntries.find((entry) =>
    entry.slug === "custom-cakes" || (!entry.slug && entry.product === "Custom Cakes"),
  );
  return `${lowest.startingAt} and up${customCakes ? `; custom cakes from ${customCakes.startingAt}` : ""}`;
}

export function buildBakeryReference(name: string) {
  return {
    "@id": bakeryEntityId,
    "@type": "Bakery",
    name,
    url: canonicalSiteUrl,
  };
}

export function buildBakeryJsonLd({
  site,
  heroImageUrl,
  pricing,
}: {
  site: { name: string; description: string; phone: string; email: string; instagram: string };
  heroImageUrl?: string | null;
  pricing: PricingEntry[];
}) {
  const logo = `${canonicalSiteUrl}/brand/logo-social.jpg`;
  const image = heroImageUrl
    ? [logo, new URL(heroImageUrl, canonicalSiteUrl).toString()]
    : [logo];
  return {
    "@context": "https://schema.org",
    ...buildBakeryReference(site.name),
    description: site.description,
    logo,
    image: [...new Set(image)],
    telephone: site.phone,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Centerville",
      addressRegion: "UT",
    },
    areaServed: bakeryServiceArea,
    hasMenu: buildCanonicalUrl("/pricing"),
    priceRange: buildBakeryPriceRange(pricing),
    sameAs: [`https://www.instagram.com/${site.instagram}/`],
    servesCuisine: "Desserts",
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
