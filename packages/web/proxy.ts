import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Route → required roles mapping
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["superadmin"],
  "/org": ["orgadmin"],
  "/driver": ["driver"],
  "/account": ["client", "superadmin", "orgadmin"],
};

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Strip locale prefix to get the route path (e.g., /en/admin → /admin)
  const pathWithoutLocale = pathname.replace(/^\/(en|el)/, "") || "/";

  // Check if this is a protected route
  const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathWithoutLocale.startsWith(route)
  );

  if (matchedRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Not authenticated → redirect to sign-in
    if (!token) {
      const locale = pathname.match(/^\/(en|el)/)?.[1] || "en";
      const signInUrl = new URL(`/${locale}/auth/signin`, req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Authenticated but wrong role → redirect to home
    const allowedRoles = PROTECTED_ROUTES[matchedRoute];
    if (!allowedRoles.includes(token.role)) {
      const locale = pathname.match(/^\/(en|el)/)?.[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  // Run i18n middleware for all requests
  return intlMiddleware(req);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
