import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/ai/openrouter'

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
    const { imageUrl } = body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const prompt = `Ты - AI-ассистент для распознавания данных о шагах со скриншотов.

Посмотри на этот скриншот (из Apple Health, Google Fit, Fitbit или другого фитнес-приложения) и извлеки данные:

ЧТО НУЖНО НАЙТИ:
1. Количество шагов (steps) - основное число
2. Пройденная дистанция (км или мили)
3. Сожжённые калории от активности

ФОРМАТ ОТВЕТА (строго JSON):
{
  "steps": 10000,
  "distance_km": 7.5,
  "calories_burned": 350,
  "source_app": "Apple Health",
  "confidence": 0.95,
  "notes": "Данные распознаны с экрана 'Активность' за сегодня"
}

ВАЖНО:
- Отвечай ТОЛЬКО JSON без markdown
- Если не можешь найти какое-то поле - ставь null
- confidence: от 0 до 1 (насколько уверен в распознавании)
- source_app: Apple Health, Google Fit, Fitbit, Samsung Health, Xiaomi Mi Fit, другое
- steps должно быть числом (не строкой!)

Если на скриншоте НЕТ данных о шагах:
{"steps": null, "error": "No step data found on screenshot"}`

    const result = await analyzeImage({
      imageUrl,
      prompt,
      model: 'google/gemini-3-flash-preview',
    })

    if (result.success) {
      // Пытаемся распарсить JSON из ответа
      let aiData = null
      try {
        const content = result.data
        // Извлекаем JSON из ответа (может быть в markdown)
        const jsonMatch = content?.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0])
        } else {
          aiData = JSON.parse(content || '{}')
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        return NextResponse.json(
          { success: false, error: 'Failed to parse AI response', raw: result.data },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: aiData })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Steps screenshot analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
