import { startFetcher } from "@/lib/fetcher";
import { NextResponse } from "next/server";

export async function GET() {
  startFetcher();
  return NextResponse.json({ status: "started" });
}
