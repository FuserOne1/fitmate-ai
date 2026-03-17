import { NextRequest, NextResponse } from 'next/server'

// Это API просто возвращает пустой ответ для совместимости
// Данные сохраняются в localStorage на клиенте

export async function GET() {
  return NextResponse.json({ success: true, data: [] })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Возвращаем успешный ответ - данные сохраняются на клиенте
    return NextResponse.json({ 
      success: true, 
      data: { 
        id: Date.now().toString(),
        ...body 
      } 
    })
  } catch (error) {
    console.error('Steps POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save steps' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
