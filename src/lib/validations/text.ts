const controlCharacterPattern =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const htmlTagPattern = /<[^>]*>/g;

export function sanitizeTextValue(
  value: string,
  options: { multiline?: boolean } = {},
) {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(controlCharacterPattern, " ")
    .replace(htmlTagPattern, " ");

  const collapsed = options.multiline
    ? normalized.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n")
    : normalized.replace(/\s+/g, " ");

  return collapsed.trim();
}

export function sanitizeOptionalTextValue(
  value: string | undefined,
  options: { multiline?: boolean } = {},
) {
  if (!value) {
    return undefined;
  }

  const sanitized = sanitizeTextValue(value, options);
  return sanitized.length > 0 ? sanitized : undefined;
}
