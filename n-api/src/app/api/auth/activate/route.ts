// src/app/api/auth/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const mongo = new MongoClient(process.env.MONGODB_URI!);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing activation code" }, { status: 400 });
  }

  try {
    const db = mongo.db();
    const users = db.collection("users");

    const result = await users.updateOne({ activationCode: code }, { $set: { activated: true }, $unset: { activationCode: "" } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Invalid activation code" }, { status: 404 });
    }

    return NextResponse.redirect("/login");
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}