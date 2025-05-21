"use client";

import React, { useState } from "react";

export default function FullSyncPage() {
  const [logs, setLogs] = useState<string>("");
  const [flights, setFlights] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>("2022-11-18");
  const [endDate, setEndDate] = useState<string>("2022-11-20");

  async function fetchFlights() {
    setLogs((prev) => prev + `⏳ Fetching flights from ${startDate} to ${endDate}...\n`);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!res.ok) {
        const text = await res.text();
        setLogs((prev) => prev + `❌ API error: ${text}\n`);
        setFlights([]);
        return;
      }

      const data = await res.json();

      setFlights(data.results ?? []);
      setLogs((prev) => prev + `✅ Fetched ${data.results?.length ?? 0} flights\n`);
      console.log("Flights data:", data);
    } catch (error: any) {
      setLogs((prev) => prev + `❌ Fetch error: ${error.message}\n`);
      setFlights([]);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Flight Data Fetcher</h2>

      <div className="flex space-x-4 items-center">
        <label>
          Start date:{" "}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label>
          End date:{" "}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <button
          onClick={fetchFlights}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Fetch flights
        </button>
      </div>

      <pre
        className="bg-black text-white p-4 rounded max-h-[240px] overflow-y-scroll text-sm font-mono whitespace-pre-wrap"
      >
        {logs || "Logs will appear here..."}
      </pre>

      <div>
        <h3 className="text-xl font-semibold mt-6 mb-2">Flights ({flights.length})</h3>
        {flights.length === 0 && <p>No flights found for selected dates.</p>}
        {flights.length > 0 && (
          <table className="w-full border-collapse border border-gray-600 text-left text-sm">
            <thead>
              <tr>
                <th className="border border-gray-600 px-2 py-1">Flight #</th>
                <th className="border border-gray-600 px-2 py-1">Airline</th>
                <th className="border border-gray-600 px-2 py-1">Departure</th>
                <th className="border border-gray-600 px-2 py-1">Arrival</th>
                <th className="border border-gray-600 px-2 py-1">Dep Time (UTC)</th>
                <th className="border border-gray-600 px-2 py-1">Duration</th>
                <th className="border border-gray-600 px-2 py-1">Aircraft</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight._id}>
                  <td className="border border-gray-600 px-2 py-1">{flight.flightNumber}</td>
                  <td className="border border-gray-600 px-2 py-1">{flight.airline?.shortname}</td>
                  <td className="border border-gray-600 px-2 py-1">{flight.dep?.icao}</td>
                  <td className="border border-gray-600 px-2 py-1">{flight.arr?.icao}</td>
                  <td className="border border-gray-600 px-2 py-1">{new Date(flight.depTime).toUTCString()}</td>
                  <td className="border border-gray-600 px-2 py-1">{Math.floor(flight.duration / 60)}h {flight.duration % 60}m</td>
                  <td className="border border-gray-600 px-2 py-1">{flight.aircraft?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
