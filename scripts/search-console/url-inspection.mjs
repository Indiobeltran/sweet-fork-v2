import {
  createSearchConsoleClient,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "../analytics/google-client.mjs";

export function validateInspectionUrl(siteUrl, inspectionUrl) {
  let parsed;
  try {
    parsed = new URL(inspectionUrl);
  } catch {
    throw new Error("--url must be a valid HTTPS URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("--url must use HTTPS.");
  }

  if (siteUrl.startsWith("sc-domain:")) {
    const propertyDomain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = parsed.hostname.toLowerCase();
    if (host !== propertyDomain && !host.endsWith(`.${propertyDomain}`)) {
      throw new Error("--url does not belong to the configured domain property.");
    }
  } else if (!inspectionUrl.startsWith(siteUrl)) {
    throw new Error(
      "--url does not belong to the configured URL-prefix property.",
    );
  }

  return parsed.toString();
}

export async function inspectSearchConsoleUrl(
  argv = process.argv.slice(2),
) {
  const options = parseArguments(argv);
  if (typeof options.url !== "string") {
    throw new Error("--url is required.");
  }

  const config = await loadGoogleConfig();
  const inspectionUrl = validateInspectionUrl(config.siteUrl, options.url);
  const searchConsole = createSearchConsoleClient();
  const response = await searchConsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl,
      siteUrl: config.siteUrl,
    },
  });
  const result = response.data.inspectionResult ?? {};
  const index = result.indexStatusResult ?? {};
  const mobile = result.mobileUsabilityResult ?? {};
  const payload = {
    inspectionUrl,
    inspectionResultLink: result.inspectionResultLink ?? null,
    indexStatus: {
      coverageState: index.coverageState ?? null,
      indexingState: index.indexingState ?? null,
      lastCrawlTime: index.lastCrawlTime ?? null,
      pageFetchState: index.pageFetchState ?? null,
      robotsTxtState: index.robotsTxtState ?? null,
      verdict: index.verdict ?? null,
    },
    mobileUsability: {
      verdict: mobile.verdict ?? null,
      issueCount: mobile.issues?.length ?? 0,
    },
  };

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      `URL inspected: ${payload.inspectionUrl}`,
      `Index verdict: ${payload.indexStatus.verdict ?? "unknown"}`,
      `Coverage: ${payload.indexStatus.coverageState ?? "unknown"}`,
      `Indexing state: ${payload.indexStatus.indexingState ?? "unknown"}`,
      `Page fetch: ${payload.indexStatus.pageFetchState ?? "unknown"}`,
      `Robots.txt: ${payload.indexStatus.robotsTxtState ?? "unknown"}`,
      `Last crawl: ${payload.indexStatus.lastCrawlTime ?? "unknown"}`,
      `Mobile usability: ${payload.mobileUsability.verdict ?? "unknown"} (${payload.mobileUsability.issueCount} issues)`,
    ],
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => inspectSearchConsoleUrl());
}
