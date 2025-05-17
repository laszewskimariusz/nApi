import clientPromise from "@/lib/mongo"
import { NextResponse } from "next/server"

export async function GET() {
  const client = await clientPromise
  const db = client.db()
  const count = await db.collection("flights").countDocuments()
  return NextResponse.json({ count })
}
