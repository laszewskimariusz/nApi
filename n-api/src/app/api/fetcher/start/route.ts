import { NextResponse } from "next/server";
import { startFetcher, getFetcherStatus } from "@/lib/background-fetcher";

export async function POST() {
  const started = startFetcher();
  const status = getFetcherStatus();
  
  return NextResponse.json({
    ...status,
    started
  });
}
