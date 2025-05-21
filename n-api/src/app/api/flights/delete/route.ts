import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

// Endpoint do usuwania lotu z bazy danych
export async function POST(req: NextRequest) {
  try {
    // Sprawdź autoryzację
    const loggedInCookie = req.cookies.get("logged_in")?.value;
    const isLoggedIn = loggedInCookie === "true";
    
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Pobierz ID lotu z body
    const body = await req.json();
    const { flightId } = body;
    
    if (!flightId) {
      return NextResponse.json({ error: "Missing flightId" }, { status: 400 });
    }
    
    // Połącz z bazą danych
    const MONGO_URI = process.env.MONGODB_URI!;
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db();
    const flightsCollection = db.collection("flights");
    
    // Znajdź lot - najpierw próbuj po ObjectId
    let flight;
    try {
      // Próba znalezienia po _id jako ObjectId
      flight = await flightsCollection.findOne({ _id: new ObjectId(flightId) });
    } catch (error) {
      // Jeśli nie można przekonwertować na ObjectId, szukaj po innych polach
      flight = await flightsCollection.findOne({ 
        $or: [
          { id: flightId },
          { uniqueId: flightId },
          { callsign: flightId }
        ] 
      });
    }
    
    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }
    
    // Usuń lot z bazy danych
    const result = await flightsCollection.deleteOne({ _id: flight._id });
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Flight not deleted" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Flight deleted successfully", 
      flightId,
      flightInfo: {
        callsign: flight.callsign || flight.flightNumber,
        departure: flight.departure,
        arrival: flight.arrival
      }
    });
    
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 