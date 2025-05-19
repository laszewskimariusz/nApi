// === plik: lib/fetcher.ts ===

import fs from 'fs';
import path from 'path';
import clientPromise from './mongo';
import { fetchRecentFlights } from './newsky';
import type { WithId, Document } from 'mongodb';

let fetcherInterval: NodeJS.Timeout | null = null;
let isRunning = false;

const LOG_PATH = path.resolve(process.cwd(), 'logs/fetcher.log');

async function fetchData(): Promise<void> {
  try {
    const response = await fetchRecentFlights({ count: 100 });
    const data = Array.isArray(response) ? response : response?.flights ?? [];

    if (!Array.isArray(data)) {
      log(`ERROR: Invalid data structure returned from API`);
      return;
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('flights');

    for (const record of data) {
      await collection.updateOne(
        { flightId: record.flightId },
        { $set: record },
        { upsert: true }
      );
    }

    log(`Fetched and saved ${data.length} records.`);
  } catch (err: any) {
    log(`ERROR: ${err.message}`);
  }
}

export function startFetcher(): void {
  if (!isRunning) {
    fetchData();
    fetcherInterval = setInterval(fetchData, 10000);
    isRunning = true;
    log('Fetcher started.');
  }
}

export function stopFetcher(): void {
  if (isRunning && fetcherInterval) {
    clearInterval(fetcherInterval);
    fetcherInterval = null;
    isRunning = false;
    log('Fetcher stopped.');
  }
}

export function getFetcherStatus(): boolean {
  return isRunning;
}

function log(message: string): void {
  const entry = `${new Date().toISOString()} - ${message}`;
  fs.appendFileSync(LOG_PATH, entry + '\n');
  console.log(entry);
}

export function getLogs(): string {
  if (!fs.existsSync(LOG_PATH)) return '';
  return fs.readFileSync(LOG_PATH, 'utf-8');
}