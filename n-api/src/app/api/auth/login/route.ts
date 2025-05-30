import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

const mongo = new MongoClient(process.env.MONGODB_URI!);

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  try {
    await mongo.connect();
    const db = mongo.db();
    const users = db.collection("users");
    const user = await users.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.activated) {
      return NextResponse.json({ error: "Account not activated" }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isDev = process.env.NODE_ENV !== "production";
    const cookieStore = cookies();

    // Set secure httpOnly cookie for authentication
    (await cookieStore).set("session", email, {
      httpOnly: true,
      secure: !isDev, // Only use secure in production
      path: "/",
      sameSite: "lax",
      // Remove domain settings for local development
    });

    // Set a simple non-httpOnly cookie for frontend login detection
    // Ensure minimal restrictions for client-side detection
    (await cookieStore).set("logged_in", "true", {
      httpOnly: false, // Allow JavaScript access 
      secure: false, // Allow HTTP access in development
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    });

    console.log("Login success: Setting cookies");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
