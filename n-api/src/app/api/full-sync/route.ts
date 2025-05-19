// src/app/api/full-sync/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { fetchRecentFlights } from "@/lib/newsky";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const flightsCol = db.collection("flights");

    let inserted = 0;
    let updated = 0;
    const logs: string[] = [];
    let page = 1;
    const perPage = 100;
    const from = new Date("2021-01-01").toISOString();
    const to = new Date().toISOString();

    while (true) {
      const result = await fetchRecentFlights({ count: perPage, skip: (page - 1) * perPage });
      const flights = result.results;
      if (!flights || flights.length === 0) break;

      for (const flight of flights) {
        const res = await flightsCol.updateOne(
          { _id: flight._id },
          {
            $set: { ...flight, updatedAt: new Date() },
            $setOnInsert: { addedAt: new Date() }
          },
          { upsert: true }
        );

        if (res.upsertedCount > 0) {
          inserted++;
          logs.push(`✅ Inserted flight ${flight._id}`);
        } else if (res.modifiedCount > 0) {
          updated++;
          logs.push(`🔁 Updated flight ${flight._id}`);
        } else {
          logs.push(`⏭️ Skipped flight ${flight._id}`);
        }
      }

      if (flights.length < perPage) break;
      page++;
    }

    return NextResponse.json({ ok: true, inserted, updated, skipped: logs.length - inserted - updated, logs });
  } catch (e) {
    console.error("FULL SYNC ERROR:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}