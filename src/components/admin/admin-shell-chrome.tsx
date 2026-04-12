"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Ellipsis,
  FileText,
  FolderKanban,
  ShoppingBag,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { AdminAppBar } from "@/components/admin/admin-app-bar";
import { MobileBottomNav } from "@/components/admin/mobile-bottom-nav";
import { MoreMenuSheet, type MoreMenuSheetGroup } from "@/components/admin/more-menu-sheet";
import {
  ADMIN_HOME_HREF,
  ADMIN_PRIMARY_NAV_ITEMS,
  getAdminMoreGroups,
  getAdminPageMeta,
  isAdminHrefActive,
  type AdminPrimaryNavKey,
} from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

type AdminShellChromeProps = {
  accountMenu: ReactNode;
  children: ReactNode;
  quickAction?: ReactNode;
};

const PRIMARY_ICON_BY_KEY: Record<AdminPrimaryNavKey, typeof FileText> = {
  calendar: CalendarDays,
  customers: Users,
  inquiries: FileText,
  orders: ShoppingBag,
};

const baseMoreGroups = getAdminMoreGroups();

export function AdminShellChrome({
  accountMenu,
  children,
  quickAction,
}: Readonly<AdminShellChromeProps>) {
  const pathname = usePathname() ?? ADMIN_HOME_HREF;
  const pageMeta = getAdminPageMeta(pathname);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreGroups: MoreMenuSheetGroup[] = baseMoreGroups.map((group) => ({
    label: group.group,
    items: group.items.map((item) => ({
      href: item.href,
      isActive: isAdminHrefActive(pathname, item.href),
      label: item.label,
    })),
  }));

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMoreOpen]);

  return (
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-2 sm:pt-3 md:pb-8">
      <div className="section-shell relative z-50">
        <AdminAppBar
          accountMenu={accountMenu}
          quickAction={quickAction}
          title={pageMeta.title}
          secondaryContent={
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                {ADMIN_PRIMARY_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pageMeta.activePrimaryKey === item.key ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
                      pageMeta.activePrimaryKey === item.key
                        ? "bg-charcoal text-ivory shadow-soft"
                        : "text-charcoal/64 hover:bg-white hover:text-charcoal",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="relative ml-auto">
                  <button
                    type="button"
                    aria-expanded={isMoreOpen}
                    aria-haspopup="dialog"
                    aria-label={
                      pageMeta.activePrimaryKey === "more" ? "More, current section" : "More"
                    }
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
                      pageMeta.activePrimaryKey === "more" || isMoreOpen
                        ? "border-charcoal/16 bg-charcoal text-ivory shadow-soft"
                        : "border-charcoal/10 bg-white/76 text-charcoal/68 hover:border-charcoal/20 hover:bg-white hover:text-charcoal",
                    )}
                    onClick={() => setIsMoreOpen((currentValue) => !currentValue)}
                  >
                    <span>More</span>
                    <Ellipsis aria-hidden="true" className="h-4 w-4" />
                  </button>

                  <MoreMenuSheet
                    desktopOnly
                    groups={moreGroups}
                    open={isMoreOpen}
                    onOpenChange={setIsMoreOpen}
                    showBackdrop={false}
                  />
                </div>
              </div>
            </div>
          }
        />

        <div className="pt-4">{children}</div>
      </div>

      <MoreMenuSheet
        groups={moreGroups}
        mobileOnly
        open={isMoreOpen}
        onOpenChange={setIsMoreOpen}
      />

      <MobileBottomNav
        items={ADMIN_PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = PRIMARY_ICON_BY_KEY[item.key];

          return {
            href: item.href,
            icon: <Icon className="h-[1.05rem] w-[1.05rem]" />,
            isActive: pageMeta.activePrimaryKey === item.key,
            label: item.label,
          };
        })}
        moreActive={pageMeta.activePrimaryKey === "more"}
        moreIcon={<FolderKanban className="h-[1.05rem] w-[1.05rem]" />}
        moreOpen={isMoreOpen}
        onMoreClick={() => setIsMoreOpen((currentValue) => !currentValue)}
      />
    </div>
  );
}
