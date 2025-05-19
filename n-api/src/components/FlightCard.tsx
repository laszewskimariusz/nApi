// src/components/FlightCard.tsx
"use client";

import Image from "next/image";

export default function FlightCard({ flight }: { flight: any }) {
  const {
    pilot,
    aircraft,
    flightNumber,
    airline,
    dep,
    arr,
    payload,
    ofp,
    network,
    location,
    totals,
    createdAt,
    updatedAt,
  } = flight;

  return (
    <div className="border rounded-md p-4 bg-white/5 backdrop-blur-sm shadow-md text-sm space-y-2">
      {/* Pilot */}
      <div className="flex items-center gap-3">
        {pilot?.avatar && (
          <Image
            src={`https://your-cdn.com/avatars/${pilot.avatar}`} // dostosuj url jeśli masz CDN lub obrazki lokalnie
            alt={pilot.fullname}
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <div>
          <p className="font-semibold">{pilot?.fullname || "Unknown Pilot"}</p>
          <p className="text-xs text-muted-foreground">Pilot</p>
        </div>
      </div>

      {/* Aircraft */}
      <div>
        <p className="font-semibold">{aircraft?.name || "Unknown Aircraft"}</p>
        <p className="text-xs text-muted-foreground">
          ICAO: {aircraft?.airframe?.icao || "N/A"} | SimBrief: {aircraft?.simBriefProfile || "N/A"}
        </p>
      </div>

      {/* Flight Number & Airline */}
      <div className="flex items-center gap-2">
        {airline?.logo && (
          <Image
            src={`https://your-cdn.com/logos/${airline.logo}`} // analogicznie logo
            alt={airline.fullname}
            width={24}
            height={24}
          />
        )}
        <p className="font-semibold">
          {airline?.shortname || airline?.fullname || "Unknown Airline"} {flightNumber}
        </p>
      </div>

      {/* Route */}
      <div>
        <p>
          <span className="font-semibold">{dep?.icao}</span> - {dep?.name}, {dep?.city} &rarr;{" "}
          <span className="font-semibold">{arr?.icao}</span> - {arr?.name}, {arr?.city}
        </p>
      </div>

      {/* Payload */}
      <div>
        <p>
          Passengers: {payload?.pax ?? "N/A"} / {payload?.paxCapacity ?? "?"} | Cargo: {payload?.cargo ?? "N/A"} / {payload?.cargoCapacity ?? "?"}
        </p>
      </div>

      {/* OFP (Operational Flight Plan) */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <p>Dep: {new Date(ofp?.depTime).toLocaleString() || "N/A"}</p>
          <p>Arr: {new Date(ofp?.arrTime).toLocaleString() || "N/A"}</p>
          <p>Duration: {ofp?.duration ?? "N/A"} min</p>
          <p>Delay: {ofp?.delay ?? 0} min</p>
        </div>
        <div>
          <p>Actual Dep: {new Date(ofp?.depTimeAct).toLocaleString() || "N/A"}</p>
          <p>Actual Arr: {new Date(ofp?.arrTimeAct).toLocaleString() || "N/A"}</p>
          <p>Rating: {ofp?.rating ?? "N/A"}</p>
          <p>Simulator: {ofp?.simulator || "N/A"}</p>
        </div>
      </div>

      {/* Network */}
      <div>
        <p className="text-xs text-muted-foreground">
          Network: {network?.name || "N/A"} | Version: {network?.version || "N/A"}
        </p>
      </div>

      {/* Location */}
      <div className="text-xs text-muted-foreground">
        <p>
          Location: {location?.lat?.toFixed(4) ?? "N/A"}, {location?.lon?.toFixed(4) ?? "N/A"}, Alt:{" "}
          {location?.alt ?? "N/A"} m, Heading: {location?.hdg?.toFixed(1) ?? "N/A"}°
        </p>
      </div>

      {/* Totals */}
      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
        <p>Flight time: {totals?.time ?? "N/A"} min</p>
        <p>Distance: {totals?.distance ?? "N/A"} km</p>
        <p>Fuel used: {totals?.fuel ?? "N/A"} kg</p>
        <p>Revenue: {totals?.revenue ?? "N/A"} $</p>
        <p>Balance: {totals?.balance ?? "N/A"} $</p>
      </div>

      {/* Dates */}
      <div className="text-xs text-muted-foreground">
        <p>Created: {new Date(createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
