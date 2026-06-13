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
};

type MediaAssetPlacementShape = {
  createdAt?: string;
  featured?: boolean;
  id: string;
  pageAssignments: Array<{
    displayOrder: number;
    placementKey: string;
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

export function getMissingRequiredPlacementWarnings(
  assets: readonly MediaAssetPlacementShape[],
  placementDefinitions: readonly PlacementDefinitionLike[],
): MediaPlacementWarning[] {
  const assignedPlacementKeys = new Set(
    assets.flatMap((asset) => asset.pageAssignments.map((assignment) => assignment.placementKey)),
  );

  return placementDefinitions
    .filter((definition) => isRequiredMediaPlacement(definition.key))
    .filter((definition) => !assignedPlacementKeys.has(definition.key))
    .map((definition) => {
      const label = getMediaPlacementBadgeLabel(definition.key, placementDefinitions);

      return {
        label,
        message: `${label} does not have a selected photo. The site may show a fallback image until one is assigned.`,
        placementKey: definition.key,
      };
    });
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
