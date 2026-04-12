export type AdminPrimaryNavKey = "inquiries" | "orders" | "calendar" | "customers";
export type AdminMoreNavGroup = "Catalog" | "Site" | "Operations" | "System";
export type AdminPageKey =
  | AdminPrimaryNavKey
  | "products"
  | "pricing"
  | "content"
  | "media"
  | "faqs"
  | "testimonials"
  | "notifications"
  | "users"
  | "settings";

export type AdminPrimaryNavItem = {
  href: string;
  key: AdminPrimaryNavKey;
  label: string;
};

export type AdminMoreNavItem = {
  group: AdminMoreNavGroup;
  href: string;
  key: Exclude<AdminPageKey, AdminPrimaryNavKey>;
  label: string;
};

export type AdminPageMeta = {
  activePrimaryKey: AdminPrimaryNavKey | "more";
  key: AdminPageKey;
  title: string;
};

export const ADMIN_HOME_HREF = "/admin/inquiries";

export const ADMIN_PRIMARY_NAV_ITEMS: AdminPrimaryNavItem[] = [
  { href: "/admin/inquiries", key: "inquiries", label: "Inquiries" },
  { href: "/admin/orders", key: "orders", label: "Orders" },
  { href: "/admin/calendar", key: "calendar", label: "Calendar" },
  { href: "/admin/customers", key: "customers", label: "Customers" },
];

export const ADMIN_MORE_NAV_ITEMS: AdminMoreNavItem[] = [
  { group: "Catalog", href: "/admin/products", key: "products", label: "Products" },
  { group: "Catalog", href: "/admin/pricing", key: "pricing", label: "Pricing" },
  { group: "Site", href: "/admin/content", key: "content", label: "Content" },
  { group: "Site", href: "/admin/media", key: "media", label: "Media" },
  { group: "Site", href: "/admin/faqs", key: "faqs", label: "FAQs" },
  { group: "Site", href: "/admin/testimonials", key: "testimonials", label: "Testimonials" },
  {
    group: "Operations",
    href: "/admin/notifications",
    key: "notifications",
    label: "Notifications",
  },
  { group: "System", href: "/admin/users", key: "users", label: "Users" },
  { group: "System", href: "/admin/settings", key: "settings", label: "Settings" },
];

const PRIMARY_TITLE_BY_KEY: Record<AdminPrimaryNavKey, string> = {
  calendar: "Calendar",
  customers: "Customers",
  inquiries: "Inquiries",
  orders: "Orders",
};

const DETAIL_ROUTE_META = [
  {
    href: "/admin/inquiries",
    key: "inquiries" as const,
    title: "Inquiry detail",
  },
  {
    href: "/admin/orders",
    key: "orders" as const,
    title: "Order detail",
  },
  {
    href: "/admin/customers",
    key: "customers" as const,
    title: "Customer detail",
  },
];

export function isAdminHrefActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminMoreGroups() {
  return ADMIN_MORE_NAV_ITEMS.reduce<Array<{ group: AdminMoreNavGroup; items: AdminMoreNavItem[] }>>(
    (groups, item) => {
      const currentGroup = groups.find((group) => group.group === item.group);

      if (currentGroup) {
        currentGroup.items.push(item);
        return groups;
      }

      groups.push({
        group: item.group,
        items: [item],
      });
      return groups;
    },
    [],
  );
}

export function getAdminPageMeta(pathname: string): AdminPageMeta {
  const normalizedPathname = pathname === "/admin" ? ADMIN_HOME_HREF : pathname;

  const detailRoute = DETAIL_ROUTE_META.find(
    (route) => normalizedPathname !== route.href && isAdminHrefActive(normalizedPathname, route.href),
  );

  if (detailRoute) {
    return {
      activePrimaryKey: detailRoute.key,
      key: detailRoute.key,
      title: detailRoute.title,
    };
  }

  const primaryRoute = ADMIN_PRIMARY_NAV_ITEMS.find((item) =>
    isAdminHrefActive(normalizedPathname, item.href),
  );

  if (primaryRoute) {
    return {
      activePrimaryKey: primaryRoute.key,
      key: primaryRoute.key,
      title: PRIMARY_TITLE_BY_KEY[primaryRoute.key],
    };
  }

  const moreRoute = ADMIN_MORE_NAV_ITEMS.find((item) =>
    isAdminHrefActive(normalizedPathname, item.href),
  );

  if (moreRoute) {
    return {
      activePrimaryKey: "more",
      key: moreRoute.key,
      title: moreRoute.label,
    };
  }

  return {
    activePrimaryKey: "inquiries",
    key: "inquiries",
    title: PRIMARY_TITLE_BY_KEY.inquiries,
  };
}
