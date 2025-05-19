// src/app/api/fetcher/logs/route.ts
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file") || "fetcher";
  const filePath = path.resolve(process.cwd(), `logs/${file}.log`);

  if (!fs.existsSync(filePath)) {
    return new Response("Log not found", { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const last30Lines = content.trim().split("\n").slice(-30).join("\n");

  return new Response(last30Lines, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}