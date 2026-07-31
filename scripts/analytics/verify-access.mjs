import {
  createAnalyticsClients,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "./google-client.mjs";

export async function verifyAnalyticsAccess(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const config = await loadGoogleConfig();
  const { admin, data } = createAnalyticsClients();
  const [property] = await admin.getProperty({ name: config.propertyName });
  const [report] = await data.runReport({
    property: config.propertyName,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "eventCount" }],
    limit: 1,
    returnPropertyQuota: true,
  });
  const payload = {
    propertyId: config.propertyId,
    propertyName: property.displayName ?? "(unnamed)",
    adminApi: "ok",
    dataApi: "ok",
    returnedRows: report.rows?.length ?? 0,
  };

  writeOutput({
    json: options.json === true,
    payload,
    lines: [
      "Google Analytics access verified.",
      `Property: ${payload.propertyName} (${payload.propertyId})`,
      "Admin API: OK",
      `Data API: OK (${payload.returnedRows} sample row${payload.returnedRows === 1 ? "" : "s"})`,
    ],
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => verifyAnalyticsAccess());
}
