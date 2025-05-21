// Server-side background fetcher that runs even when clients disconnect
import { MongoClient, ObjectId } from "mongodb";

// Global state for the background fetcher
let isRunning = false;
let fetchInterval: NodeJS.Timeout | null = null;
let lastFetch: Date | null = null;
let fetchLogsBuffer: string[] = [];
const MAX_LOGS = 100;
const FETCH_INTERVAL_MS = 10000; // 10 seconds

const API_KEY = process.env.NEWSKY_API_KEY;
const MONGO_URI = process.env.MONGODB_URI!;

// Add a log entry with timestamp
function addLog(message: string, isError: boolean = false) {
  const timestamp = new Date().toISOString();
  const logEntry = `${isError ? '❌' : '✅'} [${timestamp}] ${message}`;
  
  // Add to beginning of array (newest first)
  fetchLogsBuffer.unshift(logEntry);
  
  // Trim logs to maximum length
  if (fetchLogsBuffer.length > MAX_LOGS) {
    fetchLogsBuffer = fetchLogsBuffer.slice(0, MAX_LOGS);
  }
  
  console.log(logEntry);
}

// Zmodyfikowana funkcja fetchAndStoreFlights
async function fetchFlights(formattedDate: string) {
  let flights: any[] = [];
  
  try {
    // Najpierw próbujemy z metodą GET
    const params = new URLSearchParams({
      count: '100',
      start: formattedDate,
      includeDeleted: 'false'
    });
    
    addLog("Trying GET method first...");
    
    // Opcje fetch z timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekund timeout
    
    // Call the external airline API
    const externalResponse = await fetch(`https://newsky.app/api/airline-api/flights/recent?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Wyczyść timeout po pomyślnym żądaniu
    
    if (!externalResponse.ok) {
      throw new Error(`External API error (GET): ${externalResponse.status} ${externalResponse.statusText}`);
    }
    
    const externalData = await externalResponse.json();
    flights = externalData.results;
    
    if (!flights || !Array.isArray(flights)) {
      throw new Error("Invalid response: flights must be an array");
    }
    
    // Log response info
    addLog(`API Response (GET): ${flights.length} flights retrieved, first flight ID: ${flights[0]?.id || 'N/A'}`);
    
    return flights;
  } catch (getError: unknown) {
    // Jeśli GET nie zadziała, próbujemy z metodą POST
    const errorMessage = getError instanceof Error ? getError.message : String(getError);
    addLog(`GET method failed, trying POST... (${errorMessage})`);
    
    // Opcje fetch z timeout dla POST
    const postController = new AbortController();
    const postTimeoutId = setTimeout(() => postController.abort(), 5000); // 5 sekund timeout
    
    const externalResponse = await fetch('https://newsky.app/api/airline-api/flights/recent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        count: 100,
        start: formattedDate,
        includeDeleted: false
      }),
      signal: postController.signal
    });
    
    clearTimeout(postTimeoutId); // Wyczyść timeout po pomyślnym żądaniu
    
    if (!externalResponse.ok) {
      let errorDetail = '';
      try {
        const errorData = await externalResponse.json();
        errorDetail = JSON.stringify(errorData);
      } catch (e) {
        // Ignorujemy błędy parsowania, gdy nie możemy odczytać JSON
      }
      
      throw new Error(`External API error (POST): ${externalResponse.status} ${externalResponse.statusText} ${errorDetail}`);
    }
    
    const externalData = await externalResponse.json();
    flights = externalData.results;
    
    if (!flights || !Array.isArray(flights)) {
      throw new Error("Invalid response: flights must be an array");
    }
    
    // Log response info
    addLog(`API Response (POST): ${flights.length} flights retrieved, first flight ID: ${flights[0]?.id || 'N/A'}`);
    
    return flights;
  }
}

// Function to fetch flights from external API and store them
async function fetchAndStoreFlights() {
  // Sprawdź czy fetcher jest wciąż uruchomiony
  if (!isRunning) {
    addLog("Fetcher stopped, cancelling fetch operation");
    return;
  }
  
  let mongo: MongoClient | null = null;
  
  try {
    addLog("Fetching flights from airline API...");
    lastFetch = new Date();
    
    if (!API_KEY) {
      throw new Error("Missing API key");
    }
    
    // Sprawdzenie formatu klucza API
    if (API_KEY.length < 10) {
      throw new Error("API key appears to be invalid (too short)");
    }
    
    addLog(`Using API key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`);
    
    // Get date 24 hours ago
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);
    const formattedDate = startDate.toISOString();
    
    // Log request parameters
    addLog(`Sending API request with params: count=100, start=${formattedDate}`);
    
    // Pobierz loty używając odpowiedniej metody
    const flights = await fetchFlights(formattedDate);
    
    // Zatrzymaj przetwarzanie, jeśli fetcher został zatrzymany podczas pobierania danych
    if (!isRunning) {
      addLog("Fetcher stopped during API call, cancelling database operations");
      return;
    }
    
    // Connect to MongoDB
    mongo = new MongoClient(MONGO_URI);
    await mongo.connect();
    const db = mongo.db();
    const flightsCollection = db.collection("flights");
    
    let storedCount = 0;
    let duplicateCount = 0;
    let updatedCount = 0;
    
    // Utwórz tablicę unikalnych identyfikatorów już przetworzonych lotów w tej sesji
    // aby uniknąć duplikacji w tej samej serii
    const processedIds = new Set<string>();
    
    // Process each flight
    for (const flight of flights) {
      // Zatrzymaj przetwarzanie, jeśli fetcher został zatrzymany podczas zapisywania
      if (!isRunning) {
        addLog("Fetcher stopped during database operations, stopping further processing");
        break;
      }
      
      // Debuguj dane lotu
      const flightDebugInfo = `Flight: ${flight.callsign || flight.flightNumber || "Unknown"} (${flight.departure || "???"} -> ${flight.arrival || "???"})`;
      
      // Generuj uniqueId dla zapisu
      const flightDate = flight.createdAt || flight.addedAt || new Date().toISOString();
      const uniqueId = flight.id ? 
        `api-${flight.id}` : 
        `${flight.callsign || flight.flightNumber || ""}-${flight.departure || ""}-${flight.arrival || ""}-${flightDate.split('T')[0]}`;
      
      // Sprawdź, czy ten lot już przetwarzaliśmy w tej sesji
      if (processedIds.has(uniqueId)) {
        addLog(`Skipping duplicate in this batch: ${flightDebugInfo}`);
        duplicateCount++;
        continue;
      }
      
      // Dodaj do przetworzonych w tej sesji
      processedIds.add(uniqueId);
      
      // Sprawdź, czy lot ma już identyfikator w bazie danych
      // Najpierw sprawdź po uniqueId
      let existingFlight = await flightsCollection.findOne({ uniqueId });
      
      // Jeśli nie znaleziono po uniqueId, spróbuj po ID z API
      if (!existingFlight && flight.id) {
        existingFlight = await flightsCollection.findOne({ "id": flight.id });
        if (existingFlight) {
          addLog(`Found by API ID but not uniqueId: ${flightDebugInfo} [API ID: ${flight.id}]`);
        }
      }
      
      // Jeśli nie znaleziono po ID, spróbuj po callsign i trasie
      if (!existingFlight && flight.callsign && flight.departure && flight.arrival) {
        existingFlight = await flightsCollection.findOne({
          callsign: flight.callsign,
          departure: flight.departure,
          arrival: flight.arrival
        });
        
        if (existingFlight) {
          addLog(`Found by callsign+route but not uniqueId: ${flightDebugInfo}`);
        }
      }
      
      if (!existingFlight) {
        // Create a clean flight object without MongoDB _id to prevent conflicts
        const { _id, ...flightWithoutId } = flight;
        
        // Sprawdź czy to lot VATSIM na podstawie informacji w locie
        const isVatsimFlight = detectVatsimFlight(flight);
        
        // Add uniqueId field to flight data
        const flightToStore = {
          ...flightWithoutId,
          uniqueId,
          importedAt: new Date(),
          source: "airline-api",
          isVatsim: isVatsimFlight
        };
        
        // Store the flight
        await flightsCollection.insertOne(flightToStore);
        storedCount++;
        
        // Loguj szczegóły nowego lotu
        addLog(`New flight added: ${flightDebugInfo} [ID: ${flight.id || uniqueId}]${isVatsimFlight ? ' [VATSIM]' : ''}`);
      } else {
        // Sprawdź, czy dane lotu wymagają aktualizacji
        const { _id: existingId, importedAt, ...existingData } = existingFlight;
        const { _id: _, ...flightData } = flight;
        
        // Sprawdź czy to lot VATSIM
        const isVatsimFlight = detectVatsimFlight(flight);
        
        // Jeśli lot jest z VATSIM, a w bazie nie ma oznaczenia VATSIM, dodaj to oznaczenie
        let needsUpdate = false;
        if (isVatsimFlight && !existingData.isVatsim) {
          needsUpdate = true;
          addLog(`Setting VATSIM flag for ${flightDebugInfo}`);
        }
        
        // Porównaj dane - sprawdź czy jakieś pole lotów się różni
        for (const key in flightData) {
          // Pomiń pola, które nie powinny wpływać na aktualizację
          if (key === 'importedAt' || key === 'source' || key === 'uniqueId') continue;
          
          // Jeśli pole istnieje w obu obiektach i ma różne wartości, to loty się różnią
          if (key in existingData && JSON.stringify(flightData[key]) !== JSON.stringify(existingData[key])) {
            needsUpdate = true;
            addLog(`Field '${key}' changed for ${flightDebugInfo}: ${JSON.stringify(existingData[key])} -> ${JSON.stringify(flightData[key])}`);
            break;
          }
          
          // Jeśli pole istnieje tylko w nowym locie (ale nie w istniejącym), to też warto zaktualizować
          if (!(key in existingData) && flightData[key] !== undefined && flightData[key] !== null) {
            needsUpdate = true;
            addLog(`New field '${key}' for ${flightDebugInfo}: ${JSON.stringify(flightData[key])}`);
            break;
          }
        }
        
        if (needsUpdate) {
          // Zaktualizuj istniejący lot, zachowując oryginalny _id i uniqueId
          const updatedFlight = {
            ...existingData,
            ...flightData,
            // Zachowaj oryginalne pola metadanych
            uniqueId: existingFlight.uniqueId,
            lastUpdatedAt: new Date(),
            isVatsim: isVatsimFlight
          };
          
          await flightsCollection.updateOne(
            { _id: existingId },
            { $set: updatedFlight }
          );
          
          updatedCount++;
          addLog(`Updated flight: ${flightDebugInfo}`);
        } else {
          duplicateCount++;
        }
      }
    }
    
    addLog(`Success! Retrieved ${flights.length} flights, stored ${storedCount} new flights, updated ${updatedCount}, ${duplicateCount} unchanged.`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog(`Error: ${errorMessage}`, true);
    console.error("Background fetcher error:", error);
  } finally {
    // Close MongoDB connection
    if (mongo) {
      try {
        await mongo.close();
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
      }
    }
  }
}

// Start the background fetcher
export function startFetcher(): boolean {
  if (isRunning) {
    return false; // Already running
  }
  
  addLog("Starting background fetcher");
  isRunning = true;
  
  // Initial fetch
  fetchAndStoreFlights();
  
  // Set up interval for recurring fetches
  fetchInterval = setInterval(() => {
    // Sprawdź czy nadal jesteśmy w trybie running przed uruchomieniem kolejnego fetcha
    if (isRunning) {
      fetchAndStoreFlights();
    } else {
      // Automatycznie wyczyść interval jeśli isRunning jest false
      if (fetchInterval) {
        clearInterval(fetchInterval);
        fetchInterval = null;
        addLog("Cleared interval as isRunning is false");
      }
    }
  }, FETCH_INTERVAL_MS);
  
  return true;
}

// Stop the background fetcher
export function stopFetcher(): boolean {
  if (!isRunning) {
    return false; // Not running
  }
  
  addLog("Stopping background fetcher");
  
  // Zmień stan na zatrzymany, to zatrzyma wszystkie trwające operacje
  isRunning = false;
  
  // Zatrzymaj interval
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
    addLog("Interval cleared");
  }
  
  return true;
}

// Get current status
export function getFetcherStatus() {
  return {
    isRunning,
    lastFetch: lastFetch ? lastFetch.toISOString() : null,
    logs: fetchLogsBuffer
  };
}

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