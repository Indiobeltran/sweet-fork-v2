import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const source = await readFile(new URL("./media-library-manager.tsx", import.meta.url), "utf8");

describe("media library manager modal source", () => {
  it("keeps the edit modal above the mobile admin nav with a mobile-safe viewport", () => {
    assert.match(source, /z-\[70\]/);
    assert.match(source, /100dvh/);
    assert.match(source, /overscroll-contain/);
    assert.match(source, /WebkitOverflowScrolling/);
  });

  it("shows save state and disables saving when there are no changes", () => {
    assert.match(source, /Save Changes/);
    assert.match(source, /No changes/);
    assert.match(source, /disabled=\{!hasChanges \|\| isSavingOrDeleting\}/);
  });

  it("keeps the destructive delete action in the visible Danger Zone", () => {
    const dangerZoneIndex = source.indexOf("Danger Zone");
    const deleteActionIndex = source.indexOf("Delete Photo");

    assert.ok(dangerZoneIndex > -1);
    assert.ok(deleteActionIndex > dangerZoneIndex);
  });
});
