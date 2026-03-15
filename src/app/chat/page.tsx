'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import { analyzeImage, chatWithAI } from '@/lib/ai/openrouter'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я твой AI-помощник FitMate! 💕\n\nМогу помочь с:\n• Вопросами о питании\n• Советами по тренировкам\n• Мотивацией\n• Расчётом калорий\n\nСпрашивай что угодно! 😊',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const result = await chatWithAI({
        messages: [
          {
            role: 'system',
            content: `Ты - дружелюбный AI-помощник для похудения FitMate.
Твоя задача: поддерживать пользователя, отвечать на вопросы о питании, давать советы.
Будь позитивным, мотивируй, но не давай медицинских рекомендаций.
Общайся на русском языке, используй эмодзи уместно.
Ты разговариваешь с девушкой по имени Маша.`,
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: input },
        ],
      })

      if (result.success && result.data) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.data! },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Ой, что-то пошло не так 😅 Попробуй ещё раз!',
          },
        ])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ошибка соединения. Проверь интернет и попробуй снова 💕',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-rose-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-rose-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-rose-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-bold text-gray-800">AI Помощник</h1>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-rose-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 shadow-md shadow-rose-100 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-md shadow-rose-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl p-2 shadow-lg shadow-rose-100">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Спроси о питании, тренировках или просто поболтаем... 💕"
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none max-h-32 min-h-[44px]"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
