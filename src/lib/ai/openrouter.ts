import OpenAI from 'openai'

// OpenRouter клиент для работы с AI моделями
const apiKey = process.env.OPENROUTER_API_KEY

if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY is missing!')
}

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey || 'dummy-key',
})

// Основная модель для анализа изображений и чата
export const AI_MODEL = {
  VISION: 'google/gemini-2.5-flash', // Для анализа фото
  CHAT: 'google/gemini-2.5-flash',   // Для текстового чата
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
