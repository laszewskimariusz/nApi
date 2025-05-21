import { NextResponse } from "next/server";
import { getFetcherStatus } from "@/lib/background-fetcher";

export async function GET() {
  const status = getFetcherStatus();
  
  return NextResponse.json(status);
}
