import { NextRequest, NextResponse } from 'next/server'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || ''

function missingConfig() {
  return NextResponse.json(
    { success: false, message: 'APPS_SCRIPT_URL belum dikonfigurasi' },
    { status: 500 }
  )
}

async function readAppsScriptResponse(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return {
      success: false,
      message: `Apps Script mengembalikan respons non-JSON (${res.status})`,
      body: text.slice(0, 500),
    }
  }
}

export async function GET(req: NextRequest) {
  if (!APPS_SCRIPT_URL) return missingConfig()

  const qs = req.nextUrl.searchParams.toString()
  const url = `${APPS_SCRIPT_URL}${qs ? `?${qs}` : ''}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
    })
    const data = await readAppsScriptResponse(res)
    return NextResponse.json(data, { status: data.success ? 200 : res.ok ? 200 : res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Apps Script GET failed' },
      { status: 502 }
    )
  }
}

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) return missingConfig()

  try {
    const body = await req.json()
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      cache: 'no-store',
      redirect: 'follow',
    })
    const data = await readAppsScriptResponse(res)
    return NextResponse.json(data, { status: data.success ? 200 : res.ok ? 200 : res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Apps Script POST failed' },
      { status: 502 }
    )
  }
}
