// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  // Redirect to the root page where login is located
  const redirectUrl = "/";
  
  // Get the cookie store
  const cookieStore = cookies();
  
  // Clear both cookies using the direct cookie API
  (await cookieStore).set("session", "", { 
    maxAge: 0, 
    path: "/",
  });
  
  (await cookieStore).set("logged_in", "", { 
    maxAge: 0, 
    path: "/",
    httpOnly: false,
  });

  console.log("Logout: Cleared all cookies");
  
  // Create response with redirect
  const response = NextResponse.redirect(new URL(redirectUrl, req.url));
  
  // Also clear cookies on the response object for redundancy
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  response.cookies.set("logged_in", "", { maxAge: 0, path: "/" });
  
  return response;
}
