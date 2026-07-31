declare const Netlify:
  | {
      env: {
        get(key: string): string | undefined;
      };
    }
  | undefined;

const runtimeKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SQUARE_INTEGRATION_ENABLED",
  "SQUARE_ENVIRONMENT",
  "SQUARE_ACCESS_TOKEN",
  "SQUARE_LOCATION_ID",
  "SQUARE_WEBHOOK_NOTIFICATION_URL",
  "SQUARE_WEBHOOK_SIGNATURE_KEY",
  "GOOGLE_CALENDAR_INTEGRATION_ENABLED",
  "GOOGLE_CALENDAR_ID",
  "GOOGLE_CALENDAR_CHANNEL_TOKEN",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GOOGLE_SERVICE_ACCOUNT_PROJECT_ID",
  "RESEND_INTEGRATION_ENABLED",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_WEBHOOK_SECRET",
  "GOOGLE_REVIEW_URL",
  "GOOGLE_MAPS_INTEGRATION_ENABLED",
  "GOOGLE_MAPS_SERVER_API_KEY",
  "BAKERY_PRIVATE_ORIGIN_ADDRESS",
] as const;

export function hydrateNetlifyEnvironment() {
  if (typeof Netlify === "undefined") return;

  runtimeKeys.forEach((key) => {
    const value = Netlify.env.get(key);
    if (value && !process.env[key]) process.env[key] = value;
  });
}
