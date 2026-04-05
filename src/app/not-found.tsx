import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-5">
      <div className="max-w-xl rounded-[2rem] border border-charcoal/8 bg-white p-10 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal/48">Page not found</p>
        <h1 className="mt-4 font-serif text-5xl tracking-[-0.04em] text-charcoal">This page wandered off the dessert table.</h1>
        <p className="mt-4 text-base leading-8 text-charcoal/68">
          Try heading back home, opening the gallery, or starting an order inquiry from the main navigation.
        </p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-charcoal px-5 text-sm font-medium text-ivory">
          Return home
        </Link>
      </div>
    </div>
  );
}
