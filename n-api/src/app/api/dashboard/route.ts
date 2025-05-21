import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";

export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const flightsCol = db.collection("flights");

  // Wszystkie loty
  const totalFlights = await flightsCol.countDocuments();

  // Wszystkie loty VATSIM
  const totalVatsimFlights = await flightsCol.countDocuments({
    "network.name": "vatsim",
    "network.ratio": { $gte: 0.999 },
  });

  // Pobierz więcej lotów (do 1000) aby zapewnić lepsze pokrycie 30 dni
  const latestFlights = await flightsCol.find({})
    .sort({ createdAt: -1 })
    .limit(1000)
    .project({
      _id: 1,
      flightNumber: 1,
      callsign: 1,
      "dep.icao": 1,
      "arr.icao": 1,
      "pilot.fullname": 1,
      "airline.shortname": 1,
      "airframe.name": 1,
      "aircraft.airframe.name": 1,
      "aircraft.name": 1,
      createdAt: 1,
      "ofp.close": 1,
      "network.name": 1,
      "network.ratio": 1
    })
    .toArray();

  console.log(`Pobrano ${latestFlights.length} ostatnich lotów`);

  // Przetwarzamy dane lotów
  const processedFlights = latestFlights.map(flight => ({
    id: flight._id,
    flightNumber: flight.flightNumber || flight.callsign || "N/A",
    dep: flight.dep?.icao || "???",
    arr: flight.arr?.icao || "???",
    pilot: flight.pilot?.fullname || "Unknown",
    airline: flight.airline?.shortname || "N/A",
    aircraft: flight.aircraft?.airframe?.name || flight.aircraft?.name || flight.airframe?.name || "N/A",
    date: flight.ofp?.close || flight.createdAt,
    isVatsim: flight.network?.name === "vatsim" && flight.network?.ratio >= 0.999
  }));

  // Grupujemy loty po dniach
  const flightsByDay: Record<string, { total: number; vatsim: number }> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  
  // Inicjalizacja pustego obiektu dla każdego dnia w ostatnich 30 dniach
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    flightsByDay[dateStr] = { total: 0, vatsim: 0 };
  }
  
  // Wypełnienie danymi z lotów
  processedFlights.forEach(flight => {
    if (!flight.date) return;
    
    const flightDate = new Date(flight.date);
    const dateStr = flightDate.toISOString().slice(0, 10);
    
    // Sprawdź czy lot mieści się w ostatnich 30 dniach
    if (flightDate >= start && flightDate <= today && flightsByDay[dateStr]) {
      flightsByDay[dateStr].total += 1;
      if (flight.isVatsim) {
        flightsByDay[dateStr].vatsim += 1;
      }
    }
  });
  
  // Tworzymy tablicę chartData
  const chartData = Object.keys(flightsByDay).map(date => ({
    date,
    total: flightsByDay[date].total,
    vatsim: flightsByDay[date].vatsim
  })).sort((a, b) => a.date.localeCompare(b.date));
  
  console.log("Chart data z przetworzonych lotów:", chartData.slice(0, 3));
  
  // Obliczamy liczby lotów w ostatnich 30 dniach
  const last30DaysFlights = chartData.reduce((sum, day) => sum + day.total, 0);
  const last30DaysVatsimFlights = chartData.reduce((sum, day) => sum + day.vatsim, 0);
  
  console.log(`Liczba lotów w ostatnich 30 dniach: ${last30DaysFlights}, VATSIM: ${last30DaysVatsimFlights}`);

  // Dla tabeli zostawiamy tylko 100 najnowszych lotów
  const latestFlightsForTable = processedFlights.slice(0, 100);

  return NextResponse.json({
    totalFlights,
    totalVatsimFlights,
    last30DaysFlights,
    last30DaysVatsimFlights,
    chartData,
    latestFlights: latestFlightsForTable,
    debug: {
      currentDate: today.toISOString(),
      startDate: start.toISOString(),
      flightCount: processedFlights.length,
      tableCount: latestFlightsForTable.length,
      dateRanges: {
        start: chartData[0]?.date,
        end: chartData[chartData.length - 1]?.date
      }
    }
  });
} 