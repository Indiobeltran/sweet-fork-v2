import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

// @ts-expect-error Node's strip-types runner requires the TypeScript extension.
import { observeAnalyticsVisibility } from "./visibility-analytics-observer.ts";

const originalObserver = globalThis.IntersectionObserver;

function installObserver() {
  let callback: IntersectionObserverCallback;
  let options: IntersectionObserverInit | undefined;
  const observe = mock.fn();
  const disconnect = mock.fn();
  class Observer {
    constructor(nextCallback: IntersectionObserverCallback, nextOptions?: IntersectionObserverInit) {
      callback = nextCallback;
      options = nextOptions;
    }
    observe = observe;
    disconnect = disconnect;
  }
  globalThis.IntersectionObserver = Observer as unknown as typeof IntersectionObserver;
  return {
    observe,
    disconnect,
    get options() { return options; },
    notify(isIntersecting: boolean, intersectionRatio: number, height = 100) {
      callback([
        { isIntersecting, intersectionRatio, intersectionRect: { height } } as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
    },
  };
}

afterEach(() => {
  globalThis.IntersectionObserver = originalObserver;
});

describe("pricing section visibility analytics", () => {
  it("observes the supplied section and accepts a small visible portion of a tall section", () => {
    const observer = installObserver();
    const section = {} as Element;
    const onVisible = mock.fn(() => true);
    const cleanup = observeAnalyticsVisibility(section, onVisible);
    assert.equal(observer.observe.mock.calls[0]?.arguments[0], section);
    assert.equal(observer.options?.threshold, 0.001);
    assert.equal(observer.options?.rootMargin, "0px 0px -80px 0px");
    observer.notify(false, 0);
    observer.notify(true, 0, 0);
    observer.notify(true, 0.0005, 1);
    assert.equal(onVisible.mock.callCount(), 0);
    // Unlike threshold 0, the configured positive threshold causes a real
    // browser notification when scrolling from edge contact into visible area.
    observer.notify(true, 0.001, 2);
    observer.notify(true, 0.02);
    assert.equal(onVisible.mock.callCount(), 1);
    assert.equal(observer.disconnect.mock.callCount(), 1);
    cleanup();
    assert.equal(observer.disconnect.mock.callCount(), 2);
  });

  it("does not consume the view when tracking rejects the event", () => {
    const observer = installObserver();
    let accepted = false;
    const onVisible = mock.fn(() => accepted);
    observeAnalyticsVisibility({} as Element, onVisible);
    observer.notify(true, 0.01);
    assert.equal(observer.disconnect.mock.callCount(), 0);
    accepted = true;
    observer.notify(true, 0.02);
    assert.equal(onVisible.mock.callCount(), 2);
    assert.equal(observer.disconnect.mock.callCount(), 1);
    observer.notify(true, 0.03);
    assert.equal(onVisible.mock.callCount(), 2);
  });

  it("respects an explicitly requested visibility threshold", () => {
    const observer = installObserver();
    const onVisible = mock.fn(() => true);
    observeAnalyticsVisibility({} as Element, onVisible, 0.25);
    assert.equal(observer.options?.threshold, 0.25);
    observer.notify(true, 0.1);
    assert.equal(onVisible.mock.callCount(), 0);
    observer.notify(true, 0.25);
    assert.equal(onVisible.mock.callCount(), 1);
  });
});
