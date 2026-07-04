import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { addBusinessDateDays, BUSINESS_TIME_ZONE, getBusinessDateKey, getBusinessDayUtcRange, getBusinessMonthKey } from "./business-time.ts";

describe("business timezone helpers", () => {
  it("uses America/Denver as the bakery business timezone", () => {
    assert.equal(BUSINESS_TIME_ZONE, "America/Denver");
  });

  it("keeps late Mountain Time before midnight on the same business date during MDT", () => {
    const observedDashboardTime = new Date("2026-07-04T05:03:00.000Z");

    assert.equal(getBusinessDateKey(observedDashboardTime), "2026-07-03");
    assert.equal(getBusinessMonthKey(observedDashboardTime), "2026-07");
  });

  it("rolls to the next business date at Mountain Time midnight during MDT", () => {
    const mountainMidnight = new Date("2026-07-04T06:00:00.000Z");

    assert.equal(getBusinessDateKey(mountainMidnight), "2026-07-04");
  });

  it("handles Mountain Standard Time without a fixed UTC offset", () => {
    const beforeWinterMidnight = new Date("2026-12-13T06:59:00.000Z");
    const winterMidnight = new Date("2026-12-13T07:00:00.000Z");

    assert.equal(getBusinessDateKey(beforeWinterMidnight), "2026-12-12");
    assert.equal(getBusinessDateKey(winterMidnight), "2026-12-13");
  });

  it("adds calendar days to business date keys without timestamp offset drift", () => {
    assert.equal(addBusinessDateDays("2026-07-03", 7), "2026-07-10");
    assert.equal(addBusinessDateDays("2026-12-31", 1), "2027-01-01");
  });

  it("converts business-day timestamp boundaries to UTC across MDT and MST", () => {
    assert.deepEqual(getBusinessDayUtcRange("2026-07-03"), {
      endIso: "2026-07-04T05:59:59.999Z",
      startIso: "2026-07-03T06:00:00.000Z",
    });
    assert.deepEqual(getBusinessDayUtcRange("2026-12-13"), {
      endIso: "2026-12-14T06:59:59.999Z",
      startIso: "2026-12-13T07:00:00.000Z",
    });
  });
});
