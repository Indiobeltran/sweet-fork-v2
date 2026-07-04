import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const source = await readFile(new URL("./order-delete-form.tsx", import.meta.url), "utf8");

describe("order delete form source", () => {
  it("requires typed confirmation before permanent deletion", () => {
    assert.match(source, /ORDER_DELETE_CONFIRMATION_TEXT/);
    assert.match(source, /confirmText === ORDER_DELETE_CONFIRMATION_TEXT/);
    assert.match(source, /Permanently delete order/);
    assert.match(source, /cannot be undone/);
  });

  it("identifies the record with its full UUID and safe order label", () => {
    assert.match(source, /orderId/);
    assert.match(source, /safeOrderLabel/);
    assert.match(source, /Full UUID/);
  });

  it("keeps ineligible or duplicate submissions blocked", () => {
    assert.match(source, /unavailableReason/);
    assert.match(source, /submitted/);
    assert.match(source, /pending/);
    assert.match(source, /disabled/);
  });
});
