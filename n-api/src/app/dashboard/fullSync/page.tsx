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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fetcher/logs`);
      if (!res.ok) {
        setLogs("Nie udało się pobrać logów.");
        return;
      }

      const json = await res.json();

      if (!json.logs || json.logs.length === 0) {
        setLogs("Brak dostępnych logów.");
        return;
      }

      const logText = json.logs
        .map((log: any) => `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`)
        .join("\n");

      setLogs(logText);
    } catch {
      setLogs("❌ Błąd podczas pobierania logów.");
    }
  };

  const fetchCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/flights/count`);
      const json = await res.json();
      setInitialCount(json.count ?? 0);
    } catch {
      setInitialCount(null);
    }
  };

  async function runFullSync() {
    setRunning(true);
    setLogs("");
    setInserted(0);
    await fetchCount();

    intervalRef.current = setInterval(fetchLogs, 5000);

    try {
      const res = await fetch(`${API_BASE}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      const json = await res.json();
      setInserted(json.inserted ?? 0);
    } catch {
      setLogs((prev) => prev + "\n❌ Błąd podczas synchronizacji.");
    } finally {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      await fetchLogs();
    }
  }

  const stopSync = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
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

      <div
        className="bg-black text-white p-4 rounded max-h-[480px] overflow-y-scroll text-sm font-mono whitespace-pre-wrap"
        style={{ whiteSpace: "pre-wrap" }}
      >
        {logs
          .split("\n")
          .slice(-30)
          .map((line, i) => {
            let colorClass = "";
            if (line.includes("❌")) colorClass = "text-red-400";
            else if (line.includes("✅")) colorClass = "text-green-400";
            else if (line.includes("⏳")) colorClass = "text-yellow-400";

            return (
              <div key={i} className={colorClass}>
                {line}
              </div>
            );
          })}
      </div>
    </main>
  );
}
