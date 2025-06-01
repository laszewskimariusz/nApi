import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

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

// GET - Get single post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await client.connect()
    const db = client.db()
    
    const post = await db.collection('blog_posts').findOne({ slug: params.slug })
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if post is published or user has permission to view drafts
    const sessionCookie = request.cookies.get('session')?.value
    let currentUser = null
    if (sessionCookie) {
      try {
        // Get user from database using session email
        currentUser = await db.collection('users').findOne(
          { email: sessionCookie },
          { projection: { password: 0 } }
        )
      } catch (e) {
        console.error('Error fetching user for session:', e)
      }
    }

    // If post is draft, only author, bloggers, and admins can view it
    if (post.status === 'draft') {
      const isAdmin = currentUser?.admin === true || currentUser?.role === 'admin'
      const isBlogger = currentUser?.role === 'blogger'
      const isAuthor = currentUser?._id.toString() === post.author.id
      
      if (!currentUser || (!isAdmin && !isBlogger && !isAuthor)) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
    }

    return NextResponse.json({
      ...post,
      _id: post._id.toString()
    })

  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT - Update post (author, bloggers, and admins only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication using session cookie
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
    
    const existingPost = await db.collection('blog_posts').findOne({ slug: params.slug })
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user can edit this post
    const isAdmin = user.admin === true || user.role === 'admin'
    const isBlogger = user.role === 'blogger'
    const isAuthor = user._id.toString() === existingPost.author.id
    
    if (!isAdmin && !isBlogger && !isAuthor) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, excerpt, slug, status, featured, tags } = body

    // If slug is being changed, check if new slug already exists
    if (slug && slug !== params.slug) {
      const slugExists = await db.collection('blog_posts').findOne({ slug })
      if (slugExists) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const now = new Date()
    const updateData: any = {
      updatedAt: now
    }

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (slug !== undefined) updateData.slug = slug
    if (status !== undefined) {
      updateData.status = status
      // Set publishedAt when publishing for the first time
      if (status === 'published' && existingPost.status !== 'published') {
        updateData.publishedAt = now
      }
    }
    if (featured !== undefined) updateData.featured = featured
    if (tags !== undefined) updateData.tags = tags

    await db.collection('blog_posts').updateOne(
      { slug: params.slug },
      { $set: updateData }
    )

    return NextResponse.json({ message: 'Post updated successfully' })

  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE - Delete post (author, bloggers, and admins only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication using session cookie
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
    
    const existingPost = await db.collection('blog_posts').findOne({ slug: params.slug })
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user can delete this post
    const isAdmin = user.admin === true || user.role === 'admin'
    const isBlogger = user.role === 'blogger'
    const isAuthor = user._id.toString() === existingPost.author.id
    
    if (!isAdmin && !isBlogger && !isAuthor) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await db.collection('blog_posts').deleteOne({ slug: params.slug })

    return NextResponse.json({ message: 'Post deleted successfully' })

  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 