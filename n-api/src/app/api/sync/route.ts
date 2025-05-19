import { fetchRecentFlights } from "@/lib/newsky";
import clientPromise from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const flightsCol = db.collection("flights");

    const data = await fetchRecentFlights({ count: 5 });

    const inserted = await flightsCol.insertMany(
      data.results.map((f: any) => ({
        ...f,
        addedAt: new Date()
      })),
      { ordered: false } // nie przerywa na duplikatach
    );

    return NextResponse.json({
      ok: true,
      inserted: inserted.insertedCount
    });
  } catch (e: any) {
    if (e.code === 11000) {
      // duplicate key error — ignorujemy
      return NextResponse.json({
        ok: true,
        inserted: e.result?.insertedCount ?? 0,
        warning: "Some duplicates were skipped"
      });
    }

    console.error("SYNC ERROR:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
