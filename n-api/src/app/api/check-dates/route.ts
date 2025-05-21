import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const flightsCol = db.collection("flights");
    
    // Sprawdź całkowitą liczbę lotów
    const totalFlights = await flightsCol.countDocuments();
    
    // Sprawdź, ile lotów ma pole addedAt
    const withAddedAt = await flightsCol.countDocuments({ addedAt: { $exists: true } });
    
    // Sprawdź, ile lotów ma pole createdAt
    const withCreatedAt = await flightsCol.countDocuments({ createdAt: { $exists: true } });
    
    // Pobierz przykładowy lot
    const sampleFlight = await flightsCol.findOne({});
    
    // Sprawdź wszystkie pola czasowe w przykładowym locie
    const dateFields: Record<string, any> = {};
    if (sampleFlight) {
      for (const [key, value] of Object.entries(sampleFlight)) {
        if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
          dateFields[key] = value;
        }
      }
    }
    
    // Sprawdź unikalne daty z pola addedAt
    const uniqueAddedAtDates = await flightsCol.aggregate([
      { $match: { addedAt: { $exists: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$addedAt" } } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    // Sprawdź unikalne daty z pola createdAt
    const uniqueCreatedAtDates = await flightsCol.aggregate([
      { $match: { createdAt: { $exists: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    return NextResponse.json({
      totalFlights,
      withAddedAt,
      withCreatedAt,
      sampleFlight: {
        _id: sampleFlight?._id,
        dateFields
      },
      uniqueAddedAtDates: uniqueAddedAtDates.map(d => d._id),
      uniqueCreatedAtDates: uniqueCreatedAtDates.map(d => d._id),
    });
  } catch (error) {
    console.error("Error in check-dates API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 