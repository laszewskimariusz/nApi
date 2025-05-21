// src/components/AutoFetcher.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";

export default function AutoFetcher() {
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();

  // Fetch status at regular intervals
  useEffect(() => {
    // Initial fetch
    fetchStatus();
    
    // Set up interval for status updates
    const statusInterval = setInterval(fetchStatus, 2000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // Countdown UI for visual feedback
  useEffect(() => {
    if (!running) return;

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [running]);

  // Fetch the current fetcher status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/fetcher/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      
      const data = await response.json();
      setRunning(data.isRunning);
      setLogs(data.logs || []);
      setLastFetch(data.lastFetch);
      
      // If running, reset countdown based on last fetch time
      if (data.isRunning && data.lastFetch) {
        const lastFetchTime = new Date(data.lastFetch).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - lastFetchTime) / 1000);
        const newCountdown = Math.max(0, 10 - elapsed);
        setCountdown(newCountdown);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  // Start the background fetcher
  const startFetcher = async () => {
    try {
      const response = await fetch('/api/fetcher/start', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to start fetcher');
      }
      
      const data = await response.json();
      setRunning(data.isRunning);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error starting fetcher:', error);
    }
  };

  // Stop the background fetcher
  const stopFetcher = async () => {
    try {
      const response = await fetch('/api/fetcher/stop', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop fetcher');
      }
      
      const data = await response.json();
      setRunning(data.isRunning);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error stopping fetcher:', error);
    }
  };

  // Handle toggle fetcher
  const toggleFetcher = () => {
    if (running) {
      stopFetcher();
    } else {
      startFetcher();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 p-4">
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Button onClick={toggleFetcher} disabled={!isLoggedIn}>
            {running ? "🛑 Stop" : "▶️ Start"}
          </Button>
          <Progress value={(10 - countdown) * 10} className="w-2/3" />
          <span className="text-sm text-muted-foreground">
            {running ? `Refresh in ${countdown}s` : "Stopped"}
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {lastFetch ? (
            <span>Last fetch: {new Date(lastFetch).toLocaleString()}</span>
          ) : (
            <span>No fetches yet</span>
          )}
        </div>

        <Textarea
          readOnly
          className="h-64 font-mono text-xs"
          value={logs.join("\n")}
        />
      </CardContent>
    </Card>
  );
}