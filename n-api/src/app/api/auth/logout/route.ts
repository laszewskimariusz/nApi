// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin; // np. https://localhost:3000 lub https://twoja-domena.app

  const response = NextResponse.redirect(`${origin}/login`);
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}
