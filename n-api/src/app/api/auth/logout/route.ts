// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const redirectUrl = "https://napi.topsky.app/login";

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}
