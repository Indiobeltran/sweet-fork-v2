import {
  createSearchConsoleClient,
  formatRows,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "../analytics/google-client.mjs";

export async function checkSearchConsoleSitemaps(
  argv = process.argv.slice(2),
) {
  const options = parseArguments(argv);
  const config = await loadGoogleConfig();
  const searchConsole = createSearchConsoleClient();
  const response = await searchConsole.sitemaps.list({
    siteUrl: config.siteUrl,
  });
  const sitemaps = (response.data.sitemap ?? []).map((sitemap) => ({
    path: sitemap.path ?? "",
    isPending: sitemap.isPending ?? false,
    isSitemapsIndex: sitemap.isSitemapsIndex ?? false,
    lastSubmitted: sitemap.lastSubmitted ?? null,
    lastDownloaded: sitemap.lastDownloaded ?? null,
    warnings: Number(sitemap.warnings ?? 0),
    errors: Number(sitemap.errors ?? 0),
  }));
  const payload = {
    sitemapCount: sitemaps.length,
    sitemaps,
    status:
      sitemaps.length === 0
        ? "none-submitted"
        : sitemaps.some(
              (sitemap) =>
                sitemap.errors > 0 ||
                sitemap.warnings > 0 ||
                sitemap.isPending,
            )
          ? "attention"
          : "ok",
  };

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      `Search Console sitemaps: ${payload.status}`,
      ...formatRows(sitemaps, [
        { key: "path", label: "Sitemap" },
        { key: "lastSubmitted", label: "Submitted" },
        { key: "lastDownloaded", label: "Downloaded" },
        { key: "isPending", label: "Pending" },
        { key: "warnings", label: "Warnings" },
        { key: "errors", label: "Errors" },
      ]),
    ],
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => checkSearchConsoleSitemaps());
}
