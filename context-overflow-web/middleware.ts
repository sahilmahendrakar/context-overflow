import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }

  const segments = request.nextUrl.pathname.split("/");
  // pathname is /p/[slug]/... → segments = ["", "p", slug, ...]
  const slug = segments[2];

  if (slug && !payload.memberships[slug]) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/p/:slug/:path*"],
};
