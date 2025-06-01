import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { cookies } from "next/headers";

const mongo = new MongoClient(process.env.MONGODB_URI!);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isActive } = await req.json();
    
    const cookieStore = cookies();
    const session = (await cookieStore).get("session");
    
    if (!session?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await mongo.connect();
    const db = mongo.db();
    const users = db.collection("users");
    
    // Check if the requesting user is admin
    const requestingUser = await users.findOne({ email: session.value });
    if (!requestingUser || (requestingUser.role !== 'admin' && requestingUser.admin !== true)) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Update user status
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          activated: isActive,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Status updated successfully" });
  } catch (err: any) {
    console.error("Update user status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await mongo.close();
  }
} 