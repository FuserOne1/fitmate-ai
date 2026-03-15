import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage, chatWithAI } from '@/lib/ai/openrouter'

// POST /api/ai/analyze
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, imageUrl, prompt, messages } = body

    // Анализ изображения
    if (type === 'image' && imageUrl) {
      let systemPrompt = `Ты - эксперт по питанию. Проанализируй фото еды и предоставь информацию о калориях и БЖУ в формате JSON.`

      if (prompt?.includes('весы') || prompt?.includes('скриншот')) {
        systemPrompt = `Ты - ассистент для фитнеса. Проанализируй скриншот с умных весов и извлеки данные: вес, процент жира, мышц, воды. Ответ в формате JSON.`
      } else if (prompt?.includes('тело') || prompt?.includes('фото')) {
        systemPrompt = `Ты - фитнес-тренер. Проанализируй фото тела и дай оценку прогресса.`
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
          {
            role: 'system',
            content: `Ты - дружелюбный AI-помощник для похудения FitMate. Будь позитивным, мотивируй, общайся на русском.`,
          },
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
