import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    // Sprawdź autoryzację
    const loggedInCookie = req.cookies.get("logged_in")?.value;
    const isLoggedIn = loggedInCookie === "true";
    
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Połącz z bazą danych
    const MONGO_URI = process.env.MONGODB_URI!;
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db();
    const flightsCollection = db.collection("flights");
    
    // Pobierz ostatnie 30 lotów, posortowane według daty importu (malejąco)
    const flights = await flightsCollection
      .find({})
      .sort({ importedAt: -1 })
      .limit(30)
      .toArray();
    
    await client.close();
    
    return NextResponse.json({ 
      flights,
      count: flights.length
    });
    
  } catch (error) {
    console.error("Error fetching recent flights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
