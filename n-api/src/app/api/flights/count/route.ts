import clientPromise from "@/lib/mongo"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    const count = await db.collection("flights").countDocuments()

    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch flight count", message: String(error) }, { status: 500 })
  }
}
