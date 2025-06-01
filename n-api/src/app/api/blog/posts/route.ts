import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

interface BlogPost {
  title: string
  content: string
  excerpt: string
  slug: string
  author: {
    id: string
    name: string
    email: string
  }
  status: 'draft' | 'published'
  featured: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

// Helper function to strip HTML tags for excerpt generation
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular space
    .replace(/&amp;/g, '&')  // Replace &amp; with &
    .replace(/&lt;/g, '<')   // Replace &lt; with <
    .replace(/&gt;/g, '>')   // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'")  // Replace &#39; with '
    .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
    .trim()                  // Remove leading/trailing whitespace
}

// GET - List posts (public endpoint for published posts, all posts for bloggers/admins)
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const author = searchParams.get('author')
    const tag = searchParams.get('tag')
    const featured = searchParams.get('featured')

    // Check if user is authenticated for admin/private endpoints
    const sessionCookie = request.cookies.get('session')?.value
    let currentUser = null
    if (sessionCookie) {
      try {
        // Get user from database using session email
        currentUser = await db.collection('users').findOne(
          { email: sessionCookie },
          { projection: { password: 0 } }
        )
        console.log('GET posts - current user:', currentUser ? {
          id: currentUser._id.toString(),
          email: currentUser.email,
          role: currentUser.role,
          admin: currentUser.admin
        } : 'none')
      } catch (e) {
        console.error('Error fetching user for session:', e)
      }
    }

    // Build query
    let query: any = {}
    
    // Check if user has permissions to see all posts (including drafts)
    const isAdmin = currentUser?.admin === true || currentUser?.role === 'admin'
    const isBlogger = currentUser?.role === 'blogger'
    const hasPermissions = isAdmin || isBlogger
    
    // If not authenticated or not a blogger/admin, only show published posts
    if (!hasPermissions) {
      query.status = 'published'
    } else if (status) {
      query.status = status
    }

    if (author) query['author.id'] = author
    if (tag) query.tags = { $in: [tag] }
    if (featured === 'true') query.featured = true

    const skip = (page - 1) * limit

    const posts = await db.collection('blog_posts')
      .find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection('blog_posts').countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        _id: post._id.toString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST - Create new post (bloggers and admins only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication using session cookie (like /api/auth/me)
    const sessionCookie = request.cookies.get('session')?.value
    console.log('Session cookie:', sessionCookie)
    
    if (!sessionCookie) {
      console.log('No session cookie found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await client.connect()
    const db = client.db()
    
    console.log('Looking for user with email:', sessionCookie)
    console.log('Database name:', db.databaseName)
    
    // List all collections to debug
    const collections = await db.listCollections().toArray()
    console.log('Available collections:', collections.map(c => c.name))
    
    // Get user from database using session email
    const user = await db.collection('users').findOne(
      { email: sessionCookie },
      { projection: { password: 0 } }
    )
    
    console.log('User found:', user ? 'YES' : 'NO')
    if (!user) {
      // Try to find any user to see the structure
      const anyUser = await db.collection('users').findOne({}, { projection: { password: 0 } })
      console.log('Sample user structure:', anyUser)
      console.log('User not found for session:', sessionCookie)
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    console.log('Found user:', {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      admin: user.admin,
      activated: user.activated
    })

    // Check if user is blogger or admin
    const isAdmin = user.admin === true || user.role === 'admin'
    const isBlogger = user.role === 'blogger'
    
    console.log('Blog post creation auth check:', {
      userId: user._id.toString(),
      userRole: user.role,
      userAdmin: user.admin,
      isAdmin,
      isBlogger,
      hasPermission: isAdmin || isBlogger
    })
    
    if (!isAdmin && !isBlogger) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, excerpt, slug, status, featured, tags } = body

    // Validate required fields
    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: 'Title, content, and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingPost = await db.collection('blog_posts').findOne({ slug })
    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      )
    }

    const now = new Date()
    const newPost: BlogPost = {
      title,
      content,
      excerpt: excerpt || stripHtmlTags(content).substring(0, 200) + '...',
      slug,
      author: {
        id: user._id.toString(),
        name: user.username || user.name || user.email.split('@')[0],
        email: user.email
      },
      status: status || 'draft',
      featured: featured || false,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
      ...(status === 'published' && { publishedAt: now })
    }

    const result = await db.collection('blog_posts').insertOne(newPost)

    return NextResponse.json({
      message: 'Post created successfully',
      postId: result.insertedId.toString()
    })

  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 