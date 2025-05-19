import { NextResponse } from "next/server";
import { fetchFlightsByDate } from "@/lib/newsky";

export async function GET() {
  try {
    const dayStart = new Date("2022-11-01T00:00:00Z");
    const dayEnd = new Date("2022-11-30T23:59:59Z");

    // fetchFlightsByDate powinno zwracać obiekt { results: [], totalResults: number }
    const result = await fetchFlightsByDate(dayStart, dayEnd, 0);

    return NextResponse.json({
      ok: true,
      totalResults: result.totalResults ?? 0,
      resultsCount: Array.isArray(result.results) ? result.results.length : 0,
      data: result.results ?? []
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
