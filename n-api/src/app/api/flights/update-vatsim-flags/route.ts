import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Funkcja do wykrywania lotów VATSIM na podstawie danych
function detectVatsimFlight(flight: any): boolean {
  // Sprawdzamy różne pola, które mogą wskazywać na to, że lot jest z VATSIM
  
  // 1. Sprawdź, czy w strukturze network jest nazwa vatsim
  if (flight.network && flight.network.name === 'vatsim') {
    return true;
  }
  
  // 2. Sprawdź, czy w źródle danych jest informacja o VATSIM
  if (flight.source && typeof flight.source === 'string' && 
      flight.source.toLowerCase().includes('vatsim')) {
    return true;
  }
  
  // 3. Sprawdź, czy w polu network jest informacja o VATSIM
  if (flight.network && typeof flight.network === 'string' && 
      flight.network.toLowerCase().includes('vatsim')) {
    return true;
  }
  
  // 4. Sprawdź, czy w pilocie/uwagach jest informacja o VATSIM
  const pilotField = flight.pilot || flight.pilotName || '';
  const remarksField = flight.remarks || flight.comments || '';
  
  if ((typeof pilotField === 'string' && pilotField.toLowerCase().includes('vatsim')) || 
      (typeof remarksField === 'string' && remarksField.toLowerCase().includes('vatsim'))) {
    return true;
  }
  
  // 5. Jeśli lot ma konkretne callsigny używane w VATSIM
  const callsign = flight.callsign || flight.flightNumber || '';
  if (typeof callsign === 'string') {
    // Popularne linie lotnicze na VATSIM z trzyliterowym prefiksem
    const vatsimAirlines = ['TOP', 'DLH', 'BAW', 'RYR', 'UAE', 'AAL', 'AFR'];
    for (const airline of vatsimAirlines) {
      if (callsign.startsWith(airline)) {
        return true;
      }
    }
  }
  
  // 6. Jeśli lot ma informację o serwerze lub platformie
  if (flight.platform && typeof flight.platform === 'string' && 
      flight.platform.toLowerCase().includes('vatsim')) {
    return true;
  }
  
  // Domyślnie zwracamy false, jeśli nie wykryliśmy, że lot jest z VATSIM
  return false;
}

// Endpoint do aktualizacji flag VATSIM dla wszystkich lotów
export async function POST(req: NextRequest) {
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
    
    // Pobierz wszystkie loty
    const flights = await flightsCollection.find({}).toArray();
    
    let updatedCount = 0;
    let alreadyTaggedCount = 0;
    let unchangedCount = 0;
    const updatedFlights = [];
    
    // Dla każdego lotu, sprawdź czy powinien być oznaczony jako VATSIM
    for (const flight of flights) {
      // Jeśli lot jest już oznaczony jako VATSIM, pomijamy
      if (flight.isVatsim) {
        alreadyTaggedCount++;
        continue;
      }
      
      // Sprawdź, czy lot powinien być oznaczony jako VATSIM
      const shouldBeVatsim = detectVatsimFlight(flight);
      
      if (shouldBeVatsim) {
        // Aktualizuj lot w bazie danych
        await flightsCollection.updateOne(
          { _id: flight._id },
          { 
            $set: { 
              isVatsim: true,
              updatedAt: new Date()
            } 
          }
        );
        
        updatedCount++;
        updatedFlights.push({
          id: flight._id,
          callsign: flight.callsign || flight.flightNumber,
          departure: flight.departure,
          arrival: flight.arrival
        });
      } else {
        unchangedCount++;
      }
    }
    
    await client.close();
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updatedCount} flights, ${alreadyTaggedCount} already tagged, ${unchangedCount} unchanged.`,
      total: flights.length,
      updatedFlights
    });
    
  } catch (error) {
    console.error("Error updating VATSIM flags:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 