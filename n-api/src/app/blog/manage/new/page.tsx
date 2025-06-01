'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import RichTextEditor from '@/components/ui/rich-text-editor'
import { ArrowLeft, Save, Eye } from 'lucide-react'

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

export default function NewBlogPostPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => {
      const newSlug = prev.slug || generateSlug(title)
      return {
        ...prev,
        title,
        // Only auto-generate slug if current slug is empty or matches the generated pattern
        ...((!prev.slug || prev.slug === generateSlug(prev.title)) && { slug: newSlug })
      }
    })
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

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!formData.title || !formData.content || !formData.slug) {
      setError('Please fill in title, content, and slug')
      return
    }

    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/blog/posts', {
        method: 'POST',
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
        const data = await response.json()
        router.push('/blog/manage')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save post')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      setError('Failed to save post')
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-3xl font-bold">Create New Post</h1>
          <p className="text-muted-foreground">Write and publish your blog post</p>
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
              <CardTitle>Publish</CardTitle>
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
              <div>Status: <span className="font-medium">Draft</span></div>
              <div>Author: <span className="font-medium">{user?.username || user?.email}</span></div>
              <div>Created: <span className="font-medium">Now</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 