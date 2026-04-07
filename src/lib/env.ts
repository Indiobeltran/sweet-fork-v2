type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

export type InquiryFeatureFlagEnvOverrides = {
  uploadEnabled?: boolean;
  linkFallbackEnabled?: boolean;
  storageBucket?: string;
};

export function getPublicEnv() {
  const inquiryOverrides = getInquiryFeatureFlagEnvOverrides();

  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
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
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isSupabaseBrowserConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return {
    url,
    anonKey,
  };
}
