type SupabaseEnv = {
  url: string;
  publicKey: string;
  adminKey: string;
};

type PublicSupabaseEnv = {
  url: string;
  publicKey: string;
};

type KeySource = "publishable" | "anon" | "secret" | "service_role" | "missing";

const productionSiteUrl = "https://www.thesweetfork.com";

function getDefaultSiteUrl() {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : productionSiteUrl;
}

function resolveSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredSiteUrl) {
    return getDefaultSiteUrl();
  }

  if (
    process.env.NODE_ENV === "production" &&
    (configuredSiteUrl.includes("localhost") || configuredSiteUrl.includes(".vercel.app"))
  ) {
    return productionSiteUrl;
  }

  return configuredSiteUrl;
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

function getPublicSupabaseKey() {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return {
    key: firstNonEmpty(publishableKey, anonKey),
    source: publishableKey ? "publishable" : anonKey ? "anon" : "missing",
  } satisfies { key?: string; source: KeySource };
}

function getAdminSupabaseKey() {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return {
    key: firstNonEmpty(secretKey, serviceRoleKey),
    source: secretKey ? "secret" : serviceRoleKey ? "service_role" : "missing",
  } satisfies { key?: string; source: KeySource };
}

export type InquiryFeatureFlagEnvOverrides = {
  uploadEnabled?: boolean;
  linkFallbackEnabled?: boolean;
  storageBucket?: string;
};

export function getPublicEnv() {
  const inquiryOverrides = getInquiryFeatureFlagEnvOverrides();

  return {
    siteUrl: resolveSiteUrl(),
    uploadEnabled: inquiryOverrides.uploadEnabled ?? true,
    linkFallbackEnabled: inquiryOverrides.linkFallbackEnabled ?? true,
    storageBucket: inquiryOverrides.storageBucket || "inspiration",
  };
}

export function getInquiryFeatureFlagEnvOverrides(): InquiryFeatureFlagEnvOverrides {
  return {
    uploadEnabled:
      typeof process.env.INQUIRY_UPLOAD_ENABLED === "string"
        ? process.env.INQUIRY_UPLOAD_ENABLED !== "false"
        : undefined,
    linkFallbackEnabled:
      typeof process.env.INQUIRY_LINK_FALLBACK_ENABLED === "string"
        ? process.env.INQUIRY_LINK_FALLBACK_ENABLED !== "false"
        : undefined,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || undefined,
  };
}

export function isSupabaseConfigured() {
  const publicKey = getPublicSupabaseKey();
  const adminKey = getAdminSupabaseKey();

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      publicKey.key &&
      adminKey.key,
  );
}

export function isSupabaseBrowserConfigured() {
  const publicKey = getPublicSupabaseKey();

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && publicKey.key,
  );
}

export function getSupabaseKeyStatus() {
  const publicKey = getPublicSupabaseKey();
  const adminKey = getAdminSupabaseKey();

  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    publicKeySource: publicKey.source,
    adminKeySource: adminKey.source,
  };
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = getPublicSupabaseKey();
  const adminKey = getAdminSupabaseKey();

  if (!url || !publicKey.key || !adminKey.key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return {
    url,
    publicKey: publicKey.key,
    adminKey: adminKey.key,
  };
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = getPublicSupabaseKey();

  if (!url || !publicKey.key) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return {
    url,
    publicKey: publicKey.key,
  };
}
