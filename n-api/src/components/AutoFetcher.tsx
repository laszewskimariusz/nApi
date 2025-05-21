// src/components/AutoFetcher.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the fetchStatus function to avoid recreating it on each render
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Set up interval for status updates with different intervals based on autoRefresh
  useEffect(() => {
    // Use a more frequent interval when autoRefresh is enabled
    const interval = autoRefresh ? 2000 : 10000;
    
    const statusInterval = setInterval(fetchStatus, interval);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [autoRefresh, fetchStatus]);

  // Countdown UI for visual feedback
  useEffect(() => {
    if (!running) return;

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [running]);

  // Start the background fetcher
  const startFetcher = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/fetcher/start', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to start fetcher');
      }
      
      const data = await response.json();
      setRunning(data.isRunning);
      setLogs(data.logs || []);
      
      // Immediately show as running to avoid UI delay
      if (data.started) {
        setRunning(true);
      }
      
      // Refresh status to show updated state
      fetchStatus();
    } catch (error) {
      console.error('Error starting fetcher:', error);
      setIsLoading(false);
    }
  };

  // Stop the background fetcher
  const stopFetcher = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/fetcher/stop', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop fetcher');
      }
      
      const data = await response.json();
      setRunning(data.isRunning);
      setLogs(data.logs || []);
      
      // Immediately show as stopped to avoid UI delay
      if (data.stopped) {
        setRunning(false);
      }
      
      // Refresh status to show updated state
      fetchStatus();
    } catch (error) {
      console.error('Error stopping fetcher:', error);
      setIsLoading(false);
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
          <div className="flex gap-2">
            <Button 
              onClick={toggleFetcher} 
              disabled={!isLoggedIn || isLoading}
              className={running ? "bg-red-500 hover:bg-red-600" : ""}
            >
              {isLoading ? "Loading..." : running ? "🛑 Stop" : "▶️ Start"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStatus} 
              disabled={!isLoggedIn || isLoading}
            >
              🔄 Refresh Status
            </Button>
          </div>
          <Progress value={(10 - countdown) * 10} className="w-2/3" />
          <span className="text-sm text-muted-foreground">
            {running ? `Refresh in ${countdown}s` : "Stopped"}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {lastFetch ? (
              <span>Last fetch: {new Date(lastFetch).toLocaleString()}</span>
            ) : (
              <span>No fetches yet</span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-100" : ""}
          >
            {autoRefresh ? "Auto-refresh ON (2s)" : "Auto-refresh OFF (10s)"}
          </Button>
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