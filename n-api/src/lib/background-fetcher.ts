// Server-side background fetcher that runs even when clients disconnect
import { MongoClient } from "mongodb";

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

// Function to fetch flights from external API and store them
async function fetchAndStoreFlights() {
  let mongo: MongoClient | null = null;
  
  try {
    addLog("Fetching flights from airline API...");
    lastFetch = new Date();
    
    if (!API_KEY) {
      throw new Error("Missing API key");
    }
    
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
    const flights = externalData.results;
    
    if (!flights || !Array.isArray(flights)) {
      throw new Error("Invalid response: flights must be an array");
    }
    
    // Connect to MongoDB
    mongo = new MongoClient(MONGO_URI);
    await mongo.connect();
    const db = mongo.db();
    const flightsCollection = db.collection("flights");
    
    let storedCount = 0;
    let duplicateCount = 0;
    
    // Process each flight
    for (const flight of flights) {
      // Generate a unique identifier for the flight
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
    
    addLog(`Success! Retrieved ${flights.length} flights, stored ${storedCount} new flights, ${duplicateCount} duplicates.`);
    
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
  fetchInterval = setInterval(fetchAndStoreFlights, FETCH_INTERVAL_MS);
  
  return true;
}

// Stop the background fetcher
export function stopFetcher(): boolean {
  if (!isRunning) {
    return false; // Not running
  }
  
  addLog("Stopping background fetcher");
  
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
  }
  
  isRunning = false;
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