import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { cookies } from "next/headers";

const mongo = new MongoClient(process.env.MONGODB_URI!);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const session = (await cookieStore).get("session");
    
    if (!session?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await mongo.connect();
    const db = mongo.db();
    const users = db.collection("users");
    
    // First check if the requesting user is admin
    const requestingUser = await users.findOne({ email: session.value });
    if (!requestingUser || (requestingUser.role !== 'admin' && requestingUser.admin !== true)) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Get all users (excluding passwords)
    const allUsers = await users.find(
      {},
      { 
        projection: { 
          password: 0 // Exclude password from response
        },
        sort: { createdAt: -1 } // Sort by newest first
      }
    ).toArray();

    // Transform MongoDB users to our User interface
    const userData = allUsers.map(user => ({
      id: user._id.toString(),
      email: user.email,
      username: user.username || user.email.split('@')[0],
      role: user.role || (user.admin === true ? 'admin' : 'user'),
      isActive: user.activated || false,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio
      },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    return NextResponse.json(userData);
  } catch (err: any) {
    console.error("Get users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await mongo.close();
  }
} 