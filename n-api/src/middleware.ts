import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/dashboard/autofetcher", "/dashboard/fullSync"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sprawdź, czy ścieżka wymaga uwierzytelnienia
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    // Sprawdź cookie sesji
    const session = req.cookies.get("session");

    if (!session) {
      // Przekieruj na stronę logowania (stronę główną)
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Pozwól na kontynuację, jeśli jest sesja lub ścieżka nie jest chroniona
  return NextResponse.next();
}

// Definiujemy, dla jakich ścieżek middleware ma działać
export const config = {
  matcher: ["/dashboard/:path*"],
};
