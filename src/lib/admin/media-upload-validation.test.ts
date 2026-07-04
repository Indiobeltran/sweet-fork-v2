import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { validateMediaUploadFile } from "./media-upload-validation.ts";

describe("validateMediaUploadFile", () => {
  it("accepts supported image files under 10 MB", () => {
    const result = validateMediaUploadFile({
      name: "cake.png",
      size: 1024,
      type: "image/png",
    });

    assert.equal(result.ok, true);
  });

  it("rejects oversized files with a specific message", () => {
    const result = validateMediaUploadFile({
      name: "cake.png",
      size: 10 * 1024 * 1024 + 1,
      type: "image/png",
    });

    assert.equal(result.ok, false);
    assert.equal(result.message, "File too large (max 10 MB).");
  });

  it("rejects disallowed extensions with a specific message", () => {
    const result = validateMediaUploadFile({
      name: "notes.txt",
      size: 1024,
      type: "image/png",
    });

    assert.equal(result.ok, false);
    assert.equal(
      result.message,
      "File type .txt is not allowed. Allowed: .avif, .gif, .jpeg, .jpg, .png, .webp.",
    );
  });

  it("rejects text uploads by extension before falling back to generic MIME validation", () => {
    const result = validateMediaUploadFile({
      name: "notes.txt",
      size: 1024,
      type: "text/plain",
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "extension");
    assert.equal(
      result.message,
      "File type .txt is not allowed. Allowed: .avif, .gif, .jpeg, .jpg, .png, .webp.",
    );
  });
});
