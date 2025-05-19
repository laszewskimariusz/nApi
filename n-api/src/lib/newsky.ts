// src/lib/newsky.ts

export type FetchFlightsOptions = {
  count?: number;
  skip?: number;
};

export async function fetchRecentFlights({ count = 100, skip = 0 }: FetchFlightsOptions) {
  const apiKey = process.env.NEWSKY_API_KEY;
  if (!apiKey) throw new Error("Missing Newsky API key");

  const body = {
    count,
    skip,
    includeDeleted: false
  };

  const res = await fetch("https://newsky.app/api/airline-api/flights/recent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Newsky API response:", errorText);
    throw new Error(`Newsky API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchFlightsByDate(start: Date, end: Date, skip = 0) {
  const apiKey = process.env.NEWSKY_API_KEY;
  if (!apiKey) throw new Error("Missing Newsky API key");

  const body = {
    start: start.toISOString(),
    end: end.toISOString(),
    skip,
    count: 100,
    includeDeleted: false,
  };

  const res = await fetch("https://newsky.app/api/airline-api/flights/bydate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Newsky API response:", errorText);
    throw new Error(`Newsky API error: ${res.status}`);
  }

  return res.json();
}