export type PlacementDefinitionLike = {
  description: string;
  key: string;
  label: string;
  pageKey: string;
  sectionKey: string;
  slotKey: string;
};

export type MediaPlacementWarning = {
  label: string;
  message: string;
  placementKey: string;
  severity: "high" | "medium" | "low";
  type: "missing" | "conflict" | "stale";
  assignmentId?: string;
};

type MediaAssetPlacementShape = {
  createdAt?: string;
  featured?: boolean;
  id: string;
  pageAssignments: Array<{
    assignmentId: string;
    displayOrder: number;
    placementKey: string;
    createdAt?: string;
    updatedAt?: string;
    metadata?: Record<string, unknown>;
  }>;
};

const placementTitleOverrides: Record<string, string> = {
  "diy-kits": "DIY Kits",
};

function titleFromSlug(value: string) {
  if (placementTitleOverrides[value]) {
    return placementTitleOverrides[value];
  }

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getDefinition(
  placementKey: string,
  placementDefinitions: readonly PlacementDefinitionLike[],
) {
  return placementDefinitions.find((definition) => definition.key === placementKey) ?? null;
}

function getSlotTitle(
  placementKey: string,
  placementDefinitions: readonly PlacementDefinitionLike[],
) {
  const definition = getDefinition(placementKey, placementDefinitions);
  const slotKey = definition?.slotKey ?? placementKey.split(".").at(-1) ?? placementKey;
  return titleFromSlug(slotKey);
}

function hasPageAssignment(asset: MediaAssetPlacementShape, predicate: (key: string) => boolean) {
  return asset.pageAssignments.some((assignment) => predicate(assignment.placementKey));
}

function lowestAssignmentOrder(
  asset: MediaAssetPlacementShape,
  predicate: (key: string) => boolean,
) {
  const orders = asset.pageAssignments
    .filter((assignment) => predicate(assignment.placementKey))
    .map((assignment) => assignment.displayOrder);

  return orders.length > 0 ? Math.min(...orders) : Number.MAX_SAFE_INTEGER;
}

export function isProminentMediaPlacement(placementKey: string) {
  return (
    placementKey === "home.gallery" ||
    placementKey.startsWith("home.offering.") ||
    placementKey.startsWith("product.hero.")
  );
}

export function isProductShowcasePlacement(placementKey: string) {
  return placementKey.startsWith("product.gallery.");
}

export function isRequiredMediaPlacement(placementKey: string) {
  return isProminentMediaPlacement(placementKey);
}

export function getMediaPlacementBadgeLabel(
  placementKey: string,
  placementDefinitions: readonly PlacementDefinitionLike[],
) {
  const title = getSlotTitle(placementKey, placementDefinitions);

  if (placementKey === "home.gallery") {
    return "Homepage hero";
  }

  if (placementKey.startsWith("home.offering.")) {
    return `Product card: ${title}`;
  }

  if (placementKey.startsWith("product.hero.")) {
    return `Product hero: ${title}`;
  }

  if (placementKey.startsWith("product.gallery.")) {
    return `Product examples: ${title}`;
  }

  if (placementKey === "gallery.grid") {
    return "Full gallery";
  }

  return getDefinition(placementKey, placementDefinitions)?.label ?? title;
}

export function getPlacementWarnings(
  assets: readonly MediaAssetPlacementShape[],
  placementDefinitions: readonly PlacementDefinitionLike[],
): MediaPlacementWarning[] {
  const warnings: MediaPlacementWarning[] = [];
  const assignedPlacements = new Map<string, Array<{ assetId: string; assignmentId: string; age: number; isStale: boolean; staleAcknowledged: boolean; createdAt?: string }>>();

  const now = Date.now();
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

  for (const asset of assets) {
    for (const assignment of asset.pageAssignments) {
      const list = assignedPlacements.get(assignment.placementKey) ?? [];
      
      const assignedAtStr = (assignment.metadata?.assigned_at as string | undefined) ?? assignment.createdAt ?? assignment.updatedAt;
      const assignedAtDate = assignedAtStr ? new Date(assignedAtStr) : new Date();
      const ageMs = now - assignedAtDate.getTime();
      const isStale = ageMs > NINETY_DAYS_MS;
      
      let staleAcknowledged = false;
      const ackDateStr = assignment.metadata?.stale_acknowledged_at as string | undefined;
      if (ackDateStr) {
        const ackDate = new Date(ackDateStr);
        if (now - ackDate.getTime() < NINETY_DAYS_MS) {
          staleAcknowledged = true;
        }
      }

      list.push({ 
        assetId: asset.id, 
        assignmentId: assignment.assignmentId, 
        age: ageMs, 
        isStale, 
        staleAcknowledged,
        createdAt: assignment.createdAt 
      });
      assignedPlacements.set(assignment.placementKey, list);
    }
  }

  for (const definition of placementDefinitions) {
    const assignments = assignedPlacements.get(definition.key) ?? [];
    const label = getMediaPlacementBadgeLabel(definition.key, placementDefinitions);
    const isProminent = isProminentMediaPlacement(definition.key);
    
    // Multi-image placements don't trigger conflicts or required missing errors natively right now,
    // but the original code only checked isProminent (which are single hero/featured slots mostly).
    // Actually, let's treat prominent ones as single-slot and required.
    const isSingleSlot = isProminent; 

    if (isRequiredMediaPlacement(definition.key) && assignments.length === 0) {
      warnings.push({
        label,
        message: `${label} does not have a selected photo. The site may show a fallback image until one is assigned.`,
        placementKey: definition.key,
        severity: "high",
        type: "missing",
      });
    } else if (isSingleSlot && assignments.length > 1) {
      warnings.push({
        label,
        message: `${label} has ${assignments.length} images assigned. Choose one to avoid unpredictable display.`,
        placementKey: definition.key,
        severity: "high",
        type: "conflict",
      });
    }

    if (isProminent && assignments.length > 0) {
      for (const assignment of assignments) {
        if (assignment.isStale && !assignment.staleAcknowledged) {
          const daysOld = Math.floor(assignment.age / (1000 * 60 * 60 * 24));
          warnings.push({
            label,
            message: `The ${label} image has been active for ${daysOld} days. Consider choosing a fresh or seasonal photo.`,
            placementKey: definition.key,
            severity: "medium",
            type: "stale",
            assignmentId: assignment.assignmentId,
          });
        }
      }
    }
  }

  return warnings;
}

export function sortMediaAssetsByPlacementUse<T extends MediaAssetPlacementShape>(
  assets: readonly T[],
) {
  return [...assets].sort((left, right) => {
    const leftProminent = hasPageAssignment(left, isProminentMediaPlacement);
    const rightProminent = hasPageAssignment(right, isProminentMediaPlacement);

    if (leftProminent !== rightProminent) {
      return leftProminent ? -1 : 1;
    }

    if (leftProminent && rightProminent) {
      const orderDifference =
        lowestAssignmentOrder(left, isProminentMediaPlacement) -
        lowestAssignmentOrder(right, isProminentMediaPlacement);

      if (orderDifference !== 0) {
        return orderDifference;
      }
    }

    const leftShowcase = hasPageAssignment(left, isProductShowcasePlacement);
    const rightShowcase = hasPageAssignment(right, isProductShowcasePlacement);

    if (leftShowcase !== rightShowcase) {
      return leftShowcase ? -1 : 1;
    }

    if (leftShowcase && rightShowcase) {
      const orderDifference =
        lowestAssignmentOrder(left, isProductShowcasePlacement) -
        lowestAssignmentOrder(right, isProductShowcasePlacement);

      if (orderDifference !== 0) {
        return orderDifference;
      }
    }

    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return left.featured ? -1 : 1;
    }

    return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
  });
}

export function convertStoredOrderToUiPosition(storedOrder: number, totalCount: number): number {
  const uiPosition = Math.max(1, Math.round(storedOrder / 10));
  return Math.min(totalCount, uiPosition);
}

export function convertUiPositionToStoredOrder(uiPosition: number): number {
  return Math.max(1, uiPosition) * 10;
}
