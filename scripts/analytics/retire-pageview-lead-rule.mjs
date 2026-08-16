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
import { protectedKeyEventNames } from "./retire-legacy-key-event.mjs";

export const approvedDataStreamName =
  "properties/504065366/dataStreams/12126159657";
export const approvedMeasurementId = "G-3FG4VD58VP";
export const approvedPageviewLeadRuleResource =
  `${approvedDataStreamName}/eventCreateRules/15350934572`;

const approvedConditions = [
  {
    field: "event_name",
    comparisonType: "EQUALS",
    value: "page_view",
    negated: false,
  },
  {
    field: "page_location",
    comparisonType: "CONTAINS_CASE_INSENSITIVE",
    value: "Thesweetfork.com",
    negated: false,
  },
];

function conditionSnapshot(condition) {
  return {
    comparisonType: condition.comparisonType ?? "",
    field: condition.field ?? "",
    negated: condition.negated === true,
    value: condition.value ?? "",
  };
}

function sortConditions(conditions) {
  return [...conditions].sort((left, right) =>
    `${left.field}:${left.comparisonType}:${left.value}`.localeCompare(
      `${right.field}:${right.comparisonType}:${right.value}`,
    ),
  );
}

export function snapshotEventCreateRule(rule) {
  return {
    destinationEvent: rule.destinationEvent ?? "",
    eventConditions: sortConditions(
      (rule.eventConditions ?? []).map(conditionSnapshot),
    ),
    name: rule.name ?? "",
    parameterMutations: (rule.parameterMutations ?? []).map((mutation) => ({
      parameter: mutation.parameter ?? "",
      parameterValue: mutation.parameterValue ?? "",
    })),
    sourceCopyParameters: rule.sourceCopyParameters === true,
  };
}

