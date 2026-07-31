import {
  createSearchConsoleClient,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "../analytics/google-client.mjs";
import { isoDate } from "../analytics/report-utils.mjs";

export async function verifySearchConsoleAccess(
  argv = process.argv.slice(2),
) {
  const options = parseArguments(argv);
  const config = await loadGoogleConfig();
  const searchConsole = createSearchConsoleClient();
  const sitesResponse = await searchConsole.sites.list();
  const sites = (sitesResponse.data.siteEntry ?? []).map((site) => ({
    permissionLevel: site.permissionLevel ?? "",
    siteUrl: site.siteUrl ?? "",
  }));
  const configuredSite = sites.find((site) => site.siteUrl === config.siteUrl);

  if (!configuredSite) {
    throw new Error(
      "The configured Search Console property is not accessible to this service account.",
    );
  }

  const queryResponse = await searchConsole.searchanalytics.query({
    siteUrl: config.siteUrl,
    requestBody: {
      startDate: isoDate(10),
      endDate: isoDate(3),
      dimensions: ["date"],
      rowLimit: 1,
      dataState: "final",
    },
  });
  const payload = {
    api: "ok",
    configuredPropertyAccessible: true,
    permissionLevel: configuredSite.permissionLevel,
    propertyCount: sites.length,
    sampleRowCount: queryResponse.data.rows?.length ?? 0,
  };

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      "Search Console access verified.",
      `Configured property: accessible (${payload.permissionLevel})`,
      `Accessible properties: ${payload.propertyCount}`,
      `Search Analytics API: OK (${payload.sampleRowCount} sample row${payload.sampleRowCount === 1 ? "" : "s"})`,
    ],
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => verifySearchConsoleAccess());
}
