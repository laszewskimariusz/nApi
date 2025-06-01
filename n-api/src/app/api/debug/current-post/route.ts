import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

// Helper function to strip HTML tags for testing
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

export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db()
    
    // Get latest post or specific one
    const posts = await db.collection('blog_posts').find({}).sort({ createdAt: -1 }).limit(3).toArray()
    
    const debugData = posts.map(post => ({
      title: post.title,
      slug: post.slug,
      excerptOriginal: post.excerpt,
      excerptCleaned: stripHtmlTags(post.excerpt || ''),
      contentPreview: post.content?.substring(0, 100),
      contentCleaned: stripHtmlTags(post.content || '').substring(0, 100),
    }))

    return NextResponse.json({
      message: 'Debug data for recent posts',
      posts: debugData
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 