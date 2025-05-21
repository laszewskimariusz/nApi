import { NextResponse } from "next/server";
import { getFetcherStatus } from "@/lib/background-fetcher";

export async function GET() {
  try {
    const status = getFetcherStatus();

    // Get current server timestamp
    const now = new Date();
    
    // Calculate time since last fetch if available
    let timeSinceLastFetch = null;
    if (status.lastFetch) {
      const lastFetchTime = new Date(status.lastFetch);
      timeSinceLastFetch = Math.floor((now.getTime() - lastFetchTime.getTime()) / 1000);
    }
    
    // Add enhanced status information
    const enhancedStatus = {
      ...status,
      serverTime: now.toISOString(),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: now.toISOString(),
      },
      meta: {
        timeSinceLastFetch,
        nextFetchIn: timeSinceLastFetch !== null ? Math.max(0, 10 - timeSinceLastFetch) : null
      }
    };
    
    return NextResponse.json(enhancedStatus);
  } catch (error) {
    console.error("Error getting fetcher status:", error);
    return NextResponse.json(
      { error: "Failed to get fetcher status", details: String(error) }, 
      { status: 500 }
    );
  }
}
