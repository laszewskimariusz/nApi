// src/app/api/sync/route.ts
import { NextResponse } from "next/server";
import { runFullSync } from "@/lib/sync";

export async function POST() {
  try {
    const result = await runFullSync();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sync failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
