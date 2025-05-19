import clientPromise from "./mongo";
import { fetchFlightsByDate } from "./newsky";
import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve(process.cwd(), "logs", "sync.log");

// Przy starcie usuwamy stary plik log
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}

// Funkcja logowania
function log(message: string): void {
  const entry = `${new Date().toISOString()} - ${message}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  console.log(entry.trim());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runFullSync(startDateParam?: string, endDateParam?: string): Promise<{ inserted: number }> {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection("flights");

  let inserted = 0;

  const START_DATE = startDateParam ? new Date(startDateParam) : new Date("2021-08-01");
  const END_DATE = endDateParam ? new Date(endDateParam) : new Date();

  log(`Starting full sync from ${START_DATE.toISOString().slice(0, 10)} to ${END_DATE.toISOString().slice(0, 10)}`);

  let current = new Date(START_DATE);

  while (current <= END_DATE) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    log(`⏳ Syncing: ${dayStart.toISOString().slice(0, 10)}`);

    try {
      let skip = 0;
      let totalFetched = 0;

      while (true) {
        await sleep(10000); // 10 sekund przerwy między requestami

        const data = await fetchFlightsByDate(dayStart, dayEnd, skip);
        log(`Newsky API response JSON: ${JSON.stringify(data).slice(0, 1000)}`); // skrócone logowanie

        if (!data || !Array.isArray(data.results)) {
          log(`❌ ERROR: unexpected API response format`);
          break;
        }

        const flights = data.results;
        if (flights.length === 0) {
          log("No more flights to fetch for this day.");
          break;
        }

        for (const flight of flights) {
          const flightId = flight._id || flight.flightId;
          if (!flightId) {
            log("Flight missing id, skipping.");
            continue;
          }

          const exists = await collection.findOne({ _id: flightId });
          if (!exists) {
            await collection.updateOne(
              { _id: flightId },
              { $set: flight },
              { upsert: true }
            );
            inserted++;
            log(`Inserted flight ID: ${flightId}`);
          } else {
            log(`Flight ID: ${flightId} already exists`);
          }
        }

        skip += flights.length;
        totalFetched += flights.length;

        log(`📄 Fetched: ${flights.length} | Total this day: ${totalFetched} | Inserted: ${inserted}`);

        if (flights.length < 100) break; // koniec paginacji
      }
    } catch (err: any) {
      log(`❌ ERROR on day ${dayStart.toISOString().slice(0, 10)}: ${err.message || err}`);
      break;
    }

    current.setDate(current.getDate() + 1);
  }

  log(`✅ Full sync completed. Total inserted: ${inserted}`);
  return { inserted };
}
