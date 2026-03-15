'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Sparkles, Utensils } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type DiaryData = {
  calories: number
  protein: number
  fat: number
  carbs: number
} | null

export default function ChatPage() {
  const { themeConfig } = useTheme()
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitmate-chat')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {}
      }
    }
    return [{
      role: 'assistant',
      content: 'Привет, Маша! Я твой AI-помощник FitMate! 💕\n\nМогу помочь с:\n• Вопросами о питании\n• Советами по тренировкам\n• Мотивацией\n• Расчётом калорий\n\nА ещё я знаю, что ты сегодня ела — могу помочь записать обед! 😊',
      timestamp: Date.now(),
    }]
  })
  const [diaryData, setDiaryData] = useState<DiaryData | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitmate-diary')
      if (saved) {
        try {
          const logs = JSON.parse(saved)
          const today = logs[0]
          if (today && today.total) {
            setDiaryData(today.total)
          }
        } catch {}
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitmate-chat', JSON.stringify(messages))
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage: Message = { role: 'user', content: input, timestamp: Date.now() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const diaryContext = diaryData
        ? `\n\n[КОНТЕКСТ: Сегодня Маша уже съела на ${diaryData.calories} ккал. Б: ${diaryData.protein}г, Ж: ${diaryData.fat}г, У: ${diaryData.carbs}г]`
        : ''

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          diaryContext,
        }),
      })
      const data = await response.json()

      if (response.ok && data.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data, timestamp: Date.now() }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Ошибка: ${data.error || 'Что-то пошло не так 😅'}`, timestamp: Date.now() }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения. Проверь интернет 💕', timestamp: Date.now() }])
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

  function clearChat() {
    if (confirm('Очистить историю чата?')) {
      setMessages([{
        role: 'assistant',
        content: 'Привет, Маша! Я твой AI-помощник FitMate! 💕\n\nЧем могу помочь сегодня?',
        timestamp: Date.now(),
      }])
    }
  }

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
              <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
              <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">AI Помощник</h1>
            </div>
          </div>
          <button onClick={clearChat} className="p-2 text-xs text-[hsl(var(--text-secondary))] hover:text-red-500 transition-colors">
            Очистить
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 overflow-hidden flex flex-col">
        {diaryData && diaryData.calories > 0 && (
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className={`w-4 h-4 ${themeConfig.colors.primaryText}`} />
              <p className="text-sm font-medium text-[hsl(var(--text-primary))]">Сегодня съедено:</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className={`text-lg font-bold ${themeConfig.colors.primaryText}`}>{diaryData.calories}</p>
                <p className="text-xs text-[hsl(var(--text-secondary))]">ккал</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-500">{diaryData.protein}</p>
                <p className="text-xs text-[hsl(var(--text-secondary))]">белки</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-500">{diaryData.fat}</p>
                <p className="text-xs text-[hsl(var(--text-secondary))]">жиры</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-500">{diaryData.carbs}</p>
                <p className="text-xs text-[hsl(var(--text-secondary))]">углеводы</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? `${themeConfig.colors.primaryBg} text-white rounded-br-md`
                  : 'bg-[hsl(var(--card))] text-[hsl(var(--text-primary))] shadow-md border border-[hsl(var(--border))] rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-[hsl(var(--text-secondary))]'}`}>
                  {new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[hsl(var(--card))] rounded-2xl px-4 py-3 shadow-md border border-[hsl(var(--border))]">
                <div className="flex gap-1">
                  <div className={`w-2 h-2 ${themeConfig.colors.primaryBg} rounded-full animate-bounce`} />
                  <div className={`w-2 h-2 ${themeConfig.colors.primaryBg} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }} />
                  <div className={`w-2 h-2 ${themeConfig.colors.primaryBg} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl p-2 shadow-lg border border-[hsl(var(--border))]">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напиши, что съела, или задай вопрос... 💕"
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none max-h-32 min-h-[44px] text-[hsl(var(--text-primary))]"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`p-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
