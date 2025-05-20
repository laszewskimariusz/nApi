"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VatsimAuditPage() {
  const [startDate, setStartDate] = useState<string>("2024-01-01");
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vatsim-audit?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      setFlights(data.flights ?? []);
    } catch (err) {
      console.error("Failed to fetch flights:", err);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">VATSIM Flight Audit</h1>
      <p className="text-muted-foreground">Check all 100% VATSIM-tracked flights in a date range.</p>

      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">From:</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">To:</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={fetchFlights}>Search</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : flights.length === 0 ? (
        <p className="text-muted-foreground">No flights found for this range.</p>
      ) : (
        <div className="overflow-x-auto rounded-md bg-black text-white">
          <table className="min-w-full text-sm font-mono">
            <thead className="bg-zinc-800 text-left">
              <tr>
                <th className="px-4 py-2">Callsign</th>
                <th className="px-4 py-2">Pilot</th>
                <th className="px-4 py-2">Departure</th>
                <th className="px-4 py-2">Arrival</th>
                <th className="px-4 py-2">Departure Time (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700 max-h-[600px] overflow-y-auto">
              {flights.map((f, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{f.callsign}</td>
                  <td className="px-4 py-2">{f.pilot}</td>
                  <td className="px-4 py-2">{f.dep}</td>
                  <td className="px-4 py-2">{f.arr}</td>
                  <td className="px-4 py-2">{f.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
