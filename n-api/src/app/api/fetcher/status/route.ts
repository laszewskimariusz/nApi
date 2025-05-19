import { getFetcherStatus } from "@/lib/fetcher";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ running: getFetcherStatus() });
}
