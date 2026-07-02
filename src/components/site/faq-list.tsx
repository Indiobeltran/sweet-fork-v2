"use client";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { PublicFaqItem } from "@/lib/site/marketing";

type FaqListProps = {
  items: PublicFaqItem[];
};

export function FaqList({ items }: FaqListProps) {
  return (
    <section className="section-shell space-y-4 py-16 md:py-20">
      {items.map((item, index) => (
        <details
          key={item.question}
          className="group luxury-panel rounded-[1.8rem] p-0"
          open={index < 3}
          onToggle={(event) => {
            if (event.currentTarget.open) {
              trackAnalyticsEvent("faq_opened", {
                page_path: "/faq",
              });
            }
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50">
            <h2 className="text-lg font-medium text-charcoal">{item.question}</h2>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-charcoal/10 text-xl leading-none text-charcoal/58 transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="px-6 pb-6 pt-0">
            <p className="max-w-3xl text-sm leading-7 text-charcoal/68">{item.answer}</p>
          </div>
        </details>
      ))}
    </section>
  );
}
