// src/components/AutoFetcher.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export default function AutoFetcher() {
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [log, setLog] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // countdown UI
  useEffect(() => {
    if (!running) return;

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [running]);

  // data fetcher
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      fetch("/api/sync")
        .then((res) => res.json())
        .then((data) => {
          const now = new Date().toLocaleTimeString();
          setLog((prev) => [
            `✅ [${now}] Synced: ${JSON.stringify(data)}`,
            ...prev
          ]);
        })
        .catch((err) => {
          const now = new Date().toLocaleTimeString();
          setLog((prev) => [
            `❌ [${now}] Error: ${err.message}`,
            ...prev
          ]);
        });

      setCountdown(10);
    }, 10000);

    return () => clearInterval(intervalRef.current!);
  }, [running]);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 p-4">
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Button onClick={() => setRunning((prev) => !prev)}>
            {running ? "🛑 Stop" : "▶️ Start"}
          </Button>
          <Progress value={(10 - countdown) * 10} className="w-2/3" />
          <span className="text-sm text-muted-foreground">
            Refresh in {countdown}s
          </span>
        </div>

        <Textarea
          readOnly
          className="h-64 font-mono text-xs"
          value={log.join("\n")}
        />
      </CardContent>
    </Card>
  );
}