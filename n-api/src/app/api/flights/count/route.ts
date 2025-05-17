import clientPromise from "@/lib/mongo"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    const count = await db.collection("flights").countDocuments()

    return NextResponse.json({ count })
  } catch (error) {
    console.error("❌ Error in /api/flights/count:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    )
  }
}
