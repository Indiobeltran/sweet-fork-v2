import {
  createAnalyticsClients,
  formatRows,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "./google-client.mjs";
import {
  desiredKeyEvent,
  desiredPropertyState,
  planCustomDimensions,
} from "./configure-custom-dimensions.mjs";

export const legacyKeyEventName = "inquiry_submitted";
export const protectedKeyEventNames = [
  "purchase",
  "generate_lead",
  "qualify_lead",
  "close_convert_lead",
];

export function planLegacyKeyEventRetirement(keyEvents, propertyName) {
  const matches = keyEvents.filter(
    (keyEvent) => keyEvent.eventName === legacyKeyEventName,
  );

  if (matches.length > 1) {
    return { status: "ambiguous", resourceName: null, existing: matches };
  }
  if (matches.length === 0) {
    return { status: "already_absent", resourceName: null, existing: [] };
  }

  const existing = matches[0];
  if (
    typeof existing.name !== "string" ||
    !existing.name.startsWith(`${propertyName}/keyEvents/`)
  ) {
    return {
      status: "invalid_resource_name",
      resourceName: existing.name ?? null,
      existing: matches,
    };
  }
  if (existing.custom !== true || existing.deletable !== true) {
    return {
      status: "not_deletable",
      resourceName: existing.name,
      existing: matches,
    };
  }

  return {
    status: "delete",
    resourceName: existing.name,
    existing: matches,
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

function snapshotProperty(property) {
  return {
    account: property.account ?? "",
    currencyCode: property.currencyCode ?? "",
    displayName: property.displayName ?? "",
    industryCategory: property.industryCategory ?? "",
    name: property.name ?? "",
    parent: property.parent ?? "",
    propertyType: property.propertyType ?? "",
    serviceLevel: property.serviceLevel ?? "",
    timeZone: property.timeZone ?? "",
  };
}

function snapshotDimension(dimension) {
  return {
    archived: dimension.archived === true,
    description: dimension.description ?? "",
    displayName: dimension.displayName ?? "",
    name: dimension.name ?? "",
    parameterName: dimension.parameterName ?? "",
    scope: dimension.scope ?? "",
  };
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortByName(items) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

async function readState(admin, config) {
  const [[property], [keyEvents], [dimensions]] = await Promise.all([
    admin.getProperty({ name: config.propertyName }),
    admin.listKeyEvents({ parent: config.propertyName }),
    admin.listCustomDimensions({
      parent: config.propertyName,
      showArchived: true,
    }),
  ]);

  return { property, keyEvents, dimensions };
}

function assertApprovedState(state, config) {
  if (
    state.property.name !== config.propertyName ||
    state.property.displayName !== desiredPropertyState.displayName ||
    state.property.timeZone !== desiredPropertyState.timeZone
  ) {
    throw new Error(
      "The configured GA4 property identity or timezone does not match the approved Sweet Fork state. No key event was deleted.",
    );
  }

  const missingOrDuplicate = protectedKeyEventNames.filter(
    (eventName) =>
      state.keyEvents.filter((keyEvent) => keyEvent.eventName === eventName)
        .length !== 1,
  );
  if (missingOrDuplicate.length > 0) {
    throw new Error(
      `Protected key-event state is missing or ambiguous for: ${missingOrDuplicate.join(", ")}. No key event was deleted.`,
    );
  }

  const generateLead = state.keyEvents.find(
    (keyEvent) => keyEvent.eventName === desiredKeyEvent.eventName,
  );
  if (generateLead?.countingMethod !== desiredKeyEvent.countingMethod) {
    throw new Error(
      "generate_lead does not use ONCE_PER_EVENT. No key event was deleted.",
    );
  }

  const dimensionPlan = planCustomDimensions(state.dimensions);
  const dimensionFailures = dimensionPlan.filter(
    (dimension) =>
      !["already_present", "display_name_mismatch"].includes(dimension.status),
  );
  if (dimensionFailures.length > 0) {
    throw new Error(
      `Inquiry custom-dimension state is invalid for: ${dimensionFailures.map((dimension) => dimension.parameterName).join(", ")}. No key event was deleted.`,
    );
  }

  return dimensionPlan;
}

function protectedKeyEventSnapshot(keyEvents) {
  return sortByName(
    keyEvents
      .filter((keyEvent) =>
        protectedKeyEventNames.includes(keyEvent.eventName ?? ""),
      )
      .map(snapshotKeyEvent),
  );
}

export async function retireLegacyKeyEvent(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const apply = options.apply === true;
  const config = await loadGoogleConfig();
  const { admin } = createAnalyticsClients();
  const before = await readState(admin, config);
  assertApprovedState(before, config);
  const retirementPlan = planLegacyKeyEventRetirement(
    before.keyEvents,
    config.propertyName,
  );

  if (
    !["delete", "already_absent"].includes(retirementPlan.status)
  ) {
    throw new Error(
      `Legacy key-event retirement is blocked: ${retirementPlan.status}. No key event was deleted.`,
    );
  }

  const changesProposed =
    retirementPlan.status === "delete"
      ? [
          {
            action: "delete_key_event_configuration",
            eventName: legacyKeyEventName,
            resourceName: retirementPlan.resourceName,
          },
        ]
      : [];
  const changesMade = [];

  if (apply && retirementPlan.status === "delete") {
    await admin.deleteKeyEvent({ name: retirementPlan.resourceName });
    changesMade.push(changesProposed[0]);
  }

  const after = await readState(admin, config);
  const afterDimensionPlan = assertApprovedState(after, config);
  const afterPlan = planLegacyKeyEventRetirement(
    after.keyEvents,
    config.propertyName,
  );
  const verificationFailures = [];

  if (apply && afterPlan.status !== "already_absent") {
    verificationFailures.push(`legacy_key_event:${afterPlan.status}`);
  }
  if (
    !sameJson(snapshotProperty(before.property), snapshotProperty(after.property))
  ) {
    verificationFailures.push("property_changed");
  }
  if (
    !sameJson(
      protectedKeyEventSnapshot(before.keyEvents),
      protectedKeyEventSnapshot(after.keyEvents),
    )
  ) {
    verificationFailures.push("protected_key_events_changed");
  }
  if (
    !sameJson(
      sortByName(before.dimensions.map(snapshotDimension)),
      sortByName(after.dimensions.map(snapshotDimension)),
    )
  ) {
    verificationFailures.push("custom_dimensions_changed");
  }
  if (apply && verificationFailures.length > 0) {
    throw new Error(
      `Post-retirement verification failed: ${verificationFailures.join(", ")}.`,
    );
  }

  const finalKeyEvents = after.keyEvents
    .map(snapshotKeyEvent)
    .sort((left, right) => left.eventName.localeCompare(right.eventName));
  const payload = {
    mode: apply ? "apply" : "dry-run",
    property: {
      displayName: after.property.displayName ?? "",
      name: after.property.name ?? "",
      timeZone: after.property.timeZone ?? "",
    },
    legacyKeyEvent: {
      eventName: legacyKeyEventName,
      resourceName: retirementPlan.resourceName,
      status: afterPlan.status,
    },
    changesProposed,
    changesMade,
    finalKeyEvents,
    dimensions: afterDimensionPlan.map((dimension) => ({
      parameterName: dimension.parameterName,
      scope: dimension.existing[0]?.scope ?? null,
      status: dimension.status,
    })),
    historicalEventDataDeleted: false,
    verified:
      verificationFailures.length === 0 &&
      (!apply || afterPlan.status === "already_absent"),
  };
  const lines = [
    `Legacy key-event retirement mode: ${payload.mode}`,
    `Property: ${payload.property.displayName} (${payload.property.name})`,
    `Timezone: ${payload.property.timeZone}`,
    `Changes proposed: ${changesProposed.length}`,
    ...changesProposed.map(
      (change) =>
        `- Delete ${change.eventName} key-event configuration (${change.resourceName})`,
    ),
    `Changes made: ${changesMade.length}`,
    ...changesMade.map(
      (change) =>
        `- Deleted ${change.eventName} key-event configuration (${change.resourceName})`,
    ),
    `Legacy status: ${afterPlan.status}`,
    "Historical Analytics event data deleted: NO",
    "",
    "Key events after command",
    ...formatRows(finalKeyEvents, [
      { key: "eventName", label: "Event" },
      { key: "name", label: "Resource" },
      { key: "countingMethod", label: "Counting" },
    ]),
    "",
    "Inquiry custom dimensions",
    ...formatRows(payload.dimensions, [
      { key: "parameterName", label: "Parameter" },
      { key: "scope", label: "Scope" },
      { key: "status", label: "Status" },
    ]),
  ];
  if (!apply && changesProposed.length > 0) {
    lines.push(
      "",
      "Dry run only. Re-run with `npm run analytics:retire-legacy -- --apply` after review.",
    );
  }

  writeOutput({ json: options.json === true, payload, lines });
  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => retireLegacyKeyEvent());
}
