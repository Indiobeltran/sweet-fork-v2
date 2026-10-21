function getFileStem(value: string) {
  return value.trim().split(/[\\/]/).pop()!.replace(/\.[^.]+$/, "");
}

function isCameraFileName(value: string) {
  // Also recognize already-prettified names and common edited/duplicate suffixes.
  return /^(?:img|dscn?|dscf|pxl|mvimg|dji)[\s_-]*e?\d[\w\s().-]*$/i.test(
    getFileStem(value),
  );
}

export function prettifyFileName(value: string | null) {
  if (!value?.trim() || isCameraFileName(value)) {
    return "Gallery image";
  }

  return getFileStem(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getGalleryAltText({
  altText,
  category,
  title,
}: {
  altText: string | null | undefined;
  category: string | undefined;
  title: string;
}) {
  const trimmedAltText = altText?.trim();
  if (trimmedAltText && !isCameraFileName(trimmedAltText)) {
    return trimmedAltText;
  }

  const normalizedCategory = category?.trim();
  const trimmedTitle = title.trim();
  if (
    !trimmedTitle ||
    isCameraFileName(trimmedTitle) ||
    trimmedTitle.toLowerCase() === "gallery image"
  ) {
    // Use known category information without inventing visual details.
    return normalizedCategory
      ? `${normalizedCategory} by The Sweet Fork`
      : "Custom dessert by The Sweet Fork";
  }

  return !normalizedCategory || trimmedTitle.toLowerCase().includes(normalizedCategory.toLowerCase())
    ? trimmedTitle
    : `${trimmedTitle}, ${normalizedCategory.toLowerCase()}`;
}
