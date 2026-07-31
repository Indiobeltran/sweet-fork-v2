import "server-only";

import { randomUUID, sign } from "node:crypto";

import { getIntegrationConfig } from "@/lib/integrations/config";

const calendarScope = "https://www.googleapis.com/auth/calendar";
const tokenEndpoint = "https://oauth2.googleapis.com/token";

export class GoogleCalendarIntegrationError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(
    code: string,
    status?: number,
  ) {
    super("Google Calendar could not complete the request.");
    this.code = code;
    this.status = status;
  }
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function getAccessToken() {
  const config = getIntegrationConfig().googleCalendar;
  if (!config.enabled || !config.clientEmail || !config.privateKey || !config.calendarId) {
    throw new GoogleCalendarIntegrationError("google-calendar-disabled");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    aud: tokenEndpoint,
    exp: issuedAt + 3600,
    iat: issuedAt,
    iss: config.clientEmail,
    scope: calendarScope,
  })}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsigned), config.privateKey).toString("base64url");
  const assertion = `${unsigned}.${signature}`;
  const response = await fetch(tokenEndpoint, {
    body: new URLSearchParams({
      assertion,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new GoogleCalendarIntegrationError(`google-token-${response.status}`, response.status);
  }
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new GoogleCalendarIntegrationError("google-token-missing");
  return payload.access_token;
}

export async function googleCalendarRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new GoogleCalendarIntegrationError(`google-calendar-${response.status}`, response.status);
  }

  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export type GoogleCalendarEvent = {
  description?: string;
  end?: { date?: string; dateTime?: string; timeZone?: string };
  etag?: string;
  extendedProperties?: { private?: Record<string, string> };
  id: string;
  location?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  status?: string;
  summary?: string;
  updated?: string;
};

export type GoogleCalendarEventInput = Omit<GoogleCalendarEvent, "id" | "status" | "updated">;

export async function listGoogleCalendarEvents(syncToken?: string | null) {
  const config = getIntegrationConfig().googleCalendar;
  if (!config.calendarId) throw new GoogleCalendarIntegrationError("google-calendar-id-missing");
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    const params = new URLSearchParams({
      maxResults: "250",
      showDeleted: "true",
      singleEvents: "true",
    });
    if (syncToken) {
      params.set("syncToken", syncToken);
    } else {
      params.set("timeMin", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());
    }
    if (pageToken) params.set("pageToken", pageToken);

    const payload = await googleCalendarRequest<{
      items?: GoogleCalendarEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    }>(`/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events?${params}`);
    events.push(...(payload.items ?? []));
    pageToken = payload.nextPageToken;
    nextSyncToken = payload.nextSyncToken ?? nextSyncToken;
  } while (pageToken);

  return { events, nextSyncToken };
}

export async function createGoogleCalendarEvent(event: GoogleCalendarEventInput) {
  const config = getIntegrationConfig().googleCalendar;
  if (!config.calendarId) throw new GoogleCalendarIntegrationError("google-calendar-id-missing");
  return googleCalendarRequest<GoogleCalendarEvent>(
    `/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events`,
    { body: JSON.stringify(event), method: "POST" },
  );
}

export async function updateGoogleCalendarEvent(eventId: string, event: GoogleCalendarEventInput) {
  const config = getIntegrationConfig().googleCalendar;
  if (!config.calendarId) throw new GoogleCalendarIntegrationError("google-calendar-id-missing");
  return googleCalendarRequest<GoogleCalendarEvent>(
    `/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(eventId)}`,
    { body: JSON.stringify(event), method: "PUT" },
  );
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const config = getIntegrationConfig().googleCalendar;
  if (!config.calendarId) throw new GoogleCalendarIntegrationError("google-calendar-id-missing");
  return googleCalendarRequest<void>(
    `/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
}

export async function createGoogleCalendarWatch(address: string) {
  const config = getIntegrationConfig().googleCalendar;
  if (!config.calendarId || !config.channelToken) {
    throw new GoogleCalendarIntegrationError("google-watch-config-missing");
  }
  return googleCalendarRequest<{
    expiration?: string;
    id: string;
    resourceId: string;
  }>(`/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events/watch`, {
    body: JSON.stringify({
      address,
      id: randomUUID(),
      token: config.channelToken,
      type: "web_hook",
    }),
    method: "POST",
  });
}
