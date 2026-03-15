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

    // Добавляем контекст о съеденном если есть
    const contextMessage = diaryContext 
      ? `\n\n[ИНФОРМАЦИЯ О СЕГОДНЯШНЕМ ДНЕ: ${diaryContext}]`
      : ''

    // Фильтруем только user/assistant сообщения, убираем системные
    const filteredMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-10) // Последние 10 сообщений для контекста

    const result = await chatWithAI({
      messages: [
        { role: 'system', content: systemPrompt + contextMessage },
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
