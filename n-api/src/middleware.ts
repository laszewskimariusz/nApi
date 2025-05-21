import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/dashboard/autofetcher"];
const publicPaths = ["/flights"]; // Public paths excluded from authentication

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If the path is public, allow access without authentication
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if the path requires authentication
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    // Check for either the httpOnly session cookie or the client-visible logged_in cookie
    const session = req.cookies.get("session");
    const loggedInCookie = req.cookies.get("logged_in");
    
    console.log("Middleware auth check:", { 
      path: pathname,
      hasSession: !!session,
      hasLoggedIn: !!loggedInCookie
    });

    // If neither cookie is present, redirect to login
    if (!session && !loggedInCookie) {
      console.log("Not authenticated, redirecting to home");
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Allow continuation if there's a session or the path isn't protected
  return NextResponse.next();
}

// Define which paths the middleware should run on
export const config = {
  matcher: ["/dashboard/:path*", "/flights/:path*"],
};
