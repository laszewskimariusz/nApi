import path from "path";
import fs from "fs";

const LOG_FILE = path.resolve(process.cwd(), "logs", "sync.log");

export async function GET() {
  if (!fs.existsSync(LOG_FILE)) {
    return new Response(JSON.stringify({ error: "Log file not found" }), { status: 404 });
  }

  return new Response(
    JSON.stringify({ file: "sync.log" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
