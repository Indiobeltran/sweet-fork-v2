import { ChevronDown } from "lucide-react";

type AdminSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function AdminSectionCard({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
}: Readonly<AdminSectionCardProps>) {
  if (collapsible) {
    return (
      <details
        open={defaultOpen}
        className="group rounded-[1.75rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft sm:p-5"
      >
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <div className="space-y-2">
            <h2 className="font-serif text-[2rem] tracking-[-0.04em] text-charcoal sm:text-[2.1rem]">
              {title}
            </h2>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-charcoal/64">{description}</p>
            ) : null}
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-charcoal/10 bg-white/82 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/60 transition group-open:bg-charcoal group-open:text-ivory">
            <span className="hidden sm:inline">Toggle</span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>

        <div className="mt-4">{children}</div>
      </details>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft sm:p-5">
      <div className="space-y-2">
        <h2 className="font-serif text-[2rem] tracking-[-0.04em] text-charcoal sm:text-[2.1rem]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-charcoal/64">{description}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
