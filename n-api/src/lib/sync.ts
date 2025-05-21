// src/lib/sync.ts

function getDateRange(start: string, end: string): string[] {
  const dates = [];
  let current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runFullSync(startDate: string, endDate: string) {
  const API_KEY = process.env.NEWSKY_API_KEY;
  if (!API_KEY) throw new Error('Missing NEWSKY_API_KEY env variable');

  const dates = getDateRange(startDate, endDate);
  let allResults: any[] = [];

  for (const date of dates) {
    console.log(`⏳ Fetching flights for ${date}...`);

    const body = {
      start: date,
      end: date,
      count: 100,
      skip: 0,
      includeDeleted: true,
    };

    const res = await fetch("https://newsky.app/api/airline-api/flights/bydate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    console.log(`Received ${data.results?.length ?? 0} flights for ${date}`);

    allResults = allResults.concat(data.results ?? []);

    // Delay 10 seconds between requests
    await delay(10000);
  }

  return { results: allResults };
}
