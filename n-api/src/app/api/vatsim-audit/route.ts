import { connectToDB } from "@/lib/mongo";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  const startIso = `${start}T00:00:00.000Z`;
  const endIso = `${end}T23:59:59.999Z`;

  const db = await connectToDB();

  const query = {
    "network.name": "vatsim",
    "network.ratio": { $gte: 0.999 },
    createdAt: {
      $gte: startIso,
      $lte: endIso,
    },
  };

  console.log("✅ FINAL VATSIM QUERY");
  console.log("Start:", startIso);
  console.log("End:", endIso);
  console.log("Query:", JSON.stringify(query, null, 2));

  const results = await db
    .collection("flights")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  console.log("🛬 Found flights:", results.length);

  const formatted = results.map((flight) => {
    const depTime = flight.ofp?.depTimeAct ?? flight.createdAt;

    return {
      callsign: flight.callsign ?? `${flight.airline?.icao ?? "???"}${flight.flightNumber ?? ""}`,
      dep: flight.dep?.icao ?? "???",
      arr: flight.arr?.icao ?? "???",
      time: depTime
        ? new Date(depTime).toISOString().slice(0, 16).replace("T", " ") + " UTC"
        : "N/A",
      pilot: flight.pilot?.fullname ?? "Unknown",
    };
  });

  return NextResponse.json({ flights: formatted });
}
