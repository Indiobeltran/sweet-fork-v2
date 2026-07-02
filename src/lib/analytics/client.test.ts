import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { buildAnalyticsEventPayload, getGoogleAnalyticsInitScript, trackAnalyticsPageViewForRuntime } from "./events.ts";

type GtagCall = [string, string | Date, Record<string, unknown>?];

type TestWindow = {
  __sweetForkAnalytics?: { lastPageViewKey?: string };
  gtag?: (...args: GtagCall) => void;
  location: {
    hostname: string;
    origin: string;
  };
};

type TestDocument = {
  title: string;
};

function installBrowserGlobals({
  hostname = "thesweetfork.com",
  origin = "https://thesweetfork.com",
  title = "The Sweet Fork",
}: {
  hostname?: string;
  origin?: string;
  title?: string;
} = {}) {
  const calls: GtagCall[] = [];
  const window: TestWindow = {
    gtag: (...args) => calls.push(args),
    location: { hostname, origin },
  };
  const document: TestDocument = { title };

  Object.assign(globalThis, { window, document });

  return { calls, window };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
});

describe("analytics page view tracking", () => {
  it("sends one explicit page_view for the initial eligible route", () => {
    const { calls } = installBrowserGlobals({
      title: "Custom Cakes & Desserts in Centerville, Utah | The Sweet Fork",
    });

    assert.equal(
      trackAnalyticsPageViewForRuntime({
        hostname: "thesweetfork.com",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/",
      }),
      true,
    );

    assert.deepEqual(calls, [
      [
        "event",
        "page_view",
        {
          page_location: "https://thesweetfork.com/",
          page_path: "/",
          page_title: "Custom Cakes & Desserts in Centerville, Utah | The Sweet Fork",
          send_to: "G-3FG4VD58VP",
        },
      ],
    ]);
  });

  it("does not duplicate a page_view for a rerender of the same route", () => {
    const { calls } = installBrowserGlobals();

    trackAnalyticsPageViewForRuntime({
      hostname: "thesweetfork.com",
      measurementId: "G-3FG4VD58VP",
      nodeEnv: "production",
      pathname: "/gallery",
    });
    trackAnalyticsPageViewForRuntime({
      hostname: "thesweetfork.com",
      measurementId: "G-3FG4VD58VP",
      nodeEnv: "production",
      pathname: "/gallery",
    });

    assert.equal(calls.length, 1);
  });

  it("tracks app navigation, browser back, and browser forward as the path changes", () => {
    const { calls } = installBrowserGlobals();
    const base = {
      hostname: "thesweetfork.com",
      measurementId: "G-3FG4VD58VP",
      nodeEnv: "production",
    };

    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/" });
    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/gallery" });
    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/" });
    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/gallery" });

    assert.deepEqual(
      calls.map(([, eventName, params]) => [eventName, params?.page_path]),
      [
        ["page_view", "/"],
        ["page_view", "/gallery"],
        ["page_view", "/"],
        ["page_view", "/gallery"],
      ],
    );
  });

  it("strips query strings from page views and dedupes query-only changes", () => {
    const { calls } = installBrowserGlobals();
    const base = {
      hostname: "thesweetfork.com",
      measurementId: "G-3FG4VD58VP",
      nodeEnv: "production",
    };

    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/gallery?filter=sugar-cookies" });
    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/gallery?customer_email=a@example.com" });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][2]?.page_path, "/gallery");
    assert.equal(calls[0][2]?.page_location, "https://thesweetfork.com/gallery");
  });

  it("does not create a page_view for hash-only navigation", () => {
    const { calls } = installBrowserGlobals();
    const base = {
      hostname: "thesweetfork.com",
      measurementId: "G-3FG4VD58VP",
      nodeEnv: "production",
    };

    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/faq" });
    trackAnalyticsPageViewForRuntime({ ...base, pathname: "/faq#pricing" });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][2]?.page_path, "/faq");
  });

  it("does not track admin, localhost, Netlify hosts, or missing measurement IDs", () => {
    const { calls } = installBrowserGlobals();

    for (const input of [
      {
        hostname: "thesweetfork.com",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/admin/login",
      },
      {
        hostname: "localhost",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/",
      },
      {
        hostname: "main--sweet-fork-v2.netlify.app",
        measurementId: "G-3FG4VD58VP",
        nodeEnv: "production",
        pathname: "/",
      },
      {
        hostname: "thesweetfork.com",
        measurementId: "",
        nodeEnv: "production",
        pathname: "/",
      },
    ]) {
      assert.equal(trackAnalyticsPageViewForRuntime(input), false);
    }

    assert.equal(calls.length, 0);
  });
});

describe("analytics initialization and custom events", () => {
  it("keeps GA4 initialization to one config call with automatic page_view disabled", () => {
    const script = getGoogleAnalyticsInitScript("G-3FG4VD58VP");

    assert.equal((script.match(/gtag\('config'/g) ?? []).length, 1);
    assert.match(script, /send_page_view:\s*false/);
    assert.doesNotMatch(script, /gtag\('event',\s*'page_view'/);
  });

  it("keeps custom analytics events protected by the allowlist", () => {
    const payload = buildAnalyticsEventPayload("faq_opened", {
      page_path: "/faq",
      customer_email: "customer@example.com",
    } as never);

    assert.deepEqual(payload, {
      eventName: "faq_opened",
      params: {
        page_path: "/faq",
      },
    });
  });
});
