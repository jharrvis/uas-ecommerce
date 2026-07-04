import { NextRequest, NextResponse } from 'next/server'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.nim || !body.cp || !body.base64Data) {
      return NextResponse.json({ success: false, message: 'nim, cp, base64Data wajib diisi' }, { status: 400 })
    }

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ success: false, message: 'APPS_SCRIPT_URL belum dikonfigurasi' }, { status: 500 })
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'uploadScreenshot', ...body }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('Upload proxy error:', err)
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
