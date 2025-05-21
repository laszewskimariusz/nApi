"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";

type Flight = {
  _id: string;
  callsign?: string;
  flightNumber?: string;
  departure?: string;
  arrival?: string;
  isVatsim?: boolean;
  network?: {
    name?: string;
    pings?: number;
    ratio?: number;
  };
  importedAt?: string;
  [key: string]: any;
};

export default function RecentFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [processingFlightId, setProcessingFlightId] = useState<string | null>(null);

  // Pobierz ostatnie loty
  useEffect(() => {
    // Początkowe pobranie
    fetchRecentFlights();

    // Ustawienie interwału tylko jeśli autoRefresh jest włączone
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchRecentFlights, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);

  const fetchRecentFlights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flights/recent');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`);
      }
      
      const data = await response.json();
      setFlights(data.flights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flights');
      console.error('Error fetching flights:', err);
    } finally {
      setLoading(false);
    }
  };

  // Oznacz lot jako VATSIM lub usuń oznaczenie
  const toggleVatsimTag = async (flight: Flight) => {
    try {
      setProcessingFlightId(flight._id);
      
      const isVatsimFlight = flight.isVatsim || (flight.network?.name === 'vatsim');
      const untag = isVatsimFlight; // Jeśli jest już VATSIM, to usuń oznaczenie
      
      const response = await fetch('/api/flights/tag-vatsim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightId: flight._id,
          untag
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${untag ? 'untag' : 'tag'} flight: ${response.status}`);
      }

      const result = await response.json();
      
      // Zaktualizuj dane lotu lokalnie
      setFlights(flights.map(f => 
        f._id === flight._id ? { ...f, isVatsim: !untag } : f
      ));
      
      // Pokaż powiadomienie
      toast({
        title: untag ? "VATSIM tag removed" : "Flight tagged as VATSIM",
        description: `Flight ${flight.callsign || flight.flightNumber} has been ${untag ? 'untagged' : 'tagged'}.`,
        variant: "default",
      });
      
    } catch (err) {
      console.error('Error toggling VATSIM tag:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessingFlightId(null);
    }
  };

  // Funkcja do potwierdzenia i usunięcia lotu
  const handleDeleteFlight = async (flight: Flight) => {
    const callsign = getCallsign(flight);
    const confirmed = window.confirm(
      `Are you sure you want to delete flight ${callsign}?\nThis action cannot be undone.`
    );
    
    if (confirmed) {
      await deleteFlight(flight);
    }
  };

  // Usuń lot z bazy danych
  const deleteFlight = async (flight: Flight) => {
    try {
      setProcessingFlightId(flight._id);
      
      const response = await fetch('/api/flights/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightId: flight._id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete flight: ${response.status}`);
      }

      const result = await response.json();
      
      // Usuń lot z lokalnej tablicy
      setFlights(flights.filter(f => f._id !== flight._id));
      
      // Pokaż powiadomienie
      toast({
        title: "Flight deleted",
        description: `Flight ${flight.callsign || flight.flightNumber} has been deleted from the database.`,
        variant: "default",
      });
      
    } catch (err) {
      console.error('Error deleting flight:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessingFlightId(null);
    }
  };

  // Formatuj czas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Wyświetl callsign lub flightNumber
  const getCallsign = (flight: Flight) => {
    return flight.callsign || flight.flightNumber || 'N/A';
  };

  // Sprawdź, czy lot jest z VATSIM
  const isVatsimFlight = (flight: Flight) => {
    // Sprawdź flagę isVatsim
    if (flight.isVatsim) return true;
    
    // Sprawdź pole network
    if (flight.network && flight.network.name === 'vatsim') return true;
    
    return false;
  };

  if (loading && flights.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading flights...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center py-4 text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Flights</CardTitle>
            <CardDescription>
              Last {flights.length} flights fetched from the airline API
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRecentFlights}
              disabled={loading}
            >
              {loading ? "Loading..." : "🔄 Refresh Flights"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-100" : ""}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Callsign</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Imported At</TableHead>
                <TableHead className="w-[120px]">VATSIM</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.map((flight) => (
                <TableRow key={flight._id}>
                  <TableCell className="font-medium">{getCallsign(flight)}</TableCell>
                  <TableCell>
                    {flight.departure || flight.dep?.icao || '???'} → {flight.arrival || flight.arr?.icao || '???'}
                  </TableCell>
                  <TableCell>{formatDate(flight.importedAt)}</TableCell>
                  <TableCell>
                    {isVatsimFlight(flight) ? (
                      <Badge className="bg-green-600 cursor-pointer" onClick={() => toggleVatsimTag(flight)}>
                        VATSIM
                        {flight.network && flight.network.pings && (
                          <span className="ml-1">({flight.network.pings})</span>
                        )}
                      </Badge>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => toggleVatsimTag(flight)}
                      >
                        Not VATSIM
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedFlight(flight)}
                          >
                            View JSON
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[80vw] max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>
                              Flight Data: {getCallsign(flight)}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh]">
                            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                              {JSON.stringify(flight, null, 2)}
                            </pre>
                          </ScrollArea>
                          <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                          </DialogClose>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500"
                        disabled={processingFlightId === flight._id}
                        onClick={() => handleDeleteFlight(flight)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 