// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AutoFetcher from "@/components/AutoFetcher";

export default function Dashboard() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [count, setCount] = useState<number | null>(null);
  const [flights, setFlights] = useState<any[]>([]);
  const [loadingSync, setLoadingSync] = useState(false);

  const [fetcherRunning, setFetcherRunning] = useState<boolean>(false);
  const [fetcherLogs, setFetcherLogs] = useState<string>("");
  const [loadingFetcher, setLoadingFetcher] = useState(false);

  async function loadData() {
    try {
      const resStatus = await fetch("/api/status").then((res) => res.json());
      setStatus(resStatus.ok ? "ok" : "error");

      const resCount = await fetch("/api/flights/count").then((res) => res.json());
      setCount(resCount.count);

      const resRecent = await fetch("/api/flights/recent").then((res) => res.json());
      setFlights(resRecent.flights);

      const resFetcher = await fetch("/api/fetcher/status").then((res) => res.json());
      setFetcherRunning(resFetcher.running);

      const logs = await fetch("/api/fetcher/logs").then((res) => res.text());
      setFetcherLogs(logs);
    } catch {
      setStatus("error");
    }
  }

  async function syncFlights() {
    setLoadingSync(true);
    await fetch("/api/sync", { method: "POST" });
    setLoadingSync(false);
    await loadData();
  }

  async function toggleFetcher(start: boolean) {
    setLoadingFetcher(true);
    await fetch(`/api/fetcher/${start ? "start" : "stop"}`);
    await loadData();
    setLoadingFetcher(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">nApi Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Database connection</p>
            <p className={`font-bold ${status === "ok" ? "text-green-500" : "text-red-500"}`}>
              {status === "loading" ? "Checking..." : status === "ok" ? "Connected" : "Disconnected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Flights in database</p>
            <p className="font-bold text-xl">{count ?? "..."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-2">
            <p className="text-muted-foreground">Sync flights</p>
            <Button onClick={syncFlights} disabled={loadingSync}>
              {loadingSync ? "Syncing..." : "Sync now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Last 5 flights</h2>
        <ul className="space-y-1 text-sm">
          {flights.map((flight, idx) => (
            <li key={idx} className="border-b pb-1">
              ✈️ {flight.departure} → {flight.arrival} — {typeof flight.aircraft === "string" ? flight.aircraft : JSON.stringify(flight.aircraft)} ({flight.pilot})
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Auto Fetcher</h2>
        <div className="flex items-center gap-4">
          <Button onClick={() => toggleFetcher(true)} disabled={loadingFetcher || fetcherRunning}>Start</Button>
          <Button onClick={() => toggleFetcher(false)} disabled={loadingFetcher || !fetcherRunning}>Stop</Button>
          <span className={fetcherRunning ? "text-green-500" : "text-red-500"}>
            {fetcherRunning ? "Running" : "Stopped"}
          </span>
        </div>
        <pre className="bg-black text-white p-4 rounded max-h-96 overflow-y-scroll text-sm">
          {fetcherLogs || "No logs available."}
        </pre>
      </div>

      <AutoFetcher />
    </main>
  );
}