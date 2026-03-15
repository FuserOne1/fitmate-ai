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
    const { messages, diaryContext } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Формируем правильный системный промпт
    const systemPrompt = `Ты - дружелюбный AI-помощник для похудения FitMate.

ТВОЯ РОЛЬ:
- Ты помощник, а НЕ пользователь
- Ты разговариваешь с девушкой по имени Маша
- Твоя задача: поддерживать, отвечать на вопросы о питании и тренировках, давать советы
- Будь позитивным, мотивируй, используй эмодзи уместно
- Не давай медицинских рекомендаций
- Отвечай на русском языке

ВАЖНО - РАСПОЗНАВАНИЕ ТИПА ЗАПИСИ:
Ты должен понимать о чём говорит Маша и выбирать правильный формат:

1️⃣ ЕСЛИ ВОДА (выпила воды, стакан, кружку, бутылку, глоток и т.д.):
   Используй формат WATER_ENTRY:
   
   [WATER_ENTRY]
   {"volume": 250}
   [/WATER_ENTRY]
   
   volume - количество в мл (примерно: глоток=50, стакан=250, кружка=350, бутылка=500)

2️⃣ ЕСЛИ ЕДА (съела что-то, пообедала, перекусила и т.д.):
   Используй формат FOOD_ENTRY:
   
   [FOOD_ENTRY]
   {
     "items": [
       {"name": "Бургер", "calories": 350, "protein": 15, "fat": 18, "carbs": 30, "weight": 150}
     ],
     "total": {"calories": 350, "protein": 15, "fat": 18, "carbs": 30}
   }
   [/FOOD_ENTRY]

3️⃣ ЕСЛИ ПРОСТО ВОПРОС или разговор - отвечай обычно без блоков

ВАЖНО:
- Вода НЕ должна записываться как FOOD_ENTRY с 0 ккал
- Если Маша говорит "выпила стакан воды" - это WATER_ENTRY
- Если Маша говорит "выпила протеиновый коктейль" - это FOOD_ENTRY

ЧТО ТЫ МОЖЕШЬ:
• Помогать с планированием питания
• Советовать полезные перекусы
• Отвечать на вопросы о КБЖУ
• Мотивировать на достижение целей
• Поддерживать морально

ЧТО ТЫ НЕ МОЖЕШЬ:
• Давать медицинские диагнозы
• Назначать лекарства
• Заменять врача или диетолога

СТИЛЬ ОБЩЕНИЯ:
- Дружелюбный, поддерживающий
- Используй эмодзи умеренно (1-3 на сообщение)
- Обращайся к пользователю на "ты"
- Будь конкретным в советах`

    // Добавляем контекст о съеденном и воде если есть
    const contextMessage = diaryContext
      ? `\n\n[КОНТЕКСТ СЕГОДНЯШНЕГО ДНЯ: ${diaryContext}]\n\nВАЖНО: Если Маша превысила калории, мягко намекни что стоит притормозить. Похвали за успехи и поддержи!`
      : ''

    // Проверяем превышение калорий
    let calorieWarning = ''
    if (diaryContext) {
      // Извлекаем норму из контекста
      const normMatch = diaryContext.match(/Норма калорий: (\d+) ккал/)
      const calorieMatch = diaryContext.match(/Съедено на (\d+) ккал/)
      
      if (normMatch && calorieMatch) {
        const calorieGoal = parseInt(normMatch[1])
        const consumedCalories = parseInt(calorieMatch[1])
        
        if (consumedCalories > calorieGoal) {
          const over = consumedCalories - calorieGoal
          const overPercent = Math.round((over / calorieGoal) * 100)
          calorieWarning = `\n\n⚠️ Маша уже превысила норму на ${over} ккал (${overPercent}%)! Будь мягче, поддержи, но намекни что можно остановиться. Предложи легкий перекус или воду.`
        } else if (consumedCalories > calorieGoal * 0.9) {
          const remaining = calorieGoal - consumedCalories
          calorieWarning = `\n\nМаша почти достигла нормы (осталось ${remaining} ккал). Похвали и напомни быть внимательной к порциям.`
        }
      }
    }

    // Фильтруем только user/assistant сообщения, убираем системные
    const filteredMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-10) // Последние 10 сообщений для контекста

    const result = await chatWithAI({
      messages: [
        { role: 'system', content: systemPrompt + contextMessage + calorieWarning },
        ...filteredMessages,
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
