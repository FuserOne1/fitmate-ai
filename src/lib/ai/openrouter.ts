import OpenAI from 'openai'

// OpenRouter клиент для работы с AI моделями
export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Основная модель для анализа изображений и чата
export const AI_MODEL = {
  VISION: 'google/gemini-2.5-flash-preview', // Для анализа фото
  CHAT: 'google/gemini-2.5-flash-preview',   // Для текстового чата
}

// Системные промпты для разных задач
export const SYSTEM_PROMPTS = {
  // Анализ еды по фото
  FOOD_ANALYSIS: `Ты - эксперт по питанию и диетолог. Проанализируй фото еды и предоставь:
1. Список всех видимых продуктов
2. Примерный вес каждой порции в граммах
3. Калорийность (ккал)
4. БЖУ (белки, жиры, углеводы) в граммах
5. Краткую оценку полезности блюда

Ответ верни в формате JSON:
{
  "items": [{"name": "продукт", "weight_g": 100, "calories": 150, "protein": 10, "fat": 5, "carbs": 20}],
  "total": {"calories": 500, "protein": 30, "fat": 20, "carbs": 60},
  "health_score": 7,
  "comment": "краткий комментарий"
}`,

  // Анализ скриншота весов
  SCALE_ANALYSIS: `Ты - ассистент для фитнеса. Проанализируй скриншот с умных весов и извлеки данные:
- Вес (кг)
- Процент жира (%)
- Процент мышц (%)
- Процент воды (%)
- Другие доступные метрики

Ответ верни в формате JSON:
{
  "weight_kg": 65.5,
  "body_fat_percent": 28,
  "muscle_percent": 45,
  "water_percent": 55,
  "bmi": 22.5,
  "raw_data": {}
}`,

  // Анализ прогресса тела по фото
  BODY_ANALYSIS: `Ты - фитнес-тренер и диетолог. Проанализируй фото тела и дай:
1. Общую оценку прогресса (если это сравнение)
2. Заметные изменения
3. Рекомендации по продолжению пути
4. Мотивационное сообщение

Будь тактичным и поддерживающим!`,

  // Генерация меню
  MEAL_PLAN: `Ты - шеф-повар и диетолог. Составь меню на день с учётом:
- Суточной нормы калорий
- Предпочтений пользователя
- Доступных продуктов

Включи: завтрак, обед, ужин, 2 перекуса.
Для каждого приёма пищи укажи рецепт и КБЖУ.`,

  // Чат-помощник
  CHAT_ASSISTANT: `Ты - дружелюбный AI-помощник для похудения FitMate.
Твоя задача: поддерживать пользователя, отвечать на вопросы о питании, давать советы.
Будь позитивным, мотивируй, но не давай медицинских рекомендаций.
Общайся на русском языке, используй эмодзи уместно.`,
}

// Функция для анализа изображения
export async function analyzeImage(params: {
  imageUrl: string
  prompt: string
  model?: string
}) {
  const { imageUrl, prompt, model = AI_MODEL.VISION } = params

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 1000,
    })

    return {
      success: true,
      data: completion.choices[0]?.message?.content || null,
    }
  } catch (error) {
    console.error('AI Analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI analysis failed',
    }
  }
}

// Функция для чата
export async function chatWithAI(params: {
  messages: Array<{ role: string; content: string }>
  model?: string
}) {
  const { messages, model = AI_MODEL.CHAT } = params

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: messages as Array<{
        role: 'system' | 'user' | 'assistant'
        content: string
      }>,
      max_tokens: 1000,
    })

    return {
      success: true,
      data: completion.choices[0]?.message?.content || null,
    }
  } catch (error) {
    console.error('AI Chat error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI chat failed',
    }
  }
}
