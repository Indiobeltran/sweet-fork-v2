import Link from "next/link";

export function InquiryCta() {
  return (
    <section className="border-t border-charcoal/8 bg-charcoal px-5 py-16 text-ivory sm:px-8 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold/70">Start the conversation</p>
          <h2 className="max-w-3xl text-balance font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
            Start an order inquiry for the cake, treats, or dessert details you have in mind.
          </h2>
        </div>
        <div className="space-y-4">
          <p className="max-w-xl text-sm leading-7 text-ivory/72">
            Share the event, servings, pickup or delivery needs, and any inspiration you have.
            The Sweet Fork usually replies with a detailed quote within 24 to 48 hours.
          </p>
          <Link
            href="/start-order"
            className="inline-flex h-12 items-center rounded-full bg-ivory px-5 text-sm font-medium text-charcoal transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
          >
            Start Order
          </Link>
        </div>
      </div>
    </section>
  );
}
