// src/app/dashboard/fullSync/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function FullSyncPage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string>("");
  const [inserted, setInserted] = useState<number>(0);
  const [initialCount, setInitialCount] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("2021-08-01");
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    const res = await fetch("/api/fetcher/logs?file=sync").then((r) => r.text());
    setLogs(res);
  };

  const fetchCount = async () => {
    const res = await fetch("/api/flights/count").then((r) => r.json());
    setInitialCount(res.count ?? 0);
  };

  async function runFullSync() {
    setRunning(true);
    setLogs("");
    setInserted(0);
    await fetchCount();

    intervalRef.current = setInterval(fetchLogs, 5000);

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate })
    });

    const json = await res.json();
    setInserted(json.inserted ?? 0);
    setRunning(false);
    clearInterval(intervalRef.current!);
    await fetchLogs();
  }

  const stopSync = () => {
    setRunning(false);
    clearInterval(intervalRef.current!);
    setLogs((prev) => prev + "\n❌ Synchronizacja przerwana.");
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Pełna synchronizacja danych</h2>
      <p>Zakres: wybierz przedział dat. System porówna dane z bazy z tymi z API i uzupełni braki.</p>

      <div className="flex gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">Data od:</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Data do:</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={runFullSync} disabled={running}>
          {running ? "Synchronizuj..." : "Uruchom synchronizację"}
        </Button>
        {running && (
          <Button variant="destructive" onClick={stopSync}>
            Stop
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {initialCount !== null && (
          <p>
            💾 Rekordy w bazie: {initialCount} <br />
            ✅ Dodano nowych: {inserted}
          </p>
        )}
      </div>

      <pre className="bg-black text-white p-4 rounded max-h-[480px] overflow-y-scroll text-sm whitespace-pre-wrap">
        {logs || "Brak logów"}
      </pre>
    </main>
  );
}