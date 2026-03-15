import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage, chatWithAI, SYSTEM_PROMPTS } from '@/lib/ai/openrouter'

// POST /api/ai/analyze
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, imageUrl, prompt, messages } = body

    // Анализ изображения
    if (type === 'image' && imageUrl) {
      let systemPrompt = SYSTEM_PROMPTS.FOOD_ANALYSIS

      if (prompt?.includes('весы') || prompt?.includes('скриншот')) {
        systemPrompt = SYSTEM_PROMPTS.SCALE_ANALYSIS
      } else if (prompt?.includes('тело') || prompt?.includes('фото')) {
        systemPrompt = SYSTEM_PROMPTS.BODY_ANALYSIS
      }

      const result = await analyzeImage({
        imageUrl,
        prompt: prompt || systemPrompt,
      })

      if (result.success) {
        return NextResponse.json({ data: result.data })
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        )
      }
    }

    // Чат с AI
    if (type === 'chat' && messages) {
      const result = await chatWithAI({
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.CHAT_ASSISTANT },
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
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
