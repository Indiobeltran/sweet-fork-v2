import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function isPreviewOrTemporaryHost(hostname: string) {
  return (
    hostname.endsWith(".netlify.app") ||
    hostname.endsWith(".vercel.app") ||
    hostname.includes("--")
  );
}

function getRequestHostname(request: NextRequest) {
  return (request.headers.get("host") ?? request.nextUrl.hostname)
    .split(":")[0]
    .toLowerCase();
}

function retiredUrlMiddlewareResponse() {
  return new NextResponse("This legacy URL has been retired.", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
    status: 410,
  });
}

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/category/" ||
    request.nextUrl.pathname === "/product/"
  ) {
    return retiredUrlMiddlewareResponse();
  }

  if (request.nextUrl.pathname.length > 1 && request.nextUrl.pathname.endsWith("/")) {
    const url = new URL(request.url);
    url.pathname = url.pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url, 308);
  }

  const response = request.nextUrl.pathname.startsWith("/admin")
    ? await updateSession(request)
    : NextResponse.next({ request });

  if (isPreviewOrTemporaryHost(getRequestHostname(request))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|placeholders/).*)"],
};
