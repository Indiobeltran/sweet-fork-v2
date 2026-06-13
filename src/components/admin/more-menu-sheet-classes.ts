type MoreMenuVisibilityOptions = {
  desktopOnly?: boolean;
  mobileOnly?: boolean;
};

export function getMoreMenuBackdropClassName({
  desktopOnly = false,
  mobileOnly = false,
}: MoreMenuVisibilityOptions = {}) {
  return [
    "fixed inset-0 z-[60] bg-charcoal/14 backdrop-blur-[1px]",
    mobileOnly ? "md:hidden" : "",
    desktopOnly ? "hidden md:block" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
