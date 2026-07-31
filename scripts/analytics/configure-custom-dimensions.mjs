import {
  createAnalyticsClients,
  formatRows,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "./google-client.mjs";

export const desiredPropertyState = {
  displayName: "The Sweet Fork",
  timeZone: "America/Denver",
};

export const desiredKeyEvent = {
  eventName: "generate_lead",
  countingMethod: "ONCE_PER_EVENT",
};

export const requiredExistingKeyEvents = [
  "purchase",
  "qualify_lead",
  "close_convert_lead",
];

export const desiredCustomDimensions = [
  {
    displayName: "Inquiry Step",
    parameterName: "step_id",
    description: "Stable machine-readable inquiry wizard step identifier.",
  },
  {
    displayName: "Inquiry Step Name",
    parameterName: "step_name",
    description: "Stable human-readable inquiry wizard step name.",
  },
  {
    displayName: "Inquiry Field",
    parameterName: "field_id",
    description: "Stable inquiry field identifier used by validation diagnostics.",
  },
  {
    displayName: "Validation Error",
    parameterName: "error_code",
    description: "Stable privacy-safe inquiry validation error code.",
  },
  {
    displayName: "Form Version",
    parameterName: "form_version",
    description: "Version identifier for the inquiry analytics contract.",
  },
];

export function planCustomDimensions(existingDimensions) {
  return desiredCustomDimensions.map((desired) => {
    const matches = existingDimensions.filter(
      (dimension) =>
        dimension.parameterName === desired.parameterName &&
        dimension.archived !== true,
    );
    const archivedMatches = existingDimensions.filter(
      (dimension) =>
        dimension.parameterName === desired.parameterName &&
        dimension.archived === true,
    );

    if (matches.length > 1) {
      return { ...desired, status: "duplicate", existing: matches };
    }

    if (matches.length === 1) {
      const existing = matches[0];
      if (existing.scope !== "EVENT") {
        return { ...desired, status: "scope_mismatch", existing: matches };
      }
      if (existing.displayName !== desired.displayName) {
        return {
          ...desired,
          status: "display_name_mismatch",
          existing: matches,
        };
      }
      return { ...desired, status: "already_present", existing: matches };
    }

    if (archivedMatches.length > 0) {
      return {
        ...desired,
        status: "archived_conflict",
        existing: archivedMatches,
      };
    }

    return { ...desired, status: "create", existing: [] };
  });
}

export function planKeyEvent(existingKeyEvents) {
  const matches = existingKeyEvents.filter(
    (keyEvent) => keyEvent.eventName === desiredKeyEvent.eventName,
  );

  if (matches.length > 1) {
    return { ...desiredKeyEvent, status: "duplicate", existing: matches };
  }
  if (matches.length === 0) {
    return { ...desiredKeyEvent, status: "create", existing: [] };
  }

  const existing = matches[0];
  if (existing.countingMethod !== desiredKeyEvent.countingMethod) {
    return {
      ...desiredKeyEvent,
      status: "counting_method_mismatch",
      existing: matches,
    };
  }
  if (existing.defaultValue != null) {
    return {
      ...desiredKeyEvent,
      status: "default_value_mismatch",
      existing: matches,
    };
  }

  return { ...desiredKeyEvent, status: "already_present", existing: matches };
}

export function planProperty(property) {
  return {
    currentTimeZone: property.timeZone ?? "",
    desiredTimeZone: desiredPropertyState.timeZone,
    status:
      property.timeZone === desiredPropertyState.timeZone
        ? "already_present"
        : "update",
  };
}

function assertSweetForkProperty(property, config) {
  if (
    property.name !== config.propertyName ||
    property.displayName !== desiredPropertyState.displayName
  ) {
    throw new Error(
      "The configured GA4 resource does not unambiguously match The Sweet Fork property. No configuration was changed.",
    );
  }
}

function snapshotProtectedPropertyFields(property) {
  return {
    account: property.account ?? "",
    currencyCode: property.currencyCode ?? "",
    displayName: property.displayName ?? "",
    industryCategory: property.industryCategory ?? "",
    name: property.name ?? "",
    parent: property.parent ?? "",
    propertyType: property.propertyType ?? "",
    serviceLevel: property.serviceLevel ?? "",
  };
}

function snapshotKeyEvent(keyEvent) {
  return {
    countingMethod: keyEvent.countingMethod ?? "",
    custom: keyEvent.custom === true,
    defaultValue: keyEvent.defaultValue ?? null,
    deletable: keyEvent.deletable === true,
    eventName: keyEvent.eventName ?? "",
    name: keyEvent.name ?? "",
  };
}

function snapshotCustomDimension(dimension) {
  return {
    archived: dimension.archived === true,
    description: dimension.description ?? "",
    displayName: dimension.displayName ?? "",
    name: dimension.name ?? "",
    parameterName: dimension.parameterName ?? "",
    scope: dimension.scope ?? "",
  };
}

function snapshotCustomMetric(metric) {
  return {
    archived: metric.archived === true,
    description: metric.description ?? "",
    displayName: metric.displayName ?? "",
    measurementUnit: metric.measurementUnit ?? "",
    name: metric.name ?? "",
    parameterName: metric.parameterName ?? "",
    scope: metric.scope ?? "",
  };
}

function snapshotDataStream(stream) {
  return {
    defaultUri: stream.webStreamData?.defaultUri ?? "",
    displayName: stream.displayName ?? "",
    firebaseAppId: stream.firebaseAppId ?? "",
    measurementId: stream.webStreamData?.measurementId ?? "",
    name: stream.name ?? "",
    type: stream.type ?? "",
  };
}

function sortByName(items) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function describeChange(change) {
  if (change.type === "property_timezone") {
    return `Set property timezone from ${change.from} to ${change.to}`;
  }
  if (change.type === "key_event") {
    return `Create key event ${change.eventName} with ${change.countingMethod}`;
  }
  if (change.type === "custom_dimension") {
    return `Create Event-scope custom dimension ${change.parameterName}`;
  }
  return change.type;
}

async function readState(admin, config) {
  const [
    [property],
    [keyEvents],
    [dimensions],
    [metrics],
    [streams],
    [retention],
  ] = await Promise.all([
    admin.getProperty({ name: config.propertyName }),
    admin.listKeyEvents({ parent: config.propertyName }),
    admin.listCustomDimensions({
      parent: config.propertyName,
      showArchived: true,
    }),
    admin.listCustomMetrics({
      parent: config.propertyName,
      showArchived: true,
    }),
    admin.listDataStreams({ parent: config.propertyName }),
    admin.getDataRetentionSettings({
      name: `${config.propertyName}/dataRetentionSettings`,
    }),
  ]);

  assertSweetForkProperty(property, config);
  return { property, keyEvents, dimensions, metrics, streams, retention };
}

function createPlan(state) {
  return {
    property: planProperty(state.property),
    keyEvent: planKeyEvent(state.keyEvents),
    dimensions: planCustomDimensions(state.dimensions),
  };
}

function getBlockingConflicts(plan) {
  const blockingStatuses = new Set([
    "archived_conflict",
    "counting_method_mismatch",
    "default_value_mismatch",
    "duplicate",
    "scope_mismatch",
  ]);
  const conflicts = [];

  if (blockingStatuses.has(plan.keyEvent.status)) {
    conflicts.push(`generate_lead:${plan.keyEvent.status}`);
  }
  for (const dimension of plan.dimensions) {
    if (blockingStatuses.has(dimension.status)) {
      conflicts.push(`${dimension.parameterName}:${dimension.status}`);
    }
  }

  return conflicts;
}

function verifyRequiredExistingKeyEvents(keyEvents) {
  return requiredExistingKeyEvents.filter(
    (eventName) =>
      keyEvents.filter((keyEvent) => keyEvent.eventName === eventName).length !==
      1,
  );
}

export async function configureAnalytics(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const apply = options.apply === true;
  const config = await loadGoogleConfig();
  const { admin } = createAnalyticsClients();
  const before = await readState(admin, config);
  const beforePlan = createPlan(before);
  const conflicts = getBlockingConflicts(beforePlan);
  const missingRequiredBefore = verifyRequiredExistingKeyEvents(
    before.keyEvents,
  );

  if (missingRequiredBefore.length > 0) {
    throw new Error(
      `Required existing key event state is unexpected for: ${missingRequiredBefore.join(", ")}. No configuration was changed.`,
    );
  }
  if (apply && conflicts.length > 0) {
    throw new Error(
      `Configuration is blocked by conflict(s): ${conflicts.join(", ")}. No configuration was changed.`,
    );
  }

  const changesProposed = [
    ...(beforePlan.property.status === "update"
      ? [
          {
            type: "property_timezone",
            from: beforePlan.property.currentTimeZone,
            to: beforePlan.property.desiredTimeZone,
          },
        ]
      : []),
    ...(beforePlan.keyEvent.status === "create"
      ? [
          {
            type: "key_event",
            eventName: desiredKeyEvent.eventName,
            countingMethod: desiredKeyEvent.countingMethod,
          },
        ]
      : []),
    ...beforePlan.dimensions
      .filter((dimension) => dimension.status === "create")
      .map((dimension) => ({
        type: "custom_dimension",
        displayName: dimension.displayName,
        parameterName: dimension.parameterName,
        scope: "EVENT",
      })),
  ];
  const changesMade = [];

  if (apply && beforePlan.property.status === "update") {
    await admin.updateProperty({
      property: {
        name: config.propertyName,
        timeZone: desiredPropertyState.timeZone,
      },
      updateMask: { paths: ["time_zone"] },
    });
    changesMade.push({
      type: "property_timezone",
      from: beforePlan.property.currentTimeZone,
      to: desiredPropertyState.timeZone,
    });
  }

  if (apply && beforePlan.keyEvent.status === "create") {
    const [createdKeyEvent] = await admin.createKeyEvent({
      parent: config.propertyName,
      keyEvent: {
        eventName: desiredKeyEvent.eventName,
        countingMethod: desiredKeyEvent.countingMethod,
      },
    });
    changesMade.push({
      type: "key_event",
      eventName: createdKeyEvent.eventName ?? desiredKeyEvent.eventName,
      countingMethod:
        createdKeyEvent.countingMethod ?? desiredKeyEvent.countingMethod,
      resourceName: createdKeyEvent.name ?? "",
    });
  }

  if (apply) {
    for (const dimension of beforePlan.dimensions.filter(
      (candidate) => candidate.status === "create",
    )) {
      const [createdDimension] = await admin.createCustomDimension({
        parent: config.propertyName,
        customDimension: {
          description: dimension.description,
          displayName: dimension.displayName,
          parameterName: dimension.parameterName,
          scope: "EVENT",
        },
      });
      changesMade.push({
        type: "custom_dimension",
        displayName: createdDimension.displayName ?? dimension.displayName,
        parameterName:
          createdDimension.parameterName ?? dimension.parameterName,
        scope: createdDimension.scope ?? "EVENT",
      });
    }
  }

  const after = await readState(admin, config);
  const afterPlan = createPlan(after);
  const verificationFailures = [];
  const missingRequiredAfter = verifyRequiredExistingKeyEvents(after.keyEvents);

  if (afterPlan.property.status !== "already_present") {
    verificationFailures.push("property_timezone");
  }
  if (afterPlan.keyEvent.status !== "already_present") {
    verificationFailures.push(`generate_lead:${afterPlan.keyEvent.status}`);
  }
  for (const dimension of afterPlan.dimensions) {
    if (
      !["already_present", "display_name_mismatch"].includes(dimension.status)
    ) {
      verificationFailures.push(
        `${dimension.parameterName}:${dimension.status}`,
      );
    }
  }
  if (missingRequiredAfter.length > 0) {
    verificationFailures.push(
      `required_key_events:${missingRequiredAfter.join(",")}`,
    );
  }
  if (
    !sameJson(
      snapshotProtectedPropertyFields(before.property),
      snapshotProtectedPropertyFields(after.property),
    )
  ) {
    verificationFailures.push("unrelated_property_fields_changed");
  }

  const beforeExistingKeyEvents = before.keyEvents
    .filter((event) => event.eventName !== desiredKeyEvent.eventName)
    .map(snapshotKeyEvent)
    .sort((left, right) => left.name.localeCompare(right.name));
  const afterExistingKeyEvents = after.keyEvents
    .filter((event) => event.eventName !== desiredKeyEvent.eventName)
    .map(snapshotKeyEvent)
    .sort((left, right) => left.name.localeCompare(right.name));
  if (!sameJson(beforeExistingKeyEvents, afterExistingKeyEvents)) {
    verificationFailures.push("existing_key_events_changed");
  }
  const beforeDimensions = sortByName(
    before.dimensions.map(snapshotCustomDimension),
  );
  const afterDimensionsByName = new Map(
    after.dimensions
      .map(snapshotCustomDimension)
      .map((dimension) => [dimension.name, dimension]),
  );
  if (
    beforeDimensions.some(
      (dimension) =>
        !sameJson(dimension, afterDimensionsByName.get(dimension.name)),
    )
  ) {
    verificationFailures.push("existing_custom_dimensions_changed");
  }
  if (
    !sameJson(
      sortByName(before.metrics.map(snapshotCustomMetric)),
      sortByName(after.metrics.map(snapshotCustomMetric)),
    )
  ) {
    verificationFailures.push("custom_metrics_changed");
  }
  if (
    !sameJson(
      sortByName(before.streams.map(snapshotDataStream)),
      sortByName(after.streams.map(snapshotDataStream)),
    )
  ) {
    verificationFailures.push("data_streams_changed");
  }
  if (
    !sameJson(
      {
        eventDataRetention: before.retention.eventDataRetention ?? "",
        resetUserDataOnNewActivity:
          before.retention.resetUserDataOnNewActivity === true,
      },
      {
        eventDataRetention: after.retention.eventDataRetention ?? "",
        resetUserDataOnNewActivity:
          after.retention.resetUserDataOnNewActivity === true,
      },
    )
  ) {
    verificationFailures.push("data_retention_changed");
  }
  if (apply && verificationFailures.length > 0) {
    throw new Error(
      `Post-apply verification failed: ${verificationFailures.join(", ")}.`,
    );
  }

  const generateLead = afterPlan.keyEvent.existing[0];
  const payload = {
    mode: apply ? "apply" : "dry-run",
    property: {
      displayName: after.property.displayName ?? "",
      name: after.property.name ?? "",
      propertyId: config.propertyId,
      currencyCode: after.property.currencyCode ?? "",
      industryCategory: after.property.industryCategory ?? "",
      previousTimeZone: before.property.timeZone ?? "",
      timeZone: after.property.timeZone ?? "",
    },
    changesProposed,
    changesMade,
    keyEvent: {
      eventName: desiredKeyEvent.eventName,
      resourceName: generateLead?.name ?? null,
      countingMethod: generateLead?.countingMethod ?? null,
      defaultValue: generateLead?.defaultValue ?? null,
      status: afterPlan.keyEvent.status,
    },
    preservedKeyEvents: after.keyEvents
      .filter((event) =>
        requiredExistingKeyEvents.includes(event.eventName ?? ""),
      )
      .map(snapshotKeyEvent),
    dimensions: afterPlan.dimensions.map((dimension) => ({
      displayName: dimension.displayName,
      existingDisplayName: dimension.existing[0]?.displayName ?? null,
      parameterName: dimension.parameterName,
      scope: dimension.existing[0]?.scope ?? null,
      status: dimension.status,
    })),
    verified:
      verificationFailures.length === 0 &&
      afterPlan.property.status === "already_present" &&
      afterPlan.keyEvent.status === "already_present",
  };
  const lines = [
    `Analytics configuration mode: ${payload.mode}`,
    `Property: ${payload.property.displayName} (${payload.property.name})`,
    `Current timezone: ${payload.property.timeZone}`,
    `Desired timezone: ${desiredPropertyState.timeZone}`,
    `Changes proposed: ${changesProposed.length}`,
    ...changesProposed.map((change) => `- ${describeChange(change)}`),
    `Changes made: ${changesMade.length}`,
    ...changesMade.map((change) => `- ${describeChange(change)}`),
    `generate_lead: ${payload.keyEvent.status}; ${payload.keyEvent.countingMethod ?? "not configured"}; ${payload.keyEvent.resourceName ?? "no resource"}`,
    "",
    "Custom dimensions",
    ...formatRows(payload.dimensions, [
      { key: "parameterName", label: "Parameter" },
      { key: "displayName", label: "Desired display name" },
      { key: "existingDisplayName", label: "Existing display name" },
      { key: "scope", label: "Scope" },
      { key: "status", label: "Status" },
    ]),
  ];
  if (!apply && changesProposed.length > 0) {
    lines.push(
      "",
      "Dry run only. Re-run with `npm run analytics:configure -- --apply` after review.",
    );
  }

  writeOutput({ json: options.json === true, payload, lines });
  return payload;
}

export const configureCustomDimensions = configureAnalytics;

if (isDirectRun(import.meta.url)) {
  await runCommand(() => configureAnalytics());
}
