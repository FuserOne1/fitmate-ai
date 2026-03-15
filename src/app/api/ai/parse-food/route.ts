import { NextRequest, NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/ai/openrouter'

// POST /api/ai/parse-food
export async function POST(request: NextRequest) {
  // Проверка переменной окружения
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY не найден!')
    return NextResponse.json(
      { 
        error: 'Server configuration error',
        message: 'OPENROUTER_API_KEY is missing'
      },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    const result = await chatWithAI({
      messages: [
        {
          role: 'system',
          content: `Ты - AI-ассистент для парсинга еды. Твоя задача - распознать продукты из текста и вернуть КБЖУ.
          
Верни ТОЛЬКО JSON в формате:
{
  "items": [
    {
      "name": "название продукта",
      "calories": число,
      "protein": число,
      "fat": число,
      "carbs": число,
      "weight": число (опционально)
    }
  ]
}

Пример входа: "9 наггетсов, 2 больших теоса, протеиновый коктейль"
Пример выхода: {"items":[{"name":"Наггетсы (9 шт)","calories":270,"protein":18,"fat":18,"carbs":12,"weight":150},{"name":"Теос (2 шт)","calories":400,"protein":20,"fat":15,"carbs":50,"weight":200},{"name":"Протеиновый коктейль","calories":120,"protein":24,"fat":2,"carbs":3,"weight":300}]}

Отвечай ТОЛЬКО JSON, без дополнительного текста.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    })

    if (result.success && result.data) {
      try {
        // Пытаемся распарсить JSON из ответа
        const jsonMatch = result.data.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return NextResponse.json({
            success: true,
            items: parsed.items || [],
          })
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to parse food' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Parse food error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
