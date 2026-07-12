"use client";

import { useEffect } from "react";

type NoticeCopy = {
  className: string;
  text: string;
};

type AdminNoticeBannerProps = {
  notice: string | undefined;
  notices: Record<string, NoticeCopy>;
};

export function AdminNoticeBanner({
  notice,
  notices,
}: Readonly<AdminNoticeBannerProps>) {
  // The banner is rendered from the server-provided `notice` search param, but
  // that param should not survive a refresh or bookmark, or the same success/
  // error message would reappear out of context. Strip it from the URL after
  // the initial render; the already-rendered banner stays visible this visit.
  useEffect(() => {
    if (!notice || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);

    if (url.searchParams.has("notice")) {
      url.searchParams.delete("notice");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }, [notice]);

  if (!notice) {
    return null;
  }

  const copy = notices[notice];

  if (!copy) {
    return null;
  }

  return (
    <div
      className={`rounded-[1.6rem] border px-4 py-3 text-sm font-medium ${copy.className}`}
      role="status"
      aria-live="polite"
    >
      {copy.text}
    </div>
  );
}
