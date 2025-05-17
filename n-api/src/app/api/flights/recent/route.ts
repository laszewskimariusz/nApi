import clientPromise from "@/lib/mongo"
import { NextResponse } from "next/server"

export async function GET() {
  const client = await clientPromise
  const db = client.db()
  const flights = await db
    .collection("flights")
    .find({})
    .sort({ addedAt: -1 })
    .limit(5)
    .toArray()

  const formatted = flights.map(f => ({
    departure: f.departure || f.departureIcao || "-",
    arrival: f.arrival || f.arrivalIcao || "-",
    aircraft: f.airframe || f.aircraft || "N/A",
    pilot: f.pilotName || "Unknown"
  }))

  return NextResponse.json({ flights: formatted })
}
