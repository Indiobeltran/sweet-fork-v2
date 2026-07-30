export const MAX_INSPIRATION_LINKS = 6;
export const MAX_INSPIRATION_LINK_LENGTH = 2_048;
export const MAX_INSPIRATION_LINKS_TEXT_LENGTH =
  MAX_INSPIRATION_LINKS * MAX_INSPIRATION_LINK_LENGTH +
  (MAX_INSPIRATION_LINKS - 1);

const explicitHttpProtocolPattern = /^https?:\/\//i;
const protocolPattern = /^[a-z][a-z0-9+.-]*:\/\//i;
const publicDomainPattern =
  /^(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{2,5})?(?:[/?#].*)?$/i;

export function normalizeInspirationLink(value: string) {
  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    explicitHttpProtocolPattern.test(trimmed) ||
    protocolPattern.test(trimmed)
  ) {
    return trimmed;
  }

  return publicDomainPattern.test(trimmed) ? `https://${trimmed}` : trimmed;
}

export function normalizeInspirationLinks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .flatMap((entry) => entry.replace(/\r\n?/g, "\n").split("\n"))
    .map(normalizeInspirationLink)
    .filter(Boolean);
}

export function getInvalidInspirationLinkIndex(links: string[]) {
  return links.findIndex((link) => {
    if (link.length > MAX_INSPIRATION_LINK_LENGTH) {
      return true;
    }

    try {
      const url = new URL(link);
      return url.protocol !== "https:" && url.protocol !== "http:";
    } catch {
      return true;
    }
  });
}
