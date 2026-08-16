import {
  isDirectRun,
  parseArguments,
  runCommand,
  writeOutput,
} from "./google-client.mjs";

const campaignPattern = /^\d{4}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const supportedPlatforms = new Set(["facebook", "instagram"]);
const supportedPlacements = new Set(["bio", "post", "story", "reel"]);
const defaultDestination = "https://thesweetfork.com/";

function requireString(value, optionName) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`--${optionName} is required.`);
  }
  return value;
}

export function buildCampaignLink({
  platform,
  campaign,
  placement,
  destination = defaultDestination,
}) {
  if (!supportedPlatforms.has(platform)) {
    throw new Error("--platform must be facebook or instagram.");
  }
  if (!campaignPattern.test(campaign)) {
    throw new Error(
      "--campaign must use YYYY-MM-lowercase-kebab format, such as 2026-08-wedding-cakes.",
    );
  }
  if (!supportedPlacements.has(placement)) {
    throw new Error("--placement must be bio, post, story, or reel.");
  }

  let url;
  try {
    url = new URL(destination);
  } catch {
    throw new Error("--destination must be a valid HTTPS URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "thesweetfork.com" ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "--destination must use https://thesweetfork.com with no credentials or port.",
    );
  }
  if (url.search || url.hash) {
    throw new Error("--destination cannot already contain a query or fragment.");
  }

  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", placement);

  return {
    url: url.toString(),
    platform,
    campaign,
    placement,
    destination,
  };
}

export function createCampaignLink(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const payload = buildCampaignLink({
    platform: requireString(options.platform, "platform"),
    campaign: requireString(options.campaign, "campaign"),
    placement: requireString(options.placement, "placement"),
    destination:
      options.destination === undefined
        ? defaultDestination
        : requireString(options.destination, "destination"),
  });

  writeOutput({
    json: options.json === true,
    payload,
    lines: [payload.url],
  });
  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => createCampaignLink());
}
