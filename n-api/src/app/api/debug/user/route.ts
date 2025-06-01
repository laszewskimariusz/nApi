import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session found' })
    }

    await client.connect()
    const db = client.db()
    
    const user = await db.collection('users').findOne(
      { email: sessionCookie },
      { projection: { password: 0 } }
    )
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' })
    }

    const permissions = {
      isAdmin: user.admin === true || user.role === 'admin',
      isBlogger: user.role === 'blogger',
      canCreatePosts: user.admin === true || user.role === 'admin' || user.role === 'blogger'
    }

    return NextResponse.json({
      session: sessionCookie,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        admin: user.admin,
        activated: user.activated,
        firstName: user.firstName,
        lastName: user.lastName
      },
      permissions,
      cookies: {
        session: request.cookies.get('session')?.value,
        user: request.cookies.get('user')?.value,
        logged_in: request.cookies.get('logged_in')?.value
      }
    })

  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ error: 'Internal server error' })
  } finally {
    await client.close()
  }
} 