"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FaChevronDown, FaChevronUp, FaPlaneDeparture, FaMapMarkerAlt } from "react-icons/fa";

type Flight = {
  flightNumber?: string;
  departure?: string;
  arrival?: string;
  airframe?: { name?: string; ident?: string };
  callsign?: string;
  [key: string]: any;
};

export default function Dashboard() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [count, setCount] = useState<number | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  async function loadData() {
    try {
      const resStatus = await fetch("/api/status").then((res) => res.json());
      setStatus(resStatus.ok ? "ok" : "error");

      const resCount = await fetch("/api/flights/count").then((res) => res.json());
      setCount(resCount.count);

      const resRecent = await fetch("/api/flights/recent?limit=5").then((res) => res.json());
      setFlights(resRecent.flights ?? []);
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleExpand(idx: number) {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <p className="text-muted-foreground mb-1">Database connection</p>
            <p className={`font-bold ${status === "ok" ? "text-green-600" : "text-red-600"}`}>
              {status === "loading" ? "Checking..." : status === "ok" ? "Connected" : "Disconnected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-muted-foreground mb-1">Flights in database</p>
            <p className="font-bold text-xl">{count ?? "..."}</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Last 5 flights</h2>
        <div className="space-y-4">
          {flights.length === 0 && <p>No recent flights found.</p>}
          {flights.map((flight, idx) => {
            const expanded = expandedIdx === idx;
            const callsign = flight.flightNumber || flight.callsign || "N/A";
            const dep = flight.dep?.icao || flight.departure || "???";
            const arr = flight.arr?.icao || flight.arrival || "???";
            const airframeName = flight.airframe?.name || flight.airframe?.ident || "Unknown";

            return (
              <Card
                key={flight._id || idx}
                className="cursor-pointer border border-border bg-background/60 hover:bg-background/80 transition"
                onClick={() => toggleExpand(idx)}
              >
                <CardContent className="flex justify-between items-center p-4">
                  <div className="flex items-center space-x-4 text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      <FaPlaneDeparture className="h-5 w-5 text-blue-500" />
                      <span>{callsign}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt className="h-5 w-5 text-green-500" />
                      <span>{dep}</span>
                      <span>→</span>
                      <FaMapMarkerAlt className="h-5 w-5 text-red-500 rotate-180" />
                      <span>{arr}</span>
                    </div>
                    <div>
                      <span className="italic text-gray-600">{airframeName}</span>
                    </div>
                  </div>
                  <div>
                    {expanded ? (
                      <FaChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <FaChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CardContent>

                {expanded && (
                  <CardContent className="bg-background/80 border-t border-border text-xs font-mono whitespace-pre-wrap max-h-64 overflow-auto">
                    {JSON.stringify(flight, null, 2)}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
