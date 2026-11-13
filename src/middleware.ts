import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname === "/auth/login") {
    const token = req.cookies.get("pw_session")?.value;
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  const protectedRoutes = ["/", "/customers", "/billing", "/reports"];
  const isProtected = protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isProtected) {
    const token = req.cookies.get("pw_session")?.value;
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
