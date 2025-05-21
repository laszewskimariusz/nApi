import { NextResponse } from "next/server";
import { stopFetcher, getFetcherStatus } from "@/lib/background-fetcher";

export async function POST() {
  try {
    const stopped = stopFetcher();
    
    // Jeśli fetcher był już zatrzymany, od razu zwróć status
    if (!stopped) {
      const status = getFetcherStatus();
      return NextResponse.json({
        ...status,
        stopped: false,
        message: "Fetcher was already stopped"
      });
    }
    
    // Daj trochę czasu na zakończenie operacji zatrzymania
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const status = getFetcherStatus();
    
    return NextResponse.json({
      ...status,
      stopped
    });
  } catch (error) {
    console.error("Error stopping fetcher:", error);
    return NextResponse.json(
      { error: "Failed to stop fetcher", details: String(error) }, 
      { status: 500 }
    );
  }
}
