import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

// Helper function to validate file type
const isValidImageType = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return allowedTypes.includes(file.type)
}

// Helper function to validate file size (max 5MB)
const isValidFileSize = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  return file.size <= maxSize
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
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

    // Check if user has permission to upload images (bloggers and admins)
    const isAdmin = user.admin === true || user.role === 'admin'
    const isBlogger = user.role === 'blogger'
    
    if (!isAdmin && !isBlogger) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!isValidImageType(file)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueId = uuidv4()
    const fileName = `blog-${uniqueId}.${fileExtension}`
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Define upload path
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'blog')
    const filePath = join(uploadDir, fileName)

    // Create directory if it doesn't exist
    try {
      await writeFile(join(uploadDir, '.gitkeep'), '')
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Save file
    await writeFile(filePath, buffer)
    
    // Create public URL
    const imageUrl = `/uploads/blog/${fileName}`

    // Optionally, save upload info to database for tracking
    await db.collection('blog_uploads').insertOne({
      fileName,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: imageUrl,
      uploadedBy: {
        id: user._id.toString(),
        email: user.email,
        name: user.username || user.name || user.email.split('@')[0]
      },
      uploadedAt: new Date()
    })

    console.log(`Image uploaded successfully: ${imageUrl}`)

    return NextResponse.json({
      url: imageUrl,
      fileName,
      size: file.size
    })

  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 