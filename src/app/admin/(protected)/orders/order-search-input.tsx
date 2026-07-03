"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

type OrderSearchInputProps = {
  defaultValue: string;
};

export function OrderSearchInput({ defaultValue }: Readonly<OrderSearchInputProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const trimmedValue = value.trim();

      if (trimmedValue) {
        nextParams.set("search", trimmedValue);
      } else {
        nextParams.delete("search");
      }

      if (nextParams.toString() === searchParams.toString()) {
        return;
      }

      const queryString = nextParams.toString();
      const nextHref = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(nextHref, { scroll: false });
      });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, router, searchParams, value, startTransition]);

  return (
    <label className="flex min-h-11 w-full items-center gap-2 rounded-full border border-charcoal/10 bg-white/88 px-3.5 text-sm text-charcoal shadow-sm focus-within:border-gold/45 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold/35">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-charcoal/45" />
      <span className="sr-only">Search orders</span>
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search name, occasion, order #"
        className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:outline-none"
      />
    </label>
  );
}
