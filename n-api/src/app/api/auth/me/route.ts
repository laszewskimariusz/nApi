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
    
    const user = await users.findOne(
      { email: session.value },
      { 
        projection: { 
          password: 0 // Exclude password from response
        } 
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform MongoDB user to our User interface
    const userData = {
      id: user._id.toString(),
      email: user.email,
      username: user.username || user.email.split('@')[0], // Use email prefix if no username
      role: user.role || (user.admin === true ? 'admin' : 'user'), // Support legacy admin field
      isActive: user.activated || false,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio
      }
    };

    return NextResponse.json(userData);
  } catch (err: any) {
    console.error("Get user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await mongo.close();
  }
} 