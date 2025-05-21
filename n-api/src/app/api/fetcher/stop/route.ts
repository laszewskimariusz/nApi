import { NextResponse } from "next/server";
import { stopFetcher, getFetcherStatus } from "@/lib/background-fetcher";

export async function POST() {
  const stopped = stopFetcher();
  const status = getFetcherStatus();
  
  return NextResponse.json({
    ...status,
    stopped
  });
}
