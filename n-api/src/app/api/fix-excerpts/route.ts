import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

// Helper function to strip HTML tags
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

export async function POST(request: NextRequest) {
  try {
    // Check authentication - tylko admini mogą to uruchomić
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await client.connect()
    const db = client.db()
    
    // Get user from database using session email
    const user = await db.collection('users').findOne(
      { email: sessionCookie },
      { projection: { password: 0 } }
    )
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Only admins can fix excerpts
    const isAdmin = user.admin === true || user.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all posts
    const posts = await db.collection('blog_posts').find({}).toArray()
    
    let fixedCount = 0
    const results = []
    
    for (const post of posts) {
      if (post.content) {
        // Generate new clean excerpt from content
        const cleanExcerpt = stripHtmlTags(post.content).substring(0, 200) + '...'
        
        // Update post with new excerpt
        await db.collection('blog_posts').updateOne(
          { _id: post._id },
          { 
            $set: { 
              excerpt: cleanExcerpt,
              updatedAt: new Date()
            } 
          }
        )
        
        fixedCount++
        results.push({
          title: post.title,
          slug: post.slug,
          oldExcerpt: post.excerpt?.substring(0, 50) + '...',
          newExcerpt: cleanExcerpt.substring(0, 50) + '...'
        })
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixedCount} posts`,
      totalPosts: posts.length,
      results: results
    })

  } catch (error) {
    console.error('Error fixing excerpts:', error)
    return NextResponse.json(
      { error: 'Failed to fix excerpts' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 