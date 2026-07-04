export const MAX_MEDIA_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MEDIA_UPLOAD_EXTENSIONS = [".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"] as const;

const allowedExtensionSet = new Set<string>(ALLOWED_MEDIA_UPLOAD_EXTENSIONS);

export type MediaUploadFileLike = {
  name: string;
  size: number;
  type: string;
};

export type MediaUploadValidationResult =
  | {
      ok: true;
    }
  | {
      code: "empty" | "extension" | "mime" | "size";
      extension?: string;
      message: string;
      ok: false;
    };

export function getMediaUploadFileExtension(fileName: string) {
  return fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase() : "";
}

export function getAllowedMediaUploadExtensionsLabel() {
  return ALLOWED_MEDIA_UPLOAD_EXTENSIONS.join(", ");
}

export function getMediaUploadTooLargeMessage() {
  return "File too large (max 10 MB).";
}

export function getMediaUploadExtensionMessage(extension: string) {
  return `File type ${extension || "(none)"} is not allowed. Allowed: ${getAllowedMediaUploadExtensionsLabel()}.`;
}

export function validateMediaUploadFile(file: MediaUploadFileLike): MediaUploadValidationResult {
  if (file.size === 0) {
    return {
      code: "empty",
      message: "Please choose an image file before uploading.",
      ok: false,
    };
  }

  if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
    return {
      code: "size",
      message: getMediaUploadTooLargeMessage(),
      ok: false,
    };
  }

  const extension = getMediaUploadFileExtension(file.name);
  if (!allowedExtensionSet.has(extension)) {
    return {
      code: "extension",
      extension,
      message: getMediaUploadExtensionMessage(extension),
      ok: false,
    };
  }

  if (!file.type.startsWith("image/")) {
    return {
      code: "mime",
      message: "Please choose an image file.",
      ok: false,
    };
  }

  return { ok: true };
}
