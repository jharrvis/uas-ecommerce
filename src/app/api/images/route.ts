import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const imageUrl = searchParams.get('url')
  const filename = sanitizeFilename(searchParams.get('filename') || 'image.jpg')
  const download = searchParams.get('download') === '1'

  if (!imageUrl) {
    return NextResponse.json(
      { success: false, message: 'Image URL is required' },
      { status: 400 }
    )
  }

  try {
    const finalUrl = toProxySourceUrl(imageUrl)

    // Fetch the image from the final URL
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
      },
      cache: 'force-cache',
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Get the image buffer
    const buffer = await response.arrayBuffer()

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to proxy image' 
      },
      { status: 500 }
    )
  }
}

function toProxySourceUrl(url: string): string {
  if (!url.includes('drive.google.com')) {
    return url
  }

  const fileId = extractDriveFileId(url)
  if (!fileId) {
    return url
  }

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
}

function extractDriveFileId(url: string): string | null {
  // Format: https://drive.google.com/file/d/FILE_ID/view?...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return fileMatch[1]
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return openMatch[1]
  }

  // Format: https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) {
    return ucMatch[1]
  }

  return null
}

function sanitizeFilename(filename: string): string {
  const cleaned = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .trim()

  return cleaned || 'image.jpg'
}
