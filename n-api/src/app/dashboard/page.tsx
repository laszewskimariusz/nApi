"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [count, setCount] = useState<number | null>(null)
  const [flights, setFlights] = useState<any[]>([])
  const [loadingSync, setLoadingSync] = useState(false)

  async function loadData() {
    try {
      const resStatus = await fetch("/api/status").then(res => res.json())
      setStatus(resStatus.ok ? "ok" : "error")

      const resCount = await fetch("/api/flights/count").then(res => res.json())
      setCount(resCount.count)

      const resRecent = await fetch("/api/flights/recent").then(res => res.json())
      setFlights(resRecent.flights)
    } catch {
      setStatus("error")
    }
  }

  async function syncFlights() {
    setLoadingSync(true)
    await fetch("/api/sync", { method: "POST" })
    setLoadingSync(false)
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

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
            ✈️ {flight.departure} → {flight.arrival} —{" "}
            {typeof flight.aircraft === "string" ? flight.aircraft : JSON.stringify(flight.aircraft)}{" "}
            ({flight.pilot})
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
