import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const source = await readFile(new URL("./admin-shell-chrome.tsx", import.meta.url), "utf8");

describe("admin shell route loading feedback source", () => {
  it("tracks pending admin navigation and clears it after route changes", () => {
    assert.match(source, /const \[pendingHref, setPendingHref\]/);
    assert.match(source, /setPendingHref\(null\)/);
    assert.match(source, /\[pathname, searchParams\]/);
  });

  it("shows immediate loading feedback for admin navigation links", () => {
    assert.match(source, /aria-label="Loading admin page"/);
    assert.match(source, /pendingHref === item\.href/);
    assert.match(source, /Opening/);
  });
});
