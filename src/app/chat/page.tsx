'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Sparkles, Utensils } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  foodEntry?: {
    items: Array<{
      name: string
      calories: number
      protein: number
      fat: number
      carbs: number
      weight?: number
    }>
    total: {
      calories: number
      protein: number
      fat: number
      carbs: number
    }
  }
}

type DiaryData = {
  calories: number
  protein: number
  fat: number
  carbs: number
} | null

// Простой markdown рендерер
function renderMarkdown(text: string) {
  if (!text) return null
  
  // Разбиваем на части и рендерим
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="bg-[hsl(var(--muted))] px-1 rounded">{part.slice(1, -1)}</code>
    }
    return part
  })
}

// Парсинг food entry из ответа AI
function parseFoodEntry(content: string) {
  const match = content.match(/\[FOOD_ENTRY\]([\s\S]*?)\[\/FOOD_ENTRY\]/)
  if (!match) return null
  
  try {
    const json = JSON.parse(match[1].trim())
    return json
  } catch (e) {
    console.error('Failed to parse food entry:', e)
    return null
  }
}

// Очистка контента от food entry блока
function cleanContent(content: string) {
  return content.replace(/\[FOOD_ENTRY\][\s\S]*?\[\/FOOD_ENTRY\]/g, '').trim()
}

