'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'

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

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [allTags, setAllTags] = useState<string[]>([])

  const fetchPosts = async (page = 1, tag = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '6',
        ...(tag && { tag })
      })

      const response = await fetch(`/api/blog/posts?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setPagination(data.pagination)
        
        // Extract unique tags
        const tags = data.posts.flatMap((post: BlogPost) => post.tags)
        setAllTags([...new Set(tags)] as string[])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeaturedPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts?featured=true&limit=3')
      if (response.ok) {
        const data = await response.json()
        setFeaturedPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching featured posts:', error)
    }
  }

  useEffect(() => {
    fetchPosts(currentPage, selectedTag)
    fetchFeaturedPosts()
  }, [currentPage, selectedTag])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Aviation Blog</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Professional insights, pilot stories, and aviation industry updates from the Topsky.app community
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Featured Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <Card key={post._id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-blue-100 text-blue-800">Featured</Badge>
                    <CardTitle className="group-hover:text-blue-600 transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {post.author.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Recent Posts</h2>
              <div className="text-muted-foreground">
                {pagination.total} posts
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {posts.map((post) => (
                <Card key={post._id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-blue-50"
                          onClick={() => setSelectedTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="group-hover:text-blue-600 transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {post.author.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>
                    </div>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="outline" size="sm" className="group">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrev}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedTag === '' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTag('')
                      setCurrentPage(1)
                    }}
                  >
                    All
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTag(tag)
                        setCurrentPage(1)
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About Our Blog</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Stay updated with the latest aviation industry news, pilot experiences, 
                  aircraft reviews, and professional insights from the aviation community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 