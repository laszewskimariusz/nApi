import { stopFetcher } from "@/lib/fetcher";
import { NextResponse } from "next/server";

export async function GET() {
  stopFetcher();
  return NextResponse.json({ status: "stopped" });
}
