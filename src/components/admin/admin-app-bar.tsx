import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminAppBarProps = {
  accountMenu: ReactNode;
  brandHref?: string;
  eyebrow?: string;
  quickAction?: ReactNode;
  secondaryContent?: ReactNode;
  title: string;
};

export function AdminAppBar({
  accountMenu,
  brandHref = "/admin/inquiries",
  eyebrow = "Sweet Fork Admin",
  quickAction,
  secondaryContent,
  title,
}: Readonly<AdminAppBarProps>) {
  return (
    <header className="sticky top-2 z-50">
      <div className="overflow-visible rounded-[1.7rem] border border-charcoal/10 bg-ivory/90 shadow-[0_16px_44px_rgba(53,37,29,0.08),0_2px_10px_rgba(53,37,29,0.04)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
          <Link
            href={brandHref}
            className="inline-flex shrink-0 items-center rounded-[1.35rem] border border-charcoal/8 bg-white/76 px-3 py-2 transition hover:border-charcoal/14 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
          >
            <Image
              src="/brand/logo-dark.png"
              alt="The Sweet Fork"
              width={1024}
              height={582}
              sizes="(max-width: 640px) 88px, 104px"
              className="h-auto w-[88px] sm:w-[104px]"
              priority
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/48">
              {eyebrow}
            </p>
            <h1 className="mt-1 truncate font-serif text-[1.65rem] leading-none tracking-[-0.05em] text-charcoal sm:text-[1.9rem]">
              {title}
            </h1>
          </div>

          {quickAction ? <div className="shrink-0">{quickAction}</div> : null}

          {accountMenu}
        </div>

        {secondaryContent ? (
          <div className="border-t border-charcoal/8 px-3 py-2.5">{secondaryContent}</div>
        ) : null}
      </div>
    </header>
  );
}
