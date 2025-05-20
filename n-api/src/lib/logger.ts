import { connectToDB } from "./mongo"; // teraz działa poprawnie

export async function logMessage(type: string, message: string) {
  const db = await connectToDB();

  await db.collection("logs").insertOne({
    type,
    message,
    timestamp: new Date(),
  });
}
