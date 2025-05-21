import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

// Endpoint do oznaczania lotu jako VATSIM
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
    const { flightId, untag = false } = body;
    
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
    
    // Przygotuj aktualizację - ustaw flagę VATSIM lub usuń ją, zależnie od parametru untag
    const updateOperation: any = {}; // Używamy any, żeby uniknąć błędów TypeScript z operacjami MongoDB
    
    if (untag) {
      // Usuń flagę isVatsim
      updateOperation.$set = { updatedAt: new Date() };
      updateOperation.$unset = { isVatsim: "" };
    } else {
      // Ustaw flagę isVatsim
      updateOperation.$set = { 
        isVatsim: true,
        updatedAt: new Date()
      };
    }
    
    // Zaktualizuj lot
    const result = await flightsCollection.updateOne(
      { _id: flight._id },
      updateOperation
    );
    
    await client.close();
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Flight not updated" }, { status: 500 });
    }
    
    const successMessage = untag ? "VATSIM tag removed from flight" : "Flight tagged as VATSIM";
    
    return NextResponse.json({ 
      success: true, 
      message: successMessage, 
      flightId,
      flight: {
        _id: flight._id,
        callsign: flight.callsign || flight.flightNumber,
        departure: flight.departure || flight.dep?.icao,
        arrival: flight.arrival || flight.arr?.icao,
        isVatsim: untag ? false : true
      }
    });
    
  } catch (error) {
    console.error("Error updating VATSIM tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 