import {
  createAnalyticsClients,
  formatRows,
  isDirectRun,
  loadGoogleConfig,
  parseArguments,
  runCommand,
  writeOutput,
} from "./google-client.mjs";

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

async function listDimensions(admin, propertyName) {
  const [dimensions] = await admin.listCustomDimensions({
    parent: propertyName,
    showArchived: true,
  });
  return dimensions;
}

export async function configureCustomDimensions(
  argv = process.argv.slice(2),
) {
  const options = parseArguments(argv);
  const apply = options.apply === true;
  const config = await loadGoogleConfig();
  const { admin } = createAnalyticsClients();
  const existing = await listDimensions(admin, config.propertyName);
  const initialPlan = planCustomDimensions(existing);
  const blocking = initialPlan.filter((item) =>
    ["duplicate", "scope_mismatch", "archived_conflict"].includes(item.status),
  );

  if (blocking.length > 0 && apply) {
    throw new Error(
      `Custom-dimension configuration is blocked by ${blocking.length} duplicate, scope, or archived conflict(s). No dimensions were created.`,
    );
  }

  const created = [];
  if (apply) {
    for (const item of initialPlan.filter(
      (candidate) => candidate.status === "create",
    )) {
      const [dimension] = await admin.createCustomDimension({
        parent: config.propertyName,
        customDimension: {
          description: item.description,
          displayName: item.displayName,
          parameterName: item.parameterName,
          scope: "EVENT",
        },
      });
      created.push({
        displayName: dimension.displayName ?? item.displayName,
        parameterName: dimension.parameterName ?? item.parameterName,
        scope: dimension.scope ?? "",
      });
    }
  }

  const finalDimensions = await listDimensions(admin, config.propertyName);
  const finalPlan = planCustomDimensions(finalDimensions);
  const verificationFailures = finalPlan.filter((item) =>
    ["create", "duplicate", "scope_mismatch", "archived_conflict"].includes(
      item.status,
    ),
  );
  const [keyEvents] = await admin.listKeyEvents({
    parent: config.propertyName,
  });
  const payload = {
    mode: apply ? "apply" : "dry-run",
    created,
    dimensions: finalPlan.map((item) => ({
      displayName: item.displayName,
      existingDisplayName: item.existing[0]?.displayName ?? null,
      parameterName: item.parameterName,
      scope: item.existing[0]?.scope ?? null,
      status: item.status,
    })),
    generateLeadIsKeyEvent: keyEvents.some(
      (event) => event.eventName === "generate_lead",
    ),
    verified:
      apply && verificationFailures.length === 0
        ? true
        : !apply
          ? null
          : false,
  };

  if (apply && verificationFailures.length > 0) {
    throw new Error(
      `Post-creation verification failed for: ${verificationFailures.map((item) => item.parameterName).join(", ")}.`,
    );
  }

  const lines = [
    `Custom-dimension mode: ${payload.mode}`,
    `Created: ${created.length}`,
    `generate_lead key event: ${payload.generateLeadIsKeyEvent ? "YES" : "NO (not modified)"}`,
    "",
    ...formatRows(payload.dimensions, [
      { key: "parameterName", label: "Parameter" },
      { key: "displayName", label: "Desired display name" },
      { key: "existingDisplayName", label: "Existing display name" },
      { key: "scope", label: "Scope" },
      { key: "status", label: "Status" },
    ]),
  ];
  if (!apply) {
    lines.push(
      "",
      "Dry run only. Re-run with `npm run analytics:configure -- --apply` after review.",
    );
  }

  writeOutput({ json: options.json === true, payload, lines });
  return payload;
}

if (isDirectRun(import.meta.url)) {
  await runCommand(() => configureCustomDimensions());
}
