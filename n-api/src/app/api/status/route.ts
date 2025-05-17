import clientPromise from "@/lib/mongo"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    const collections = await db.listCollections().toArray()

    return NextResponse.json({
      ok: true,
      collections: collections.map((c) => c.name)
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
