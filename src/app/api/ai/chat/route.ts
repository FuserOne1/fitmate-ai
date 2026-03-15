import { NextRequest, NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/ai/openrouter'

// POST /api/ai/chat
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY is missing!')
    return NextResponse.json(
      { error: 'Server configuration error', message: 'OPENROUTER_API_KEY is missing' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { messages, diaryContext } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const result = await chatWithAI({
      messages: [
        {
          role: 'system',
          content: `Ты - дружелюбный AI-помощник для похудения FitMate. 
Ты разговариваешь с девушкой по имени Маша.
Твоя задача: поддерживать, отвечать на вопросы о питании и тренировках, давать советы.
Будь позитивным, мотивируй, используй эмодзи.
Не давай медицинских рекомендаций.
Отвечай на русском языке.

Если Маша пишет что съела (например: "запиши обед", "съела салат"), предложи записать это в дневник питания.`,
        },
        ...(diaryContext ? [{ role: 'system', content: diaryContext }] : []),
        ...messages,
      ],
    })

    if (result.success) {
      return NextResponse.json({ data: result.data })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
