import { fetchRecentFlights } from "@/lib/newsky"
import clientPromise from "@/lib/mongo"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const client = await clientPromise
    const db = client.db()
    const flightsCol = db.collection("flights")

    const data = await fetchRecentFlights({ count: 5 })

    const inserted = await flightsCol.insertMany(
      data.results.map((f: any) => ({
        ...f,
        addedAt: new Date()
      }))
    )

    return NextResponse.json({
      ok: true,
      inserted: inserted.insertedCount
    })
  } catch (e) {
    console.error("SYNC ERROR:", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
