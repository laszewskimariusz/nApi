'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import RichTextEditor from '@/components/ui/rich-text-editor'
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react'

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

interface EditBlogPostPageProps {
  params: { slug: string }
}

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string>('')
  const [originalSlug, setOriginalSlug] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
    tags: [] as string[]
  })
  const [newTag, setNewTag] = useState('')

  // Check permissions
  if (!user || (user.role !== 'blogger' && user.role !== 'admin')) {
    router.push('/dashboard')
    return null
  }

  // Load post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/posts/${params.slug}`, {
          credentials: 'include'
        })

        if (response.ok) {
          const post = await response.json()
          setOriginalSlug(post.slug)
          setFormData({
            title: post.title || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            slug: post.slug || '',
            status: post.status || 'draft',
            featured: post.featured || false,
            tags: post.tags || []
          })
        } else if (response.status === 404) {
          setError('Post not found')
        } else {
          setError('Failed to load post')
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        setError('Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.slug])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
  }

  const handleSave = async (status: 'draft' | 'published' = formData.status) => {
    if (!formData.title || !formData.content || !formData.slug) {
      setError('Please fill in title, content, and slug')
      return
    }

    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/blog/posts/${originalSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          status,
          excerpt: formData.excerpt || stripHtmlTags(formData.content).substring(0, 200) + '...'
        }),
      })

      if (response.ok) {
        // If slug changed, redirect to new slug
        if (formData.slug !== originalSlug) {
          router.push(`/blog/manage/edit/${formData.slug}`)
        } else {
          router.push('/blog/manage')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      setError('Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError('')
    try {
      const response = await fetch(`/api/blog/posts/${originalSlug}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        router.push('/blog/manage')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      setError('Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="text-lg">Loading post...</div>
        </div>
      </div>
    )
  }

  if (error && !formData.title) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <Link href="/blog/manage">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/blog/manage">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <p className="text-muted-foreground">Update your blog post</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title..."
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Excerpt (Optional)</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of the post..."
                  className="w-full p-3 border rounded-md resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <RichTextEditor
                  content={formData.content}
                  onChange={handleContentChange}
                  placeholder="Start writing your blog post..."
                  className="min-h-[400px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Options */}
          <Card>
            <CardHeader>
              <CardTitle>Update Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured post
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button 
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {saving ? 'Publishing...' : 'Publish'}
                </Button>
                <Button 
                  onClick={handleDelete}
                  disabled={deleting}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Post'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to categorize your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>Status: <span className="font-medium capitalize">{formData.status}</span></div>
              <div>Slug: <span className="font-medium">{formData.slug}</span></div>
              <div>Featured: <span className="font-medium">{formData.featured ? 'Yes' : 'No'}</span></div>
              <div>Tags: <span className="font-medium">{formData.tags.length}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 