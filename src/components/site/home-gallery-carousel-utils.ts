export type HomeGalleryCarouselItem = {
  category: string;
  id: string;
};

export function getHomeGalleryCarouselWindow<T>(
  items: readonly T[],
  {
    startIndex,
    visibleCount,
  }: {
    startIndex: number;
    visibleCount: number;
  },
): T[] {
  if (items.length === 0 || visibleCount <= 0) {
    return [];
  }

  const safeStartIndex = ((startIndex % items.length) + items.length) % items.length;
  const count = Math.min(visibleCount, items.length);

  return Array.from({ length: count }, (_, offset) => {
    return items[(safeStartIndex + offset) % items.length]!;
  });
}

export function getNextHomeGalleryCarouselIndex(
  currentIndex: number,
  itemCount: number,
  direction: "next" | "previous" = "next",
) {
  if (itemCount <= 0) {
    return 0;
  }

  if (direction === "previous") {
    return (currentIndex - 1 + itemCount) % itemCount;
  }

  return (currentIndex + 1) % itemCount;
}

export function orderHomeGalleryCarouselItems<T extends HomeGalleryCarouselItem>(
  items: readonly T[],
): T[] {
  const categoryBuckets = new Map<string, T[]>();

  for (const item of items) {
    const normalizedCategory = item.category.trim().toLowerCase() || "uncategorized";
    const bucket = categoryBuckets.get(normalizedCategory) ?? [];
    bucket.push(item);
    categoryBuckets.set(normalizedCategory, bucket);
  }

  const orderedItems: T[] = [];

  while (categoryBuckets.size > 0) {
    const buckets = Array.from(categoryBuckets.entries()).sort((left, right) => {
      const remainingDifference = right[1].length - left[1].length;

      if (remainingDifference !== 0) {
        return remainingDifference;
      }

      return 0;
    });

    for (const [category, bucket] of buckets) {
      const nextItem = bucket.shift();

      if (nextItem) {
        orderedItems.push(nextItem);
      }

      if (bucket.length === 0) {
        categoryBuckets.delete(category);
      }
    }
  }

  return orderedItems;
}
