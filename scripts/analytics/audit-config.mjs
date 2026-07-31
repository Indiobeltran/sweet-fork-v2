import {
  createAnalyticsClients,
  formatRows,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "./google-client.mjs";
import { analyticsRowsToObjects } from "./report-utils.mjs";

const desiredParameters = [
  "step_id",
  "step_name",
  "field_id",
  "error_code",
  "form_version",
];

async function getBoundaryDate(data, propertyName, descending) {
  const [report] = await data.runReport({
    property: propertyName,
    dateRanges: [{ startDate: "2020-10-14", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "eventCount" }],
    orderBys: [
      { dimension: { dimensionName: "date" }, desc: descending },
    ],
    limit: 1,
    returnPropertyQuota: true,
  });

  return analyticsRowsToObjects(report)[0] ?? null;
}

export async function auditAnalyticsConfig(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const config = await loadGoogleConfig();
  const { admin, data } = createAnalyticsClients();
  const [property] = await admin.getProperty({ name: config.propertyName });
  const [streams] = await admin.listDataStreams({
    parent: config.propertyName,
  });
  const [keyEvents] = await admin.listKeyEvents({
    parent: config.propertyName,
  });
  const [dimensions] = await admin.listCustomDimensions({
    parent: config.propertyName,
    showArchived: true,
  });
  const [metrics] = await admin.listCustomMetrics({
    parent: config.propertyName,
    showArchived: true,
  });
  const [retention] = await admin.getDataRetentionSettings({
    name: `${config.propertyName}/dataRetentionSettings`,
  });
  const [earliest, latest] = await Promise.all([
    getBoundaryDate(data, config.propertyName, false),
    getBoundaryDate(data, config.propertyName, true),
  ]);
  const dimensionRows = dimensions.map((dimension) => ({
    archived: dimension.archived === true,
    displayName: dimension.displayName ?? "",
    parameterName: dimension.parameterName ?? "",
    scope: dimension.scope ?? "",
  }));
  const duplicateParameters = desiredParameters
    .map((parameterName) => ({
      parameterName,
      count: dimensionRows.filter(
        (dimension) =>
          !dimension.archived && dimension.parameterName === parameterName,
      ).length,
    }))
    .filter(({ count }) => count > 1);
  const generateLeadIsKeyEvent = keyEvents.some(
    (event) => event.eventName === "generate_lead",
  );
  const payload = {
    property: {
      currencyCode: property.currencyCode ?? "",
      displayName: property.displayName ?? "",
      industryCategory: property.industryCategory ?? "",
      name: property.name ?? "",
      propertyId: config.propertyId,
      timeZone: property.timeZone ?? "",
    },
    dataStreams: streams.map((stream) => ({
      defaultUri: stream.webStreamData?.defaultUri ?? null,
      displayName: stream.displayName ?? "",
      measurementId: stream.webStreamData?.measurementId ?? null,
      name: stream.name ?? "",
      type: stream.type ?? "",
    })),
    keyEvents: keyEvents.map((event) => ({
      countingMethod: event.countingMethod ?? "",
      custom: event.custom === true,
      defaultValue: event.defaultValue ?? null,
      defaultValueDisplay: event.defaultValue
        ? `${event.defaultValue.numericValue ?? ""} ${event.defaultValue.currencyCode ?? ""}`.trim()
        : "none",
      deletable: event.deletable === true,
      eventName: event.eventName ?? "",
      name: event.name ?? "",
    })),
    generateLeadIsKeyEvent,
    customDimensions: dimensionRows,
    customMetrics: metrics.map((metric) => ({
      archived: metric.archived === true,
      displayName: metric.displayName ?? "",
      measurementUnit: metric.measurementUnit ?? "",
      parameterName: metric.parameterName ?? "",
      scope: metric.scope ?? "",
    })),
    duplicateParameters,
    dataRetention: {
      eventDataRetention: retention.eventDataRetention ?? "",
      resetUserDataOnNewActivity:
        retention.resetUserDataOnNewActivity === true,
    },
    reportingDateRange: {
      earliest: earliest?.date ?? null,
      latest: latest?.date ?? null,
    },
    searchConsoleLinkState:
      "Not exposed by the Google Analytics Admin API. Verify the link in the GA4 UI; Search Console API access is audited separately.",
  };
  const lines = [
    `GA4 property: ${payload.property.displayName} (${payload.property.name})`,
    `Numeric property ID: ${payload.property.propertyId}`,
    `Industry: ${payload.property.industryCategory}`,
    `Timezone: ${payload.property.timeZone}`,
    `Currency: ${payload.property.currencyCode}`,
    `Reporting data: ${payload.reportingDateRange.earliest ?? "none"} through ${payload.reportingDateRange.latest ?? "none"}`,
    `Data retention: ${payload.dataRetention.eventDataRetention}; reset on activity: ${payload.dataRetention.resetUserDataOnNewActivity}`,
    `generate_lead key event: ${generateLeadIsKeyEvent ? "YES" : "NO"}`,
    "",
    "Data streams",
    ...formatRows(payload.dataStreams, [
      { key: "displayName", label: "Name" },
      { key: "type", label: "Type" },
      { key: "measurementId", label: "Measurement ID" },
      { key: "defaultUri", label: "Default URI" },
    ]),
    "",
    "Key events",
    ...formatRows(payload.keyEvents, [
      { key: "name", label: "Resource" },
      { key: "eventName", label: "Event" },
      { key: "countingMethod", label: "Counting" },
      { key: "custom", label: "Custom" },
      { key: "deletable", label: "Deletable" },
      { key: "defaultValueDisplay", label: "Default value" },
    ]),
    "",
    "Custom dimensions",
    ...formatRows(payload.customDimensions, [
      { key: "displayName", label: "Display name" },
      { key: "parameterName", label: "Parameter" },
      { key: "scope", label: "Scope" },
      { key: "archived", label: "Archived" },
    ]),
    "",
    "Custom metrics",
    ...formatRows(
      payload.customMetrics,
      [
        { key: "displayName", label: "Display name" },
        { key: "parameterName", label: "Parameter" },
        { key: "scope", label: "Scope" },
        { key: "measurementUnit", label: "Unit" },
      ],
      "No custom metrics.",
    ),
    "",
    `Desired-dimension duplicates: ${duplicateParameters.length}`,
    `Search Console link: ${payload.searchConsoleLinkState}`,
  ];

  writeOutput({
    json: options.json === true,
    payload,
    lines,
  });

  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => auditAnalyticsConfig());
}