export function snapshotEventEditRule(rule) {
  return {
    displayName: rule.displayName ?? "",
    eventConditions: sortConditions(
      (rule.eventConditions ?? []).map(conditionSnapshot),
    ),
    name: rule.name ?? "",
    parameterMutations: (rule.parameterMutations ?? []).map((mutation) => ({
      parameter: mutation.parameter ?? "",
      parameterValue: mutation.parameterValue ?? "",
    })),
    processingOrder: rule.processingOrder ?? 0,
  };
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortByName(items) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function isApprovedShape(rule) {
  const snapshot = snapshotEventCreateRule(rule);
  return (
    snapshot.destinationEvent === "generate_lead" &&
    snapshot.sourceCopyParameters === false &&
    snapshot.parameterMutations.length === 0 &&
    sameJson(
      snapshot.eventConditions,
      sortConditions(approvedConditions.map(conditionSnapshot)),
    )
  );
}

export function isPageviewToLeadRule(rule) {
  return (
    rule.destinationEvent === "generate_lead" &&
    (rule.eventConditions ?? []).some((condition) => {
      const snapshot = conditionSnapshot(condition);
      return (
        snapshot.field === "event_name" &&
        snapshot.comparisonType === "EQUALS" &&
        snapshot.value === "page_view" &&
        snapshot.negated === false
      );
    })
  );
}

export function planPageviewLeadRuleRetirement(rules, streamName) {
  const matches = rules.filter(
    (rule) => rule.destinationEvent === "generate_lead",
  );

  if (matches.length > 1) {
    return { status: "ambiguous", resourceName: null, existing: matches };
  }
  if (matches.length === 0) {
    return { status: "already_absent", resourceName: null, existing: [] };
  }

  const existing = matches[0];
  if (
    existing.name !== approvedPageviewLeadRuleResource ||
    !existing.name.startsWith(`${streamName}/eventCreateRules/`)
  ) {
    return {
      status: "invalid_resource_name",
      resourceName: existing.name ?? null,
      existing: matches,
    };
  }
  if (!isApprovedShape(existing)) {
    return {
      status: "unexpected_rule_shape",
      resourceName: existing.name,
      existing: matches,
    };
  }

  return { status: "delete", resourceName: existing.name, existing: matches };
}

function snapshotProperty(property) {
  return {
    displayName: property.displayName ?? "",
    name: property.name ?? "",
    timeZone: property.timeZone ?? "",
  };
}

function snapshotKeyEvent(keyEvent) {
  return {
    countingMethod: keyEvent.countingMethod ?? "",
    eventName: keyEvent.eventName ?? "",
    name: keyEvent.name ?? "",
  };
}

function snapshotDimension(dimension) {
  return {
    archived: dimension.archived === true,
    displayName: dimension.displayName ?? "",
    name: dimension.name ?? "",
    parameterName: dimension.parameterName ?? "",
    scope: dimension.scope ?? "",
  };
}

function snapshotStream(stream) {
  return {
    defaultUri: stream.webStreamData?.defaultUri ?? "",
    displayName: stream.displayName ?? "",
    measurementId: stream.webStreamData?.measurementId ?? "",
    name: stream.name ?? "",
    type: stream.type ?? "",
  };
}

async function readRules(admin, streams) {
  const records = await Promise.all(
    streams.map(async (stream) => {
      const [[eventCreateRules], [eventEditRules]] = await Promise.all([
        admin.listEventCreateRules({ parent: stream.name }),
        admin.listEventEditRules({ parent: stream.name }),
      ]);
      return { eventCreateRules, eventEditRules, streamName: stream.name };
    }),
  );

  return {
    eventCreateRules: records.flatMap((record) => record.eventCreateRules),
    eventEditRules: records.flatMap((record) => record.eventEditRules),
  };
}

async function readState(admin, config) {
  const [[property], [keyEvents], [dimensions], [streams]] = await Promise.all([
    admin.getProperty({ name: config.propertyName }),
    admin.listKeyEvents({ parent: config.propertyName }),
    admin.listCustomDimensions({
      parent: config.propertyName,
      showArchived: true,
    }),
    admin.listDataStreams({ parent: config.propertyName }),
  ]);
  const rules = await readRules(admin, streams);
  return { property, keyEvents, dimensions, streams, ...rules };
}

function assertApprovedState(state, config) {
  if (
    state.property.name !== config.propertyName ||
    state.property.displayName !== desiredPropertyState.displayName ||
    state.property.timeZone !== desiredPropertyState.timeZone
  ) {
    throw new Error(
      "The GA4 property identity or timezone does not match the approved Sweet Fork state. No event rule was deleted.",
    );
  }
  if (
    state.streams.length !== 1 ||
    state.streams[0]?.name !== approvedDataStreamName ||
    state.streams[0]?.webStreamData?.measurementId !== approvedMeasurementId
  ) {
    throw new Error(
      "The GA4 data stream does not match the approved Sweet Fork stream. No event rule was deleted.",
    );
  }

  const missingOrDuplicate = protectedKeyEventNames.filter(
    (eventName) =>
      state.keyEvents.filter((keyEvent) => keyEvent.eventName === eventName)
        .length !== 1,
  );
  if (missingOrDuplicate.length > 0) {
    throw new Error(
      `Protected key-event state is missing or ambiguous for: ${missingOrDuplicate.join(", ")}. No event rule was deleted.`,
    );
  }
  const generateLead = state.keyEvents.find(
    (keyEvent) => keyEvent.eventName === desiredKeyEvent.eventName,
  );
  if (generateLead?.countingMethod !== desiredKeyEvent.countingMethod) {
    throw new Error(
      "generate_lead does not use ONCE_PER_EVENT. No event rule was deleted.",
    );
  }
  const dimensionPlan = planCustomDimensions(state.dimensions);
  const invalidDimensions = dimensionPlan.filter(
    (dimension) =>
      !["already_present", "display_name_mismatch"].includes(dimension.status),
  );
  if (invalidDimensions.length > 0) {
    throw new Error(
      `Inquiry custom-dimension state is invalid for: ${invalidDimensions.map((dimension) => dimension.parameterName).join(", ")}. No event rule was deleted.`,
    );
  }
  return dimensionPlan;
}

function snapshots(state) {
  return {
    property: snapshotProperty(state.property),
    keyEvents: sortByName(state.keyEvents.map(snapshotKeyEvent)),
    dimensions: sortByName(state.dimensions.map(snapshotDimension)),
    streams: sortByName(state.streams.map(snapshotStream)),
    createRules: sortByName(state.eventCreateRules.map(snapshotEventCreateRule)),
    editRules: sortByName(state.eventEditRules.map(snapshotEventEditRule)),
  };
}

export async function retirePageviewLeadRule(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const apply = options.apply === true;
  const config = await loadGoogleConfig();
  const { admin } = createAnalyticsClients();
  const before = await readState(admin, config);
  const dimensionPlan = assertApprovedState(before, config);
  const retirementPlan = planPageviewLeadRuleRetirement(
    before.eventCreateRules,
    approvedDataStreamName,
  );

  if (!["delete", "already_absent"].includes(retirementPlan.status)) {
    throw new Error(
      `Page-view lead-rule retirement is blocked: ${retirementPlan.status}. No event rule was deleted.`,
    );
  }

  const changesProposed =
    retirementPlan.status === "delete"
      ? [
          {
            action: "delete_event_create_rule",
            destinationEvent: "generate_lead",
            resourceName: retirementPlan.resourceName,
          },
        ]
      : [];
  const changesMade = [];
  if (apply && retirementPlan.status === "delete") {
    await admin.deleteEventCreateRule({ name: retirementPlan.resourceName });
    changesMade.push(changesProposed[0]);
  }

  const after = await readState(admin, config);
  assertApprovedState(after, config);
  const afterPlan = planPageviewLeadRuleRetirement(
    after.eventCreateRules,
    approvedDataStreamName,
  );
  const beforeSnapshots = snapshots(before);
  const afterSnapshots = snapshots(after);
  const verificationFailures = [];

  if (apply && afterPlan.status !== "already_absent") {
    verificationFailures.push(`target_rule:${afterPlan.status}`);
  }
  for (const key of ["property", "keyEvents", "dimensions", "streams", "editRules"]) {
    if (!sameJson(beforeSnapshots[key], afterSnapshots[key])) {
      verificationFailures.push(`${key}_changed`);
    }
  }
  const expectedCreateRules = apply
    ? beforeSnapshots.createRules.filter(
        (rule) => rule.name !== approvedPageviewLeadRuleResource,
      )
    : beforeSnapshots.createRules;
  if (!sameJson(expectedCreateRules, afterSnapshots.createRules)) {
    verificationFailures.push("unrelated_create_rules_changed");
  }
  if (verificationFailures.length > 0) {
    throw new Error(
      `Post-retirement verification failed: ${verificationFailures.join(", ")}.`,
    );
  }

  const payload = {
    mode: apply ? "apply" : "dry-run",
    property: snapshotProperty(after.property),
    dataStream: snapshotStream(after.streams[0]),
    targetRule: {
      destinationEvent: "generate_lead",
      resourceName: retirementPlan.resourceName,
      status: afterPlan.status,
    },
    changesProposed,
    changesMade,
    remainingEventCreateRules: afterSnapshots.createRules,
    eventEditRules: afterSnapshots.editRules,
    dimensions: dimensionPlan.map((dimension) => ({
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
    `Page-view lead-rule retirement mode: ${payload.mode}`,
    `Property: ${payload.property.displayName} (${payload.property.name})`,
    `Data stream: ${payload.dataStream.displayName} (${payload.dataStream.measurementId})`,
    `Changes proposed: ${changesProposed.length}`,
    ...changesProposed.map(
      (change) =>
        `- Delete event-create rule ${change.resourceName} (${change.destinationEvent})`,
    ),
    `Changes made: ${changesMade.length}`,
    ...changesMade.map(
      (change) => `- Deleted event-create rule ${change.resourceName}`,
    ),
    `Target status: ${afterPlan.status}`,
    "Historical Analytics event data deleted: NO",
    "",
    "Remaining event-create rules",
    ...formatRows(
      payload.remainingEventCreateRules,
      [
        { key: "name", label: "Resource" },
        { key: "destinationEvent", label: "Destination event" },
      ],
      "No event-create rules.",
    ),
    "",
    "Event-edit rules",
    ...formatRows(
      payload.eventEditRules,
      [
        { key: "name", label: "Resource" },
        { key: "displayName", label: "Display name" },
      ],
      "No event-edit rules.",
    ),
  ];
  if (!apply && changesProposed.length > 0) {
    lines.push(
      "",
      "Dry run only. Re-run with `npm run analytics:retire-pageview-lead-rule -- --apply` after explicit approval.",
    );
  }

  writeOutput({ json: options.json === true, payload, lines });
  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => retirePageviewLeadRule());
}
