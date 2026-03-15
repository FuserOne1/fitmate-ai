'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Sparkles, Utensils, Trash2, Image, Droplets } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  foodEntry?: {
    items: Array<{ name: string; calories: number; protein: number; fat: number; carbs: number; weight?: number }>
    total: { calories: number; protein: number; fat: number; carbs: number }
  }
}

type DiaryData = { calories: number; protein: number; fat: number; carbs: number } | null
type WaterData = { intake: number } | null

// Проверка дубликатов: сравниваем названия продуктов
function isDuplicate(newItemName: string, existingItems: Array<{name: string}>): boolean {
  const newName = newItemName.toLowerCase().trim()
  return existingItems.some(existing => {
    const existingName = existing.name.toLowerCase().trim()
    // Полное совпадение или одно содержит другое
    return newName === existingName || 
           newName.includes(existingName) || 
           existingName.includes(newName)
  })
}

function renderMarkdown(text: string) {
  if (!text) return null
  
  // Разбиваем на блоки кода и остальной текст
  const parts = text.split(/(```(?:json)?\s*[\s\S]*?```|\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  
  return parts.map((part, index) => {
    // Блок кода ``` ... ```
    if (part.startsWith('```')) {
      const codeContent = part.replace(/```(?:json)?\s*/, '').replace(/```$/, '').trim()
      return (
        <pre key={index} className="bg-[hsl(var(--muted))] p-2 rounded-lg text-xs overflow-x-auto my-2">
          <code>{codeContent}</code>
        </pre>
      )
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    return part
  })
}

function parseFoodEntry(content: string) {
  const match = content.match(/\[FOOD_ENTRY\]([\s\S]*?)\[\/FOOD_ENTRY\]/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
}

function parseWaterEntry(content: string) {
  const match = content.match(/\[WATER_ENTRY\]([\s\S]*?)\[\/WATER_ENTRY\]/)
  if (!match) return null
  try { 
    const parsed = JSON.parse(match[1].trim())
    return { volume: parsed.volume || 0 }
  } catch { return null }
}

function cleanContent(content: string) {
  return content
    .replace(/\[FOOD_ENTRY\][\s\S]*?\[\/FOOD_ENTRY\]/g, '')
    .replace(/\[WATER_ENTRY\][\s\S]*?\[\/WATER_ENTRY\]/g, '')
    .trim()
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = document.createElement('img')
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width, height = img.height
        if (width > 1024) { height = (height * 1024) / width; width = 1024 }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      reader.onerror = reject
    }
  })
}

export default function ChatPage() {
  const { themeConfig } = useTheme()
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitmate-chat')
      if (saved) { try { return JSON.parse(saved) } catch {} }
    }
    return [{ role: 'assistant', content: 'Привет, Маша! Я твой AI-помощник FitMate! 💕\n\nСпрашивай что угодно! 😊', timestamp: Date.now() }]
  })
  const [diaryData, setDiaryData] = useState<DiaryData | null>(null)
  const [waterData, setWaterData] = useState<WaterData | null>(null)
  const [pendingFoodEntry, setPendingFoodEntry] = useState<Message['foodEntry'] | null>(null)
  const [pendingWaterVolume, setPendingWaterVolume] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = () => {
      // Дневник питания
      const saved = localStorage.getItem('fitmate-diary')
      if (saved) {
        try {
          const logs = JSON.parse(saved)
          if (logs[0]?.total) setDiaryData(logs[0].total)
        } catch {}
      }
      
      // Вода
      const waterSaved = localStorage.getItem('fitmate-water')
      if (waterSaved) {
        try {
          const logs = JSON.parse(waterSaved)
          const today = new Date().toISOString().split('T')[0]
          const todayLog = logs.find((log: any) => log.date === today)
          if (todayLog) {
            setWaterData({ intake: todayLog.intake || 0 })
          }
        } catch {}
      }
    }
    
    loadData()
    
    // Слушаем изменения в localStorage
    const handleStorageChange = () => loadData()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    localStorage.setItem('fitmate-chat', JSON.stringify(messages))
  }, [messages])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: Date.now() }
    const currentMessages = [...messages, userMessage]
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Собираем полный контекст
      const diaryContext = diaryData ? `Съедено на ${diaryData.calories} ккал (Б: ${diaryData.protein}г, Ж: ${diaryData.fat}г, У: ${diaryData.carbs}г)` : ''
      const waterContext = waterData ? `Выпито воды: ${waterData.intake} мл` : ''
      const healthContext = [diaryContext, waterContext].filter(Boolean).join('. ')
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })), 
          diaryContext: healthContext 
        }),
      })
      const data = await response.json()
      if (response.ok && data.data) {
        const foodEntry = parseFoodEntry(data.data)
        const waterEntry = parseWaterEntry(data.data)

        // Сначала проверяем WATER_ENTRY (вода)
        if (waterEntry && waterEntry.volume > 0) {
          setPendingWaterVolume(waterEntry.volume)
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `${cleanContent(data.data)}\n\n💧 Записать ${waterEntry.volume} мл воды?`, 
            timestamp: Date.now() 
          }])
        }
        // Потом проверяем FOOD_ENTRY (еда)
        else if (foodEntry) {
          // Получаем реально записанные продукты из localStorage
          const saved = localStorage.getItem('fitmate-diary')
          const today = new Date().toISOString().split('T')[0]
          let todayItems: Array<{name: string}> = []

          if (saved) {
            try {
              const logs = JSON.parse(saved)
              const todayLog = logs.find((log: any) => log.date === today)
              if (todayLog && todayLog.items) {
                todayItems = todayLog.items
              }
            } catch {}
          }

          // Фильтруем только новые продукты
          const newItems = foodEntry.items.filter((item: {name: string}) => !isDuplicate(item.name, todayItems))

          if (newItems.length === 0) {
            // Все продукты уже записаны сегодня - показываем оригинальный ответ AI + инфо
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `${cleanContent(data.data)}\n\n💡 Но это уже записано в дневнике сегодня!`,
              timestamp: Date.now()
            }])
          } else if (newItems.length < foodEntry.items.length) {
            // Часть продуктов уже записана
            const partialEntry = {
              ...foodEntry,
              items: newItems,
              total: {
                calories: newItems.reduce((sum: number, i: {calories: number}) => sum + i.calories, 0),
                protein: newItems.reduce((sum: number, i: {protein: number}) => sum + i.protein, 0),
                fat: newItems.reduce((sum: number, i: {fat: number}) => sum + i.fat, 0),
                carbs: newItems.reduce((sum: number, i: {carbs: number}) => sum + i.carbs, 0)
              }
            }
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `${cleanContent(data.data)}\n\n⚠️ Часть продуктов уже записана, добавлю только новое:`,
              timestamp: Date.now(),
              foodEntry: partialEntry
            }])
            setPendingFoodEntry(partialEntry)
          } else {
            // Все продукты новые
            setMessages(prev => [...prev, { role: 'assistant', content: cleanContent(data.data), timestamp: Date.now(), foodEntry }])
            setPendingFoodEntry(foodEntry)
          }
        } else {
          // Нет FOOD_ENTRY или WATER_ENTRY - просто показываем ответ
          setMessages(prev => [...prev, { role: 'assistant', content: cleanContent(data.data), timestamp: Date.now() }])
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Ошибка: ${data.error}`, timestamp: Date.now() }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения 💕', timestamp: Date.now() }])
    } finally { setLoading(false) }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Проверка формата
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выбери изображение (JPG, PNG, HEIC)')
      return
    }
    
    try {
      setAnalyzingImage(true)
      const compressed = await compressImage(file)
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'image', 
          imageUrl: compressed, 
          prompt: 'Ты эксперт по питанию. Проанализируй фото еды. Определи блюда, примерный вес и КБЖУ. Верни ТОЛЬКО JSON: {"items":[{"name":"название","calories":число,"protein":число,"fat":число,"carbs":число,"weight":число}],"total":{"calories":число,"protein":число,"fat":число,"carbs":число},"comment":"краткий комментарий на русском"}' 
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('AI response data:', data)

      if (data.data) {
        console.log('Raw data.data:', data.data)
        // Очищаем от markdown-обертки (```json ... ```)
        let jsonStr = data.data
        // Пробуем разные варианты regex для markdown блоков
        const markdownMatch = data.data.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                              data.data.match(/```\s*([\s\S]*?)```/)
        if (markdownMatch) {
          jsonStr = markdownMatch[1].trim()
        } else {
          // Если нет markdown-обертки, используем как есть
          jsonStr = data.data
        }

        try {
          const parsed = JSON.parse(jsonStr)
          const foodEntry = { items: parsed.items || [], total: parsed.total || { calories: 0, protein: 0, fat: 0, carbs: 0 } }
          
          // Проверяем дубликаты с тем, что УЖЕ записано в дневник сегодня
          const saved = localStorage.getItem('fitmate-diary')
          const today = new Date().toISOString().split('T')[0]
          let todayItems: Array<{name: string}> = []
          
          if (saved) {
            try {
              const logs = JSON.parse(saved)
              const todayLog = logs.find((log: any) => log.date === today)
              if (todayLog && todayLog.items) {
                todayItems = todayLog.items
              }
            } catch {}
          }
          
          // Фильтруем только новые продукты
          const newItems = foodEntry.items.filter((item: {name: string}) => !isDuplicate(item.name, todayItems))
          
          if (newItems.length === 0) {
            // Все продукты уже записаны сегодня
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `📸 ${parsed.comment || 'Вот что я нашёл:'}\n\n✅ Это уже записано в дневнике сегодня! 💕`, 
              timestamp: Date.now() 
            }])
          } else if (newItems.length < foodEntry.items.length) {
            // Часть продуктов уже записана
            const partialEntry = {
              ...foodEntry,
              items: newItems,
              total: {
                calories: newItems.reduce((sum: number, i: {calories: number}) => sum + i.calories, 0),
                protein: newItems.reduce((sum: number, i: {protein: number}) => sum + i.protein, 0),
                fat: newItems.reduce((sum: number, i: {fat: number}) => sum + i.fat, 0),
                carbs: newItems.reduce((sum: number, i: {carbs: number}) => sum + i.carbs, 0)
              }
            }
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `📸 ${parsed.comment || 'Вот что я нашёл:'}\n\n⚠️ Часть продуктов уже записана. Добавлю только новое:`, 
              timestamp: Date.now(), 
              foodEntry: partialEntry 
            }])
            setPendingFoodEntry(partialEntry)
          } else {
            // Все продукты новые
            setPendingFoodEntry(foodEntry)
            setMessages(prev => [...prev, { role: 'assistant', content: `📸 ${parsed.comment || 'Вот что я нашёл:'}`, timestamp: Date.now(), foodEntry }])
          }
        } catch (parseError: any) {
          console.error('JSON parse error:', parseError, 'jsonStr:', jsonStr)
          // Выводим ошибку в чат вместо alert
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `😕 Не удалось распознать фото\n\n${parseError.message || 'Попробуй другое фото'}`,
            timestamp: Date.now()
          }])
        }
      } else {
        console.error('Analysis failed:', data)
        // Выводим ошибку в чат вместо alert
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `😕 Не удалось распознать фото\n\n${data.error || 'Попробуй другое фото'}`,
          timestamp: Date.now()
        }])
      }
    } catch (error: any) {
      console.error('Image analysis error:', error)
      // Выводим ошибку в чат вместо alert
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `😕 Ошибка анализа\n\n${error.message || 'Попробуй ещё раз'}`, 
        timestamp: Date.now() 
      }])
    } finally {
      setAnalyzingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function addFoodToDiary() {
    if (!pendingFoodEntry) return
    const saved = localStorage.getItem('fitmate-diary')
    let logs = saved ? JSON.parse(saved) : []
    const today = new Date().toISOString().split('T')[0]
    const todayIndex = logs.findIndex((log: any) => log.date === today)
    if (todayIndex >= 0) {
      logs[todayIndex].items = [...logs[todayIndex].items, ...pendingFoodEntry.items]
      logs[todayIndex].total = { calories: logs[todayIndex].total.calories + pendingFoodEntry.total.calories, protein: logs[todayIndex].total.protein + pendingFoodEntry.total.protein, fat: logs[todayIndex].total.fat + pendingFoodEntry.total.fat, carbs: logs[todayIndex].total.carbs + pendingFoodEntry.total.carbs }
    } else {
      logs.unshift({ date: today, items: pendingFoodEntry.items, total: pendingFoodEntry.total })
    }
    localStorage.setItem('fitmate-diary', JSON.stringify(logs))
    setPendingFoodEntry(null)
    setDiaryData({ calories: logs[0].total.calories, protein: logs[0].total.protein, fat: logs[0].total.fat, carbs: logs[0].total.carbs })
    alert('✅ Добавлено!')
  }

  function addWaterToDiary() {
    if (!pendingWaterVolume) return
    const saved = localStorage.getItem('fitmate-water')
    let logs = saved ? JSON.parse(saved) : []
    const today = new Date().toISOString().split('T')[0]
    const todayIndex = logs.findIndex((log: any) => log.date === today)
    
    if (todayIndex >= 0) {
      logs[todayIndex].intake += pendingWaterVolume
    } else {
      logs.unshift({ date: today, intake: pendingWaterVolume })
    }
    
    localStorage.setItem('fitmate-water', JSON.stringify(logs))
    setPendingWaterVolume(null)
    setWaterData({ intake: logs[0].intake })
    window.dispatchEvent(new Event('storage'))
    alert(`💧 Добавлено ${pendingWaterVolume} мл воды!`)
  }

  function clearChat() {
    if (confirm('Очистить историю?')) setMessages([{ role: 'assistant', content: 'Привет! Чем помочь?', timestamp: Date.now() }])
  }

  function handleKeyPress(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-primary))] flex flex-col">
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl"><ArrowLeft className="w-6 h-6 text-[hsl(var(--primary))]" /></Link>
            <div className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-[hsl(var(--primary))]" /><h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">AI Помощник</h1></div>
          </div>
          <button onClick={clearChat} className="p-2 text-xs text-[hsl(var(--text-secondary))] hover:text-red-500">Очистить</button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col overflow-hidden">
        {/* Вода - подтверждение */}
        {pendingWaterVolume !== null && (
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-lg border border-[hsl(var(--border))] mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-[hsl(var(--text-primary))]">Записать воду?</h3>
            </div>
            <div className="mb-4 text-center">
              <p className="text-3xl font-bold text-blue-500">{pendingWaterVolume} мл</p>
              <p className="text-sm text-[hsl(var(--text-secondary))]">💧 Чистой воды</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPendingWaterVolume(null)} className="flex-1 py-2 bg-[hsl(var(--muted))] rounded-lg text-sm">Отмена</button>
              <button onClick={addWaterToDiary} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                <Droplets className="w-4 h-4" />
                Добавить
              </button>
            </div>
          </div>
        )}

        {/* Еда - подтверждение */}
        {pendingFoodEntry && (
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-lg border border-[hsl(var(--border))] mb-4">
            <div className="flex items-center gap-2 mb-3"><Utensils className="w-5 h-5 text-[hsl(var(--primary))]" /><h3 className="font-bold text-[hsl(var(--text-primary))]">Записать в дневник?</h3></div>
            <div className="space-y-2 mb-4">{pendingFoodEntry.items.map((item, i) => (<div key={i} className="flex justify-between p-2 bg-[hsl(var(--muted))] rounded-lg"><span className="text-sm font-medium">{item.name}</span><span className="text-xs">{item.calories} ккал</span></div>))}</div>
            <div className="flex gap-2">
              <button onClick={() => setPendingFoodEntry(null)} className="flex-1 py-2 bg-[hsl(var(--muted))] rounded-lg text-sm">Отмена</button>
              <button onClick={addFoodToDiary} className="flex-1 py-2 bg-[hsl(var(--primary))] text-white rounded-lg text-sm flex items-center justify-center gap-2"><span>+</span>Добавить</button>
            </div>
          </div>
        )}

        {diaryData && diaryData.calories > 0 && (
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] mb-4">
            <div className="flex items-center gap-2 mb-2"><Utensils className="w-4 h-4 text-[hsl(var(--primary))]" /><p className="text-sm font-medium">Сегодня съедено:</p></div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-lg font-bold text-[hsl(var(--primary))]">{diaryData.calories}</p><p className="text-xs">ккал</p></div>
              <div><p className="text-lg font-bold text-blue-500">{diaryData.protein}</p><p className="text-xs">белки</p></div>
              <div><p className="text-lg font-bold text-yellow-500">{diaryData.fat}</p><p className="text-xs">жиры</p></div>
              <div><p className="text-lg font-bold text-green-500">{diaryData.carbs}</p><p className="text-xs">углеводы</p></div>
            </div>
          </div>
        )}

        {waterData && waterData.intake > 0 && (
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium">Вода за сегодня:</p>
              </div>
              <Link href="/water" className="text-xs text-blue-500 hover:underline">Изменить →</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (waterData.intake / 2000) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-lg font-bold text-blue-500 min-w-[80px] text-right">{waterData.intake} мл</p>
            </div>
            <p className="text-xs text-[hsl(var(--text-secondary))] mt-2 text-center">
              {waterData.intake >= 2000 ? '✅ Норма выполнена!' : `Осталось: ${2000 - waterData.intake} мл`}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-[hsl(var(--primary))] text-white rounded-br-md' : 'bg-[hsl(var(--card))] text-[hsl(var(--text-primary))] border border-[hsl(var(--border))] rounded-bl-md'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-[hsl(var(--text-secondary))]'}`}>{new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          {loading && (<div className="flex justify-start"><div className="bg-[hsl(var(--card))] rounded-2xl px-4 py-3 border border-[hsl(var(--border))]"><div className="flex gap-1"><div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" /><div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div></div></div>)}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-auto bg-[hsl(var(--card))] rounded-2xl p-3 shadow-lg border border-[hsl(var(--border))]">
          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={analyzingImage} className="p-3 bg-[hsl(var(--muted))] text-[hsl(var(--primary))] rounded-xl hover:bg-[hsl(var(--muted))]/80 disabled:opacity-50">
              {analyzingImage ? <div className="w-5 h-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /> : <Image className="w-5 h-5" />}
            </button>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Напиши, что съела... 💕" className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none max-h-32 min-h-[44px]" rows={1} />
            <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-3 bg-[hsl(var(--primary))] text-white rounded-xl hover:opacity-90 disabled:opacity-50"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </main>
    </div>
  )
}
