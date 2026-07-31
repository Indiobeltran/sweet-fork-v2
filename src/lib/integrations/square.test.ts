import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { moneyToCents, squareIdempotencyKey } from "./square-utils.ts";

test("moneyToCents rounds currency values deterministically", () => {
  assert.equal(moneyToCents(80), 8000);
  assert.equal(moneyToCents(19.995), 2000);
});

test("Square idempotency keys are stable and provider-safe", () => {
  const first = squareIdempotencyKey("invoice", "order-1");
  const second = squareIdempotencyKey("invoice", "order-1");
  assert.equal(first, second);
  assert.match(first, /^sf-[a-f0-9]{32}$/);
});
