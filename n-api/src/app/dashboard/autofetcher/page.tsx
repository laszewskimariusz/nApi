// src/app/dashboard/autofetcher/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AutoFetcherPage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchStatus() {
    const res = await fetch("/api/fetcher/status").then((r) => r.json());
    setRunning(res.running);
  }

  async function fetchLogs() {
    const res = await fetch("/api/fetcher/logs").then((r) => r.text());
    const lines = res.split("\n").slice(-30).join("\n");
    setLogs(lines);
  }

  async function toggle(start: boolean) {
    setLoading(true);
    await fetch(`/api/fetcher/${start ? "start" : "stop"}`);
    await fetchStatus();
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Auto Fetcher</h2>
      <div className="flex gap-4 items-center">
        <Button onClick={() => toggle(true)} disabled={running || loading}>Start</Button>
        <Button onClick={() => toggle(false)} disabled={!running || loading}>Stop</Button>
        <span className={running ? "text-green-500" : "text-red-500"}>{running ? "Running" : "Stopped"}</span>
      </div>
      <pre className="bg-black text-white p-4 rounded h-[480px] overflow-y-scroll text-sm">
        {logs || "No logs available."}
      </pre>
    </main>
  );
}