"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function SiteRouteScrollRestoration() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;

    if (window.location.hash) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ left: 0, top: 0 });
    });
  }, [pathname]);

  return null;
}
