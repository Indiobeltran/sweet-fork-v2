import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getMoreMenuBackdropClassName } from "./more-menu-sheet-classes.ts";

describe("more menu sheet classes", () => {
  it("keeps the mobile backdrop out of the desktop click layer", () => {
    const className = getMoreMenuBackdropClassName({ mobileOnly: true });

    assert.match(className, /\bmd:hidden\b/);
    assert.match(className, /\bfixed\b/);
    assert.ok(className.split(" ").includes("z-[60]"));
  });

  it("keeps the desktop backdrop out of the mobile click layer", () => {
    const className = getMoreMenuBackdropClassName({ desktopOnly: true });

    assert.match(className, /\bhidden\b/);
    assert.match(className, /\bmd:block\b/);
  });

  it("lets Next handle link navigation before closing the sheet", async () => {
    const source = await readFile(
      new URL("./more-menu-sheet.tsx", import.meta.url),
      "utf8",
    );

    assert.match(source, /onNavigate=\{onNavigate\}/);
    assert.doesNotMatch(source, /onClick=\{onNavigate\}/);
  });
});
