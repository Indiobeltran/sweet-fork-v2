import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { clampPageToRange } from "./pagination.ts";

describe("clampPageToRange", () => {
  it("keeps pages inside the available range", () => {
    assert.equal(clampPageToRange(1, 4, 2), 1);
    assert.equal(clampPageToRange(2, 4, 2), 2);
  });

  it("clamps out-of-range pages to the last available page", () => {
    assert.equal(clampPageToRange(8, 4, 2), 2);
  });

  it("uses page 1 when no rows are available", () => {
    assert.equal(clampPageToRange(8, 0, 2), 1);
  });
});
