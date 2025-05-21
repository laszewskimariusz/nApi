import { NextResponse } from "next/server";
import { startFetcher, getFetcherStatus } from "@/lib/background-fetcher";

export async function POST() {
  try {
    const started = startFetcher();
    
    // Daj więcej czasu na zakończenie pierwszego fetcha (1 sekunda zamiast 500ms)
    // Jeśli fetcher jest już uruchomiony, od razu zwróć status
    if (!started) {
      // Fetcher was already running, return current status immediately
      const status = getFetcherStatus();
      return NextResponse.json({
        ...status,
        started: false,
        message: "Fetcher was already running"
      });
    }
    
    // Poczekaj dłużej na startup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status = getFetcherStatus();
    
    return NextResponse.json({
      ...status,
      started
    });
  } catch (error) {
    console.error("Error starting fetcher:", error);
    return NextResponse.json(
      { error: "Failed to start fetcher", details: String(error) }, 
      { status: 500 }
    );
  }
}
