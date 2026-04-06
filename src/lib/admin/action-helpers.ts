import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { publicSitePaths } from "@/lib/site/marketing";

export function redirectWithNotice(path: string, notice: string): never {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("notice", notice);

  redirect(`${url.pathname}${url.search}`);
}

export function getSafeRedirectTarget(
  value: FormDataEntryValue | null,
  allowedPrefix: string,
  fallbackPath: string,
) {
  if (typeof value === "string" && value.startsWith(allowedPrefix)) {
    return value;
  }

  return fallbackPath;
}

export function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseRequiredString(value: FormDataEntryValue | null) {
  return parseOptionalString(value) ?? "";
}

export function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

export function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(/[$,\s]/g, "");

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseStringList(values: FormDataEntryValue[]) {
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function revalidatePaths(paths: string[]) {
  paths.forEach((path) => {
    revalidatePath(path);
  });
}

export function revalidateMarketingSite(paths: string[] = publicSitePaths) {
  revalidatePaths(paths);
}
