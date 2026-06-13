type JsonRecord = Record<string, unknown>;

const percentTokenPattern = /^(?:100(?:\.0+)?|[0-9]{1,2}(?:\.[0-9]+)?)%$/;
const keywordTokenPattern = /^(?:left|center|right|top|bottom)$/;

export const productGalleryCategoryNamesBySlug: Record<string, string[]> = {
  "custom-cakes": ["Custom Cakes"],
  "wedding-cakes": ["Wedding Cakes"],
  cupcakes: ["Cupcakes"],
  "sugar-cookies": ["Sugar Cookies"],
  macarons: ["Macarons"],
  "diy-kits": ["DIY Kits"],
  celebration: ["Custom Cakes"],
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getNumberValue(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toPercentToken(value: number) {
  const normalized = value >= 0 && value <= 1 ? value * 100 : value;
  const clamped = Math.min(100, Math.max(0, normalized));
  return `${Number(clamped.toFixed(2)).toString()}%`;
}

function getSafePositionString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const tokens = value.trim().toLowerCase().replace(/\s+/g, " ").split(" ");

  if (tokens.length < 1 || tokens.length > 2) {
    return null;
  }

  const isSafeToken = (token: string) =>
    keywordTokenPattern.test(token) || percentTokenPattern.test(token);

  return tokens.every(isSafeToken) ? tokens.join(" ") : null;
}

export function getProductGalleryCategoryNames(slug: string) {
  return productGalleryCategoryNamesBySlug[slug] ?? [];
}

export function getNormalizedProductCategoryName(value: string) {
  return value.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

export function getSafeObjectPosition(
  focalPoint: unknown,
  metadata: unknown = null,
) {
  if (isRecord(focalPoint)) {
    const x = getNumberValue(focalPoint, "x");
    const y = getNumberValue(focalPoint, "y");

    if (x !== null && y !== null) {
      return `${toPercentToken(x)} ${toPercentToken(y)}`;
    }
  }

  if (isRecord(metadata)) {
    return getSafePositionString(metadata.objectPosition) ?? "center center";
  }

  return "center center";
}
