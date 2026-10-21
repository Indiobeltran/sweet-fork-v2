import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { MAX_PENDING_ANALYTICS_EVENTS, consumeInquiryStepViewed, createInquiryAnalyticsSession, emitGenerateLeadAfterPersistence, flushAnalyticsEventsForRuntime, trackAnalyticsEventForRuntime, buildAnalyticsEventPayload, getGoogleAnalyticsInitScript, trackAnalyticsPageViewForRuntime } from "./events.ts";

type GtagCall = [string, string | Date, Record<string, unknown>?];

type TestWindow = {
  __sweetForkAnalytics?: Window["__sweetForkAnalytics"];
  gtag?: (...args: GtagCall) => void;
  location: {
    hostname: string;
    origin: string;
    pathname: string;
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
    location: { hostname, origin, pathname: "/" },
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


describe("bounded custom analytics event queue", () => {
  const runtime = {
    hostname: "thesweetfork.com",
    measurementId: "G-3FG4VD58VP",
    nodeEnv: "production",
    pathname: "/start-order",
  };

  it("queues sanitized direct-landing events and flushes them once in FIFO order", () => {
    const { calls, window } = installBrowserGlobals();
    const gtag = window.gtag;
    delete window.gtag;
    const params = {
      page_path: "/custom-cakes?customer_email=private@example.com#private",
      product_category: "custom_cakes",
      customer_email: "private@example.com",
      selected_product_count: Number.NaN,
    };
    assert.equal(trackAnalyticsEventForRuntime(runtime, "product_viewed", params), true);
    params.product_category = "changed_after_queueing";
    assert.equal(trackAnalyticsEventForRuntime(runtime, "inquiry_step_viewed", {
      page_path: "/start-order", step_id: "event_details",
    }), true);
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
    assert.deepEqual(calls, []);
    assert.equal(JSON.stringify(window.__sweetForkAnalytics).includes("private"), false);

    window.gtag = gtag;
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 2);
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
    assert.deepEqual(calls, [
      ["event", "product_viewed", {
        page_path: "/custom-cakes", product_category: "custom_cakes",
        page_location: "https://thesweetfork.com/custom-cakes", send_to: runtime.measurementId,
      }],
      ["event", "inquiry_step_viewed", {
        page_path: "/start-order", step_id: "event_details",
        page_location: "https://thesweetfork.com/start-order", send_to: runtime.measurementId,
      }],
    ]);
  });

  it("preserves sanitized source locations when events flush after navigation", () => {
    const { calls, window } = installBrowserGlobals();
    const gtag = window.gtag;
    delete window.gtag;
    const sourceRuntime = { ...runtime, pathname: "/custom-cakes?private=value#private" };
    assert.equal(trackAnalyticsEventForRuntime(sourceRuntime, "product_viewed", {
      page_path: "/custom-cakes?customer_email=private@example.com#private",
      page_location: "https://untrusted.example/private",
    } as never), true);
    // A caller without page_path still inherits its acceptance-time route.
    assert.equal(trackAnalyticsEventForRuntime(sourceRuntime, "product_cta_clicked"), true);

    window.location.pathname = "/pricing";
    window.gtag = gtag;
    assert.equal(flushAnalyticsEventsForRuntime({ ...runtime, pathname: "/pricing" }), 2);
    assert.deepEqual(calls.map((call) => call[2]?.page_location), [
      "https://thesweetfork.com/custom-cakes",
      "https://thesweetfork.com/custom-cakes",
    ]);
    assert.equal(JSON.stringify(calls).includes("private"), false);
    assert.equal(JSON.stringify(calls).includes("untrusted"), false);
    assert.equal(calls.every((call) => call[2]?.send_to === runtime.measurementId), true);

    trackAnalyticsEventForRuntime({ ...runtime, pathname: "/pricing?private=value#private" }, "pricing_section_viewed");
    assert.equal(calls.at(-1)?.[2]?.page_location, "https://thesweetfork.com/pricing");
  });

  it("preserves queued ordering if a new interaction arrives before the readiness callback", () => {
    const { calls, window } = installBrowserGlobals();
    const gtag = window.gtag;
    delete window.gtag;
    trackAnalyticsEventForRuntime(runtime, "product_viewed");
    window.gtag = gtag;
    assert.equal(trackAnalyticsEventForRuntime(runtime, "product_cta_clicked"), true);
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
    assert.deepEqual(calls.map((call) => call[1]), ["product_viewed", "product_cta_clicked"]);
  });

  it("keeps a blocked tag queue bounded without evicting accepted milestones", () => {
    const { calls, window } = installBrowserGlobals();
    const gtag = window.gtag;
    delete window.gtag;
    for (let index = 0; index < MAX_PENDING_ANALYTICS_EVENTS; index += 1) {
      assert.equal(trackAnalyticsEventForRuntime(runtime, "gallery_item_navigated", {
        gallery_position: index + 1,
      }), true);
    }
    const session = createInquiryAnalyticsSession();
    const trackStep = () => consumeInquiryStepViewed(session, "event_details", () =>
      trackAnalyticsEventForRuntime(runtime, "inquiry_step_viewed", { step_id: "event_details" }),
    );
    for (let index = 0; index < 100; index += 1) assert.equal(trackStep(), false);
    assert.equal(session.viewedStepIds.size, 0);
    assert.equal(window.__sweetForkAnalytics?.pendingEvents?.length, MAX_PENDING_ANALYTICS_EVENTS);
    window.gtag = gtag;
    assert.equal(flushAnalyticsEventsForRuntime(runtime), MAX_PENDING_ANALYTICS_EVENTS);
    assert.equal(trackStep(), true);
    assert.equal(trackStep(), false);
    assert.deepEqual(calls.slice(0, MAX_PENDING_ANALYTICS_EVENTS).map((call) => call[2]?.gallery_position),
      Array.from({ length: MAX_PENDING_ANALYTICS_EVENTS }, (_, index) => index + 1));
    assert.equal(calls.filter((call) => call[1] === "inquiry_step_viewed").length, 1);
  });

  it("rejects disabled runtimes even when another script has already installed gtag", () => {
    const { calls, window } = installBrowserGlobals();
    const inputs = [
      { ...runtime, hostname: "localhost" },
      { ...runtime, hostname: "www.thesweetfork.com" },
      { ...runtime, hostname: "sweet-fork.vercel.app" },
      { ...runtime, hostname: "branch--sweet-fork.netlify.app" },
      { ...runtime, nodeEnv: "development" },
      { ...runtime, measurementId: "" },
      { ...runtime, pathname: "/admin" },
      { ...runtime, pathname: "/admin/inquiries" },
    ];
    for (const input of inputs) {
      assert.equal(trackAnalyticsEventForRuntime(input, "product_viewed"), false);
      assert.equal(flushAnalyticsEventsForRuntime(input), 0);
    }
    assert.deepEqual(calls, []);
    assert.equal(window.__sweetForkAnalytics, undefined);
    delete window.gtag;
    for (const input of inputs) assert.equal(trackAnalyticsEventForRuntime(input, "product_viewed"), false);
    assert.equal(window.__sweetForkAnalytics, undefined);
  });

  it("discards pending events on an admin, host, or measurement-id boundary", () => {
    for (const changedRuntime of [
      { ...runtime, pathname: "/admin/inquiries" },
      { ...runtime, hostname: "branch--sweet-fork.netlify.app" },
      { ...runtime, measurementId: "G-OTHER" },
    ]) {
      const { calls, window } = installBrowserGlobals();
      const gtag = window.gtag;
      delete window.gtag;
      assert.equal(trackAnalyticsEventForRuntime(runtime, "product_viewed"), true);
      window.gtag = gtag;
      assert.equal(flushAnalyticsEventsForRuntime(changedRuntime), 0);
      assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
      assert.deepEqual(calls, []);
    }
  });

  it("does not replay throwing dispatches or interrupt subsequent events", () => {
    const { window } = installBrowserGlobals();
    delete window.gtag;
    trackAnalyticsEventForRuntime(runtime, "product_viewed");
    trackAnalyticsEventForRuntime(runtime, "inquiry_step_viewed");
    let attempted = 0;
    window.gtag = () => { attempted += 1; throw new Error("blocked tag"); };
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
    assert.equal(attempted, 2);
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
    assert.equal(attempted, 2);
    assert.equal(trackAnalyticsEventForRuntime(runtime, "inquiry_started"), false);
  });

  it("consumes the initial step and persisted lead only after acceptance and never twice", () => {
    const { calls, window } = installBrowserGlobals();
    const gtag = window.gtag;
    delete window.gtag;
    const session = createInquiryAnalyticsSession();
    const trackStep = () => consumeInquiryStepViewed(session, "event_details", () =>
      trackAnalyticsEventForRuntime(runtime, "inquiry_step_viewed", { step_id: "event_details" }),
    );
    const trackLead = () => emitGenerateLeadAfterPersistence({
      confirmation: { persisted: true, inquiryId: "private-id", referenceCode: "private-code" },
      session,
      params: { product_category: "custom_cakes" },
      emit: (name, params) => trackAnalyticsEventForRuntime(runtime, name, params),
    });
    assert.equal(trackStep(), true);
    assert.equal(trackStep(), false);
    assert.equal(trackLead(), true);
    assert.equal(trackLead(), false);
    window.gtag = gtag;
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 2);
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
    assert.equal(trackLead(), false);
    assert.equal(JSON.stringify(calls).includes("private"), false);
    assert.deepEqual(calls.map((call) => call[1]), ["inquiry_step_viewed", "generate_lead"]);
  });

  it("never accepts page_view through the custom-event queue and is inert during SSR", () => {
    const { window } = installBrowserGlobals();
    delete window.gtag;
    assert.equal(trackAnalyticsEventForRuntime(runtime, "page_view" as never), false);
    assert.equal(window.__sweetForkAnalytics?.pendingEvents?.length, 0);
    Reflect.deleteProperty(globalThis, "window");
    assert.equal(trackAnalyticsEventForRuntime(runtime, "product_viewed"), false);
    assert.equal(flushAnalyticsEventsForRuntime(runtime), 0);
  });
});