// Сжатие изображения
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Максимальная ширина 1024px
        if (width > 1024) {
          height = (height * 1024) / width
          width = 1024
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      reader.onerror = (error) => reject(error)
    }
  })
}

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
      content: 'Привет, Маша! Я твой AI-помощник FitMate! 💕\n\nМогу помочь с:\n• Вопросами о питании\n• Советами по тренировкам\n• Мотивацией\n• Расчётом калорий\n\nСпрашивай что угодно! 😊',
      timestamp: Date.now(),
    }]
  })
  const [diaryData, setDiaryData] = useState<DiaryData | null>(null)
  const [pendingFoodEntry, setPendingFoodEntry] = useState<Message['foodEntry'] | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const userMessage: Message = { 
      role: 'user', 
      content: input.trim(),
      timestamp: Date.now()
    }
    
    // Сразу добавляем сообщение пользователя в UI
    setMessages(prev => [...prev, userMessage])
    const currentMessages = [...messages, userMessage]
    setInput('')
    setLoading(true)

    try {
      // Формируем контекст из дневника
      const diaryContext = diaryData && diaryData.calories > 0
        ? `Сегодня Маша уже съела на ${diaryData.calories} ккал. Б: ${diaryData.protein}г, Ж: ${diaryData.fat}г, У: ${diaryData.carbs}г`
        : 'Дневник питания пока пустой'

      // Отправляем ТОЛЬКО историю сообщений (без системных)
      const chatHistory = currentMessages.map(m => ({ 
        role: m.role, 
        content: m.content 
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          diaryContext,
        }),
      })

      const data = await response.json()

      if (response.ok && data.data) {
        // Парсим food entry если есть
        const foodEntry = parseFoodEntry(data.data)
        const cleanedContent = cleanContent(data.data)
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: cleanedContent,
          timestamp: Date.now(),
          foodEntry: foodEntry || undefined,
        }])
        
        // Если есть food entry, показываем pending
        if (foodEntry) {
          setPendingFoodEntry(foodEntry)
        }
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant',
          content: `Ошибка: ${data.error || 'Что-то пошло не так 😅'}`,
          timestamp: Date.now()
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ошибка соединения. Проверь интернет и попробуй снова 💕',
        timestamp: Date.now(),
      }])
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

  function addFoodToDiary() {
    if (!pendingFoodEntry) return
    
    // Загружаем текущий дневник
    const saved = localStorage.getItem('fitmate-diary')
    let logs = []
    
    if (saved) {
      try {
        logs = JSON.parse(saved)
      } catch {}
    }
    
    // Находим запись за сегодня
    const today = new Date().toISOString().split('T')[0]
    const todayIndex = logs.findIndex((log: any) => log.date === today)
    
    const newEntry = {
      name: 'Из чата',
      ...pendingFoodEntry,
      items: pendingFoodEntry.items.map(item => ({
        ...item,
        name: item.name || 'Продукт'
      }))
    }
    
    if (todayIndex >= 0) {
      // Обновляем существующую запись
      logs[todayIndex].items = [...logs[todayIndex].items, ...pendingFoodEntry.items]
      logs[todayIndex].total = {
        calories: logs[todayIndex].total.calories + pendingFoodEntry.total.calories,
        protein: logs[todayIndex].total.protein + pendingFoodEntry.total.protein,
        fat: logs[todayIndex].total.fat + pendingFoodEntry.total.fat,
        carbs: logs[todayIndex].total.carbs + pendingFoodEntry.total.carbs,
      }
    } else {
      // Создаём новую запись
      logs.unshift({
        date: today,
        items: pendingFoodEntry.items,
        total: pendingFoodEntry.total,
      })
    }
    
    // Сохраняем
    localStorage.setItem('fitmate-diary', JSON.stringify(logs))
    setPendingFoodEntry(null)
    
    // Обновляем diaryData
    setDiaryData({
      calories: logs[0].total.calories,
      protein: logs[0].total.protein,
      fat: logs[0].total.fat,
      carbs: logs[0].total.carbs,
    })
    
    alert('✅ Добавлено в дневник!')
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setAnalyzingImage(true)
      
      // Сжимаем изображение
      const compressed = await compressImage(file)
      
      // Отправляем на анализ
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          imageUrl: compressed,
          prompt: 'Проанализируй это фото еды. Определи что на фото, примерный вес порции и посчитай калории + БЖУ. Верни ответ в формате JSON с полями: items (массив продуктов), total (общие калории и БЖУ), comment (комментарий).',
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // Парсим результат и создаём food entry
        try {
          const parsed = JSON.parse(data.data)
          const foodEntry = {
            items: parsed.items || [],
            total: parsed.total || { calories: 0, protein: 0, fat: 0, carbs: 0 },
          }
          setPendingFoodEntry(foodEntry)
          
          // Добавляем сообщение с фото
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📸 Я проанализировал твоё фото!\n\n${parsed.comment || 'Вот что я нашёл:'}`,
            timestamp: Date.now(),
            foodEntry,
          }])
        } catch (parseError) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.data,
            timestamp: Date.now(),
          }])
        }
      } else {
        alert('Не удалось распознать еду 😅 Попробуй ещё раз!')
      }
    } catch (error) {
      console.error('Image analysis error:', error)
      alert('Ошибка при анализе фото')
    } finally {
      setAnalyzingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-primary))] transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6 text-[hsl(var(--primary))]" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[hsl(var(--primary))]" />
              <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">AI Помощник</h1>
            </div>
          </div>
          <button onClick={clearChat} className="p-2 text-xs text-[hsl(var(--text-secondary))] hover:text-red-500 transition-colors">
            Очистить
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 overflow-hidden flex flex-col">
        {/* Pending Food Entry */}
        {pendingFoodEntry && (
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-lg border border-[hsl(var(--border))] mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
              <h3 className="font-bold text-[hsl(var(--text-primary))]">Записать в дневник?</h3>
            </div>
            <div className="space-y-2 mb-4">
              {pendingFoodEntry.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-[hsl(var(--muted))] rounded-lg">
                  <span className="text-sm font-medium text-[hsl(var(--text-primary))]">{item.name}</span>
                  <span className="text-xs text-[hsl(var(--text-secondary))]">{item.calories} ккал</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingFoodEntry(null)}
                className="flex-1 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--text-primary))] rounded-lg hover:bg-[hsl(var(--muted))]/80 transition-colors text-sm font-medium"
              >
                Отмена
              </button>
              <button
                onClick={addFoodToDiary}
                className={`flex-1 py-2 ${themeConfig.colors.primaryBg} text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium flex items-center justify-center gap-2`}
              >
                <span className="text-lg">+</span>
                Добавить
              </button>
            </div>
          </div>
        )}
        {diaryData && diaryData.calories > 0 && (
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="w-4 h-4 text-[hsl(var(--primary))]" />
              <p className="text-sm font-medium text-[hsl(var(--text-primary))]">Сегодня съедено:</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-[hsl(var(--primary))]">{diaryData.calories}</p>
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
                  ? 'bg-[hsl(var(--primary))] text-white rounded-br-md'
                  : 'bg-[hsl(var(--card))] text-[hsl(var(--text-primary))] shadow-md border border-[hsl(var(--border))] rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.role === 'assistant' ? renderMarkdown(message.content) : message.content}
                </p>
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
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
              className="p-3 bg-[hsl(var(--primary))] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
