import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react'

interface BlogPost {
  _id: string
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
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/posts/${slug}`, {
      cache: 'no-store' // Always fetch fresh data
    })
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

async function getRelatedPosts(slug: string, tags: string[]): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/posts?limit=3`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    // Filter out current post and prioritize posts with common tags
    return data.posts
      .filter((post: BlogPost) => post.slug !== slug)
      .slice(0, 3)
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

function sanitizeHtml(html: string): string {
  // Basic HTML sanitization for security
  // In production, consider using a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:[^"']*/gi, '')
}

function stripHtmlTags(html: string): string {
  // Remove all HTML tags and decode entities for excerpt display
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(params.slug, post.tags)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article */}
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            {/* Meta info */}
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By {post.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
              {post.featured && (
                <Badge className="bg-blue-100 text-blue-800">Featured</Badge>
              )}
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-lg text-muted-foreground italic">{stripHtmlTags(post.excerpt)}</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert
                prose-headings:font-bold 
                prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8
                prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
                prose-p:mb-4 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
                prose-strong:font-bold
                prose-em:italic
                prose-ul:list-disc prose-ul:ml-6
                prose-ol:list-decimal prose-ol:ml-6
                prose-li:mb-2
                prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto
                dark:prose-invert
                dark:prose-code:bg-gray-800
                dark:prose-pre:bg-gray-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">About the Author</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{post.author.name}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {formatDate(post.updatedAt)}
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost._id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      <Link href={`/blog/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {relatedPost.author.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(relatedPost.publishedAt || relatedPost.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
} 