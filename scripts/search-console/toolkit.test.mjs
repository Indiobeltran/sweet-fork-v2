import assert from "node:assert/strict";
import test from "node:test";

import { validateInspectionUrl } from "./url-inspection.mjs";

test("accepts URLs inside a domain Search Console property", () => {
  assert.equal(
    validateInspectionUrl(
      "sc-domain:example.com",
      "https://www.example.com/start-order",
    ),
    "https://www.example.com/start-order",
  );
  assert.throws(
    () =>
      validateInspectionUrl(
        "sc-domain:example.com",
        "https://example.net/start-order",
      ),
    /does not belong/,
  );
});

test("enforces HTTPS and URL-prefix boundaries", () => {
  assert.throws(
    () =>
      validateInspectionUrl(
        "sc-domain:example.com",
        "http://example.com/start-order",
      ),
    /must use HTTPS/,
  );
  assert.equal(
    validateInspectionUrl(
      "https://www.example.com/",
      "https://www.example.com/start-order",
    ),
    "https://www.example.com/start-order",
  );
  assert.throws(
    () =>
      validateInspectionUrl(
        "https://www.example.com/",
        "https://www.example.com.evil.invalid/",
      ),
    /does not belong/,
  );
});
