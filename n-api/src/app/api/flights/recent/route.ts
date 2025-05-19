import clientPromise from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const flights = await db
    .collection("flights")
    .find({})
    .sort({ addedAt: -1 })
    .limit(5)
    .toArray();

  const formatted = flights.map(f => ({
    departure: f.dep?.icao || (typeof f.departure === "string" ? f.departure : "-"),
    arrival: f.arr?.icao || (typeof f.arrival === "string" ? f.arrival : "-"),
    airframe: f.airframe?.name || f.aircraft?.airframe?.name || "N/A",
    pilot: f.pilot?.fullname || f.pilotName || "Unknown",
    flightNumber: f.flightNumber || f.callsign || "N/A",
  }));

  return NextResponse.json({ flights: formatted });
}
