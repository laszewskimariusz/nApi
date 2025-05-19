// lib/sync.ts

import clientPromise from "./mongo";
import { fetchFlightsByDate } from "./newsky";
import fs from "fs";
import path from "path";

const LOG_PATH = path.resolve(process.cwd(), "logs/sync.log");
const START_DATE = new Date("2021-08-01");
const MAX_SPAN_DAYS = 30;

function log(message: string): void {
  const entry = `${new Date().toISOString()} - ${message}`;
  fs.appendFileSync(LOG_PATH, entry + "\n");
  console.log(entry);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runFullSync(): Promise<{ inserted: number }> {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection("flights");

  let inserted = 0;
  let current = new Date(START_DATE);
  const today = new Date();

  log("Starting full sync using bydate API...");

  while (current < today) {
    const rangeStart = new Date(current);
    const rangeEnd = new Date(current);
    rangeEnd.setDate(rangeEnd.getDate() + MAX_SPAN_DAYS);
    if (rangeEnd > today) rangeEnd.setTime(today.getTime());

    log(`⏳ Syncing: ${rangeStart.toISOString().slice(0, 10)} → ${rangeEnd.toISOString().slice(0, 10)}`);

    let skip = 0;
    let totalFetched = 0;

    try {
      while (true) {
        await sleep(10000); // 10 sek przerwy między requestami
        const flights = await fetchFlightsByDate(rangeStart, rangeEnd, skip);
        if (!Array.isArray(flights) || flights.length === 0) break;

        for (const flight of flights) {
          if (!flight.flightId) continue;
          const exists = await collection.findOne({ flightId: flight.flightId });
          if (!exists) {
            await collection.updateOne(
              { flightId: flight.flightId },
              { $set: flight },
              { upsert: true }
            );
            inserted++;
          }
        }

        skip += flights.length;
        totalFetched += flights.length;
        log(`📄 Fetched: ${flights.length} | Total this window: ${totalFetched} | Inserted: ${inserted}`);

        if (flights.length < 100) break;
      }
    } catch (err: any) {
      log(`❌ ERROR on range ${rangeStart.toISOString().slice(0, 10)} → ${rangeEnd.toISOString().slice(0, 10)}: ${err.message}`);
      break;
    }

    current.setDate(current.getDate() + MAX_SPAN_DAYS);
  }

  log(`✅ Full sync completed. Total inserted: ${inserted}`);
  return { inserted };
}