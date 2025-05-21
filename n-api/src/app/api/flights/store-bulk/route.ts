import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const mongo = new MongoClient(process.env.MONGODB_URI!);
const API_KEY = process.env.NEWSKY_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Get parameters from request
    const { fetchFromExternal = false, flights: providedFlights = null } = await req.json();
    
    let flights = providedFlights;
    
    // If fetchFromExternal is true, fetch flights from the Newsky API
    if (fetchFromExternal && API_KEY) {
      console.log("Fetching flights from external API");
      
      // Get date 24 hours ago
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 24);
      
      // Call the external airline API
      const externalResponse = await fetch('https://newsky.app/api/airline-api/flights/recent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          count: 50,
          start: startDate.toISOString(),
          includeDeleted: false
        })
      });
      
      if (!externalResponse.ok) {
        throw new Error(`External API error: ${externalResponse.status} ${externalResponse.statusText}`);
      }
      
      const externalData = await externalResponse.json();
      flights = externalData.results;
    }
    
    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json(
        { error: "Invalid request: flights must be an array" },
        { status: 400 }
      );
    }
    
    await mongo.connect();
    const db = mongo.db();
    const flightsCollection = db.collection("flights");
    
    let storedCount = 0;
    let duplicateCount = 0;
    
    // Process each flight
    for (const flight of flights) {
      // Generate a unique identifier for the flight
      // Use callsign + departure + arrival + date as a unique identifier
      const flightDate = flight.createdAt || flight.addedAt || new Date().toISOString();
      const uniqueId = `${flight.callsign || flight.flightNumber || ""}-${flight.departure || ""}-${flight.arrival || ""}-${flightDate.split('T')[0]}`;
      
      // Check if this flight already exists by uniqueId
      const existingFlight = await flightsCollection.findOne({ uniqueId });
      
      if (!existingFlight) {
        // Create a clean flight object without MongoDB _id to prevent conflicts
        const { _id, ...flightWithoutId } = flight;
        
        // Add uniqueId field to flight data
        const flightToStore = {
          ...flightWithoutId,
          uniqueId,
          importedAt: new Date(),
          source: "airline-api"
        };
        
        // Store the flight
        await flightsCollection.insertOne(flightToStore);
        storedCount++;
      } else {
        duplicateCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      total: flights.length,
      stored: storedCount,
      duplicates: duplicateCount
    });
    
  } catch (error) {
    console.error("Error storing flights:", error);
    
    return NextResponse.json(
      { error: `Failed to store flights: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  } finally {
    // Ensure we close the connection
    try {
      await mongo.close();
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }
} 