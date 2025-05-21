"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold">{value}</span>
      </CardContent>
    </Card>
  );
}

// Typ dla lotu
type Flight = {
  id: string;
  flightNumber: string;
  dep: string;
  arr: string;
  pilot: string;
  airline: string;
  aircraft: string;
  date: string;
  isVatsim: boolean;
};

export default function FlightsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  // Funkcja do pobierania danych
  const fetchStats = () => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
        console.log("API Data:", data);
      });
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      fetchStats();
    }, 10000); // 10 sekund
    return () => clearInterval(interval);
  }, []);

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const today = now.toISOString().slice(0, 10);
  const zulu = now.toISOString().slice(11, 19) + "Z";

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-8">
      <Card>
        <CardContent className="space-y-8">
          <h1 className="text-3xl font-bold mb-2">Flights Dashboard</h1>
          {mounted && (
            <div className="mb-4 text-muted-foreground flex flex-col md:flex-row gap-2 md:gap-6 text-sm">
              <span>Today: <span className="font-mono">{today}</span></span>
              <span>Zulu time: <span className="font-mono">{zulu}</span></span>
            </div>
          )}
          {loading || !stats ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Flights" value={stats.totalFlights} />
                <StatCard label="Total VATSIM Flights" value={stats.totalVatsimFlights} />
                <StatCard label="Last 30 Days Flights" value={stats.last30DaysFlights} />
                <StatCard label="Last 30 Days VATSIM Flights" value={stats.last30DaysVatsimFlights} />
              </div>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Flights vs VATSIM Flights (Last 30 Days)</h2>
                  <div className="w-full overflow-x-auto">
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData}>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="total" stroke="#6366f1" fill="#6366f1" name="Total Flights" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="vatsim" stroke="#22d3ee" fill="#22d3ee" name="VATSIM Flights" fillOpacity={0.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {stats.latestFlights && stats.latestFlights.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Latest Flights</h2>
                    <div className="overflow-hidden">
                      <div className="max-h-[600px] overflow-y-auto rounded border">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead>Flight #</TableHead>
                              <TableHead>Airline</TableHead>
                              <TableHead>Route</TableHead>
                              <TableHead>Aircraft</TableHead>
                              <TableHead>Pilot</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.latestFlights.map((flight: Flight) => (
                              <TableRow key={flight.id}>
                                <TableCell className="font-medium">{flight.flightNumber}</TableCell>
                                <TableCell>{flight.airline}</TableCell>
                                <TableCell>{flight.dep} → {flight.arr}</TableCell>
                                <TableCell>{flight.aircraft}</TableCell>
                                <TableCell>{flight.pilot}</TableCell>
                                <TableCell>{formatDate(flight.date)}</TableCell>
                                <TableCell>
                                  {flight.isVatsim ? (
                                    <Badge className="bg-blue-500">VATSIM</Badge>
                                  ) : (
                                    <Badge variant="outline">Offline</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
} 