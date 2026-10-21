export function observeAnalyticsVisibility(
  element: Element,
  onVisible: () => boolean,
  threshold = 0,
) {
  // At threshold 0, edge contact may notify with isIntersecting=true but no
  // visible area. A subsequent positive intersection need not notify again.
  const effectiveThreshold = Math.max(threshold, 0.001);
  let accepted = false;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (
        accepted ||
        !entry?.isIntersecting ||
        entry.intersectionRatio < effectiveThreshold ||
        entry.intersectionRect.height <= 0
      ) {
        return;
      }

      // A rejected event remains eligible on the next visibility notification.
      if (onVisible()) {
        accepted = true;
        observer.disconnect();
      }
    },
    // Count the section after it enters the viewport, even when the section is
    // much taller than the viewport. A ratio such as 0.55 is unreachable there.
    { rootMargin: "0px 0px -80px 0px", threshold: effectiveThreshold },
  );

  observer.observe(element);
  return () => observer.disconnect();
}
