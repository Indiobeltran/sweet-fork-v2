import { constants as fsConstants } from "node:fs";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { google } from "googleapis";

const numericPropertyPattern = /^\d+$/;
const cloudProjectPattern = /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/;
const domainPropertyPattern = /^sc-domain:[A-Za-z0-9.-]+$/;
const urlPrefixPropertyPattern = /^https:\/\/[^\s/]+(?:\/.*)?\/$/;

export function validateGoogleIdentifiers(environment) {
  const propertyId = environment.GA4_PROPERTY_ID ?? "";
  const siteUrl = environment.SEARCH_CONSOLE_SITE_URL ?? "";
  const projectId = environment.GOOGLE_CLOUD_PROJECT_ID ?? "";

  if (!numericPropertyPattern.test(propertyId)) {
    throw new Error("GA4_PROPERTY_ID must contain digits only.");
  }

  if (
    !domainPropertyPattern.test(siteUrl) &&
    !urlPrefixPropertyPattern.test(siteUrl)
  ) {
    throw new Error(
      "SEARCH_CONSOLE_SITE_URL must be an sc-domain property or an HTTPS URL-prefix property ending in a slash.",
    );
  }

  if (!cloudProjectPattern.test(projectId)) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID is not a valid project identifier.");
  }

  return {
    projectId,
    propertyId,
    propertyName: `properties/${propertyId}`,
    siteUrl,
  };
}

export async function loadGoogleConfig(environment = process.env) {
  const credentialPath = environment.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialPath) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS is required. Load the local analytics environment first.",
    );
  }

  try {
    await access(credentialPath, fsConstants.R_OK);
  } catch {
    throw new Error(
      "The configured Google credential file does not exist or is not readable.",
    );
  }

  return {
    ...validateGoogleIdentifiers(environment),
    credentialPath,
  };
}

export function createAnalyticsClients() {
  return {
    admin: new AnalyticsAdminServiceClient(),
    data: new BetaAnalyticsDataClient(),
  };
}

export function createSearchConsoleClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  return google.searchconsole({ version: "v1", auth });
}

export function parseArguments(argv = process.argv.slice(2)) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const [rawKey, inlineValue] = argument.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );

    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }

  return options;
}

export function getIntegerOption(options, key, fallback, bounds = {}) {
  const rawValue = options[key];
  if (rawValue === undefined) return fallback;

  const value = Number.parseInt(String(rawValue), 10);
  const minimum = bounds.minimum ?? 1;
  const maximum = bounds.maximum ?? Number.MAX_SAFE_INTEGER;

  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} must be an integer from ${minimum} to ${maximum}.`,
    );
  }

  return value;
}

export function writeOutput({ json = false, payload, lines }) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(lines.join("\n"));
}

export function formatRows(rows, columns, emptyMessage = "No rows returned.") {
  if (rows.length === 0) return [emptyMessage];

  const header = columns.map((column) => column.label).join(" | ");
  const separator = columns.map(() => "---").join(" | ");
  const output = [header, separator];

  for (const row of rows) {
    output.push(
      columns
        .map((column) => String(row[column.key] ?? "").replace(/\s+/g, " "))
        .join(" | "),
    );
  }

  return output;
}

export function sanitizeGoogleError(error) {
  const code = error?.code ?? error?.response?.status ?? "unknown";
  let message =
    typeof error?.message === "string"
      ? error.message
      : "Unknown Google API error.";

  message = message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(
      /-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g,
      "[redacted credential material]",
    )
    .replace(
      /"(?:private[_-]?key|access[_-]?token)"\s*:\s*"[^"]*"/gi,
      '"credential":"[redacted]"',
    );

  if (process.env.HOME) {
    message = message.split(process.env.HOME).join("$HOME");
  }

  return `Google API operation failed (${code}): ${message.slice(0, 600)}`;
}

export async function runCommand(command) {
  try {
    await command();
  } catch (error) {
    console.error(sanitizeGoogleError(error));
    process.exitCode = 1;
  }
}

export function isDirectRun(moduleUrl) {
  return process.argv[1] === fileURLToPath(moduleUrl);
}
