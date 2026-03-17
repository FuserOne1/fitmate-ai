import { NextRequest, NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/ai/openrouter'

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
    const { description, user_profile } = body

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // Системный промпт для анализа тренировок
    const systemPrompt = `Ты - AI-тренер и помощник для фитнес-приложения FitMate.

ТВОЯ ЗАДАЧА:
Анализировать описание тренировки пользователя и извлекать структурированные данные.

ЧТО НУЖНО ДЕЛАТЬ:
1. Определять тип тренировки (yoga, pilates, cardio, strength, hiit, stretching, walking, other)
2. Извлекать длительность в минутах
3. Рассчитывать примерные сожжённые калории (на основе типа и длительности)
4. Извлекать упражнения если упомянуты
5. Давать мотивирующий комментарий
6. Давать советы по восстановлению и питанию

ТИПЫ ТРЕНИРОВОК:
- yoga: йога, асаны, пранаяма
- pilates: пилатес, упражнения на кор
- cardio: бег, ходьба, велосипед, эллипс, танцы
- strength: силовая тренировка, веса, штанга, гантели
- hiit: высокоинтенсивная интервальная тренировка
- stretching: растяжка, стретчинг, гибкость
- walking: ходьба, прогулка
- other: другое

КАК СЧИТАТЬ КАЛОРИИ (примерно):
- yoga/pilates: 3-5 ккал/мин
- cardio: 8-12 ккал/мин
- strength: 5-8 ккал/мин
- hiit: 10-15 ккал/мин
- stretching: 2-4 ккал/мин
- walking: 4-6 ккал/мин

ФОРМАТ ОТВЕТА (строго JSON):
{
  "workout_type": "yoga",
  "duration_minutes": 60,
  "calories_burned": 240,
  "distance_km": null,
  "exercises": [
    {"name": "Приветствие солнцу", "sets": 3, "reps": null, "duration": "5 мин"}
  ],
  "ai_analysis": "Отличная тренировка! 60 минут йоги помогут улучшить гибкость и снять стресс.",
  "ai_tips": [
    "После йоги полезно выпить тёплой воды с лимоном",
    "Дай телу восстановиться - сделай лёгкую прогулку завтра",
    "Добавь белковый перекус в течение 30 минут после тренировки"
  ],
  "mood_suggestion": "Йога отлично подходит для снижения стресса! 🧘‍♀️"
}

ПОЛЬЗОВАТЕЛЬСКИЙ ПРОФИЛЬ (может быть):
${user_profile ? `
- Вес: ${user_profile.weight_kg || 'не указан'} кг
- Возраст: ${user_profile.age || 'не указан'}
- Цель: ${user_profile.goal || 'не указана'}
` : ''}

ВАЖНО:
- Отвечай ТОЛЬКО JSON без markdown и лишних символов
- Если какие-то данные неизвестны - ставь null
- Будь позитивным и поддерживающим в комментариях
- Советы должны быть практичными и конкретными
- Используй эмодзи уместно (1-3 на комментарий)`

    const result = await chatWithAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Описание тренировки: "${description}"` },
      ],
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
    console.error('Workout analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
