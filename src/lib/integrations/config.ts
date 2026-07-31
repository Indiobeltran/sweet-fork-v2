import "server-only";

export const integrationProviders = [
  "square",
  "google-calendar",
  "resend",
  "google-maps",
] as const;

export type IntegrationProvider = (typeof integrationProviders)[number];
export type IntegrationMode = "sandbox" | "production";

type Environment = Record<string, string | undefined>;

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function value(environment: Environment, key: string) {
  return environment[key]?.trim() || undefined;
}

function privateKey(environment: Environment, key: string) {
  return value(environment, key)?.replace(/\\n/g, "\n");
}

export function getIntegrationConfig(environment: Environment = process.env) {
  const squareMode: IntegrationMode = value(environment, "SQUARE_ENVIRONMENT") === "production"
    ? "production"
    : "sandbox";

  return {
    googleCalendar: {
      calendarId: value(environment, "GOOGLE_CALENDAR_ID"),
      channelToken: value(environment, "GOOGLE_CALENDAR_CHANNEL_TOKEN"),
      clientEmail: value(environment, "GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      enabled: enabled(environment.GOOGLE_CALENDAR_INTEGRATION_ENABLED),
      privateKey: privateKey(environment, "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"),
      projectId: value(environment, "GOOGLE_SERVICE_ACCOUNT_PROJECT_ID"),
    },
    googleMaps: {
      apiKey: value(environment, "GOOGLE_MAPS_SERVER_API_KEY"),
      bakeryOrigin: value(environment, "BAKERY_PRIVATE_ORIGIN_ADDRESS"),
      enabled: enabled(environment.GOOGLE_MAPS_INTEGRATION_ENABLED),
    },
    resend: {
      apiKey: value(environment, "RESEND_API_KEY"),
      enabled: enabled(environment.RESEND_INTEGRATION_ENABLED),
      fromEmail: value(environment, "RESEND_FROM_EMAIL"),
      reviewUrl: value(environment, "GOOGLE_REVIEW_URL"),
      webhookSecret: value(environment, "RESEND_WEBHOOK_SECRET"),
    },
    square: {
      accessToken: value(environment, "SQUARE_ACCESS_TOKEN"),
      enabled: enabled(environment.SQUARE_INTEGRATION_ENABLED),
      locationId: value(environment, "SQUARE_LOCATION_ID"),
      mode: squareMode,
      webhookNotificationUrl: value(environment, "SQUARE_WEBHOOK_NOTIFICATION_URL"),
      webhookSignatureKey: value(environment, "SQUARE_WEBHOOK_SIGNATURE_KEY"),
    },
  };
}

export function getIntegrationConfigurationStatus(environment: Environment = process.env) {
  const config = getIntegrationConfig(environment);

  return {
    "google-calendar": {
      configured: Boolean(
        config.googleCalendar.calendarId &&
          config.googleCalendar.channelToken &&
          config.googleCalendar.clientEmail &&
          config.googleCalendar.privateKey,
      ),
      enabled: config.googleCalendar.enabled,
      mode: "production" as const,
    },
    "google-maps": {
      configured: Boolean(config.googleMaps.apiKey && config.googleMaps.bakeryOrigin),
      enabled: config.googleMaps.enabled,
      mode: "production" as const,
    },
    resend: {
      configured: Boolean(
        config.resend.apiKey && config.resend.fromEmail && config.resend.webhookSecret,
      ),
      enabled: config.resend.enabled,
      mode: "production" as const,
    },
    square: {
      configured: Boolean(
        config.square.accessToken &&
          config.square.locationId &&
          config.square.webhookNotificationUrl &&
          config.square.webhookSignatureKey,
      ),
      enabled: config.square.enabled,
      mode: config.square.mode,
    },
  } satisfies Record<
    IntegrationProvider,
    { configured: boolean; enabled: boolean; mode: IntegrationMode }
  >;
}
