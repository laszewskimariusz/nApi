// src/app/api/auth/login/route.ts
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

    const cookieStore = cookies();
    (await cookieStore).set("session", email, { httpOnly: true });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
