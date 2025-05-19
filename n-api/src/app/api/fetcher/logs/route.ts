import { getLogs } from "@/lib/fetcher";
import { NextResponse } from "next/server";

export async function GET() {
  const logs = getLogs();
  return new NextResponse(logs, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
