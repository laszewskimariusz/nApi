// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const resend = new Resend(process.env.RESEND_API_KEY);
const mongo = new MongoClient(process.env.MONGODB_URI!);

const saltRounds = 10;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  try {
    await mongo.connect();
    const db = mongo.db();
    const users = db.collection("users");

    const exists = await users.findOne({ email });
    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const activationCode = Math.random().toString(36).substring(2, 12);

    await users.insertOne({
      email,
      password: hashedPassword,
      activated: false,
      activationCode,
      admin: false, // domyślnie false
    });

    await resend.emails.send({
      from: "napi@topsky.app",
      to: email,
      subject: "Aktywacja konta nApi",
      html: `<p>Aktywuj swoje konto klikając poniższy link:</p>
             <a href="https://napi.topsky.app/api/auth/activate?code=${activationCode}">Aktywuj</a>`
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
