import { NextRequest, NextResponse } from "next/server";
import { logMessage } from "@/lib/logger";
import { connectToDB } from "@/lib/mongo";

// przykładowa funkcja — dostosuj do siebie
async function fetchFlightsForDay(date: string): Promise<any[]> {
  // tu np. zapytanie do Newsky API z daną datą
  return []; // przykładowo pusto
}

export async function POST(req: NextRequest) {
  const { startDate, endDate } = await req.json();

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  await logMessage("sync", `🚀 Rozpoczęto pełną synchronizację: ${startDate} → ${endDate}`);

  const db = await connectToDB();
  const collection = db.collection("flights");

  let inserted = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (
    let current = new Date(start);
    current <= end;
    current.setDate(current.getDate() + 1)
  ) {
    const dateStr = current.toISOString().split("T")[0];

    await logMessage("sync", `⏳ Syncing: ${dateStr}`);

    const flights = await fetchFlightsForDay(dateStr);

    await logMessage("sync", `🔍 Newsky API zwróciło: ${flights.length} wyników`);

    if (flights.length === 0) {
      await logMessage("sync", `⛔ Brak lotów dla ${dateStr}`);
      continue;
    }

    for (const flight of flights) {
      const exists = await collection.findOne({ flightId: flight.flightId });
      if (!exists) {
        await collection.insertOne(flight);
        inserted++;
      }
    }

    await logMessage("sync", `✅ Zapisano ${inserted} lotów do ${dateStr}`);
  }

  await logMessage("sync", `🎉 Synchronizacja zakończona. Nowych rekordów: ${inserted}`);

  return NextResponse.json({ inserted });
}
