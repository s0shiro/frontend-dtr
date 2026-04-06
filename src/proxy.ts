import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = new Set(["/login", "/signup"]);

function isProtectedPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/history");
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get("cookie");

  if (!cookie) {
    return false;
  }

  try {
    const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json().catch(() => null);
    return Boolean(data?.user || data?.session);
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  console.log("PROXY IS RUNNING for:", request.nextUrl.pathname);
  const { pathname } = request.nextUrl;
  const authenticated = await isAuthenticated(request);

  if (authenticated && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!authenticated && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Keep Next matcher config statically analyzable.
export const config = {
  matcher: ["/", "/login", "/signup", "/history/:path*"],
};
