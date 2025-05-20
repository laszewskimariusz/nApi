import { connectToDB } from "@/lib/mongo";

export async function GET() {
  const db = await connectToDB();

  const logs = await db
    .collection("logs")
    // ✅ albo usuń .find({ type: "sync" }) jeśli zapisujesz różne typy
    .find({})
    .sort({ timestamp: -1 })
    .limit(100)
    .toArray();

  return new Response(JSON.stringify({ logs }), {
    headers: { "Content-Type": "application/json" },
  });
}
