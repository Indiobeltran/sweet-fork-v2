import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getAdminPageMeta } from "./navigation.ts";

describe("admin page metadata", () => {
  it("names the manual order creation route without treating it as an order detail", () => {
    assert.deepEqual(getAdminPageMeta("/admin/orders/new"), {
      activePrimaryKey: "orders",
      key: "orders",
      title: "Add manual order",
    });
  });
});
