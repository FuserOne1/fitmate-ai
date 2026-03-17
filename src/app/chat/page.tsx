'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Sparkles, Utensils, Trash2, Image, Droplets } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import WaterWidget from '@/components/WaterWidget'
import CaloriesWidget from '@/components/CaloriesWidget'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  image?: string
  foodEntry?: {
    items: Array<{ name: string; calories: number; protein: number; fat: number; carbs: number; weight?: number }>
    total: { calories: number; protein: number; fat: number; carbs: number }
  }
}

type DiaryData = { calories: number; protein: number; fat: number; carbs: number } | null
type WaterData = { intake: number } | null
type WeightDataType = { weight: number; fatPercent?: number; muscleMass?: number } | null

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

function parseWorkoutEntry(content: string) {
  const match = content.match(/\[WORKOUT_ENTRY\]([\s\S]*?)\[\/WORKOUT_ENTRY\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    return {
      description: parsed.description || '',
      type: parsed.type || 'other',
      duration_minutes: parsed.duration_minutes || 0,
      calories_burned: parsed.calories_burned || 0,
    }
  } catch { return null }
}

function parseStepsEntry(content: string) {
  const match = content.match(/\[STEPS_ENTRY\]([\s\S]*?)\[\/STEPS_ENTRY\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    return {
      steps: parsed.steps || 0,
      distance_km: parsed.distance_km || 0,
      calories_burned: parsed.calories_burned || 0,
    }
  } catch { return null }
}

function cleanContent(content: string) {
  return content
    .replace(/\[FOOD_ENTRY\][\s\S]*?\[\/FOOD_ENTRY\]/g, '')
    .replace(/\[WATER_ENTRY\][\s\S]*?\[\/WATER_ENTRY\]/g, '')
    .replace(/\[WORKOUT_ENTRY\][\s\S]*?\[\/WORKOUT_ENTRY\]/g, '')
    .replace(/\[STEPS_ENTRY\][\s\S]*?\[\/STEPS_ENTRY\]/g, '')
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
  const [weightData, setWeightData] = useState<WeightDataType>(null)
  const [workoutStats, setWorkoutStats] = useState<{count: number, calories: number, minutes: number} | null>(null)
  const [stepsData, setStepsData] = useState<{steps: number, distance_km?: number, calories_burned?: number} | null>(null)
  const [pendingFoodEntry, setPendingFoodEntry] = useState<Message['foodEntry'] | null>(null)
  const [pendingWaterVolume, setPendingWaterVolume] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageDescription, setImageDescription] = useState('')
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

      // Вес
      const weightSaved = localStorage.getItem('fitmate-weight')
      if (weightSaved) {
        try {
          const logs = JSON.parse(weightSaved)
          if (logs && logs.length > 0) {
            setWeightData({
              weight: logs[0].weight,
              fatPercent: logs[0].fatPercent,
              muscleMass: logs[0].muscleMass
            })
          }
        } catch {}
      }

      // Тренировки (за неделю)
      const workoutsSaved = localStorage.getItem('fitmate-workouts')
      if (workoutsSaved) {
        try {
          const logs = JSON.parse(workoutsSaved)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          const weekWorkouts = logs.filter((w: any) => new Date(w.workout_date) >= weekAgo)
          setWorkoutStats({
            count: weekWorkouts.length,
            calories: weekWorkouts.reduce((sum: number, w: any) => sum + (w.calories_burned || 0), 0),
            minutes: weekWorkouts.reduce((sum: number, w: any) => sum + (w.duration_minutes || 0), 0)
          })
        } catch {}
      }

      // Шаги (за сегодня)
      const stepsSaved = localStorage.getItem('fitmate-steps')
      if (stepsSaved) {
        try {
          const logs = JSON.parse(stepsSaved)
          const today = new Date().toISOString().split('T')[0]
          const todayLog = logs.find((log: any) => log.date === today)
          if (todayLog) {
            setStepsData({
              steps: todayLog.steps || 0,
              distance_km: todayLog.distance_km,
              calories_burned: todayLog.calories_burned
            })
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
      const weightContext = weightData ? `Вес: ${weightData.weight} кг${weightData.fatPercent ? `, жир: ${weightData.fatPercent}%` : ''}${weightData.muscleMass ? `, мышцы: ${weightData.muscleMass}кг` : ''}` : ''

      // Загружаем цели
      const goalsSaved = typeof window !== 'undefined' ? localStorage.getItem('fitmate-goals') : null
      const goals = goalsSaved ? JSON.parse(goalsSaved) : { calories: 2000 }
      const goalsContext = `Норма калорий: ${goals.calories} ккал`

      // Тренировки
      const workoutContext = workoutStats ? `${workoutStats.count} тренировок за неделю (${workoutStats.calories} ккал, ${Math.round(workoutStats.minutes / 60)} ч)` : ''
      
      // Шаги
      const stepsContext = stepsData ? `${stepsData.steps.toLocaleString()} шагов${stepsData.distance_km ? ` (${stepsData.distance_km} км)` : ''}${stepsData.calories_burned ? `, ${stepsData.calories_burned} ккал` : ''}` : ''

      const healthContext = [diaryContext, waterContext, weightContext, goalsContext].filter(Boolean).join('. ')

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          diaryContext: healthContext,
          workoutContext,
          stepsContext,
        }),
      })
      const data = await response.json()
      if (response.ok && data.data) {
        const foodEntry = parseFoodEntry(data.data)
        const waterEntry = parseWaterEntry(data.data)
        const workoutEntry = parseWorkoutEntry(data.data)
        const stepsEntry = parseStepsEntry(data.data)

        // Проверяем WATER_ENTRY (вода)
        if (waterEntry && waterEntry.volume > 0) {
          setPendingWaterVolume(waterEntry.volume)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${cleanContent(data.data)}\n\n💧 Записать ${waterEntry.volume} мл воды?`,
            timestamp: Date.now()
          }])
        }
        // Проверяем WORKOUT_ENTRY (тренировка)
        else if (workoutEntry) {
          // Сохраняем тренировку в localStorage
          const workoutsSaved = localStorage.getItem('fitmate-workouts')
          const workouts = workoutsSaved ? JSON.parse(workoutsSaved) : []
          const newWorkout = {
            id: Date.now().toString(),
            workout_type: workoutEntry.type,
            workout_date: new Date().toISOString(),
            duration_minutes: workoutEntry.duration_minutes,
            calories_burned: workoutEntry.calories_burned,
            notes: workoutEntry.description,
          }
          workouts.unshift(newWorkout)
          localStorage.setItem('fitmate-workouts', JSON.stringify(workouts))
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${cleanContent(data.data)}\n\n✅ Тренировка записана!`,
            timestamp: Date.now()
          }])
        }
        // Проверяем STEPS_ENTRY (шаги)
        else if (stepsEntry) {
          // Сохраняем шаги в localStorage
          const stepsSaved = localStorage.getItem('fitmate-steps')
          let stepsLogs = stepsSaved ? JSON.parse(stepsSaved) : []
          const today = new Date().toISOString().split('T')[0]
          const todayIndex = stepsLogs.findIndex((log: any) => log.date === today)
          
          const newStepsLog = {
            date: today,
            steps: stepsEntry.steps,
            distance_km: stepsEntry.distance_km,
            calories_burned: stepsEntry.calories_burned,
            source: 'chat' as const,
          }
          
          if (todayIndex >= 0) {
            stepsLogs[todayIndex] = newStepsLog
          } else {
            stepsLogs.unshift(newStepsLog)
          }
          localStorage.setItem('fitmate-steps', JSON.stringify(stepsLogs))
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${cleanContent(data.data)}\n\n✅ Шаги записаны!`,
            timestamp: Date.now()
          }])
        }
        // Проверяем FOOD_ENTRY (еда)
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
          // Нет FOOD_ENTRY, WATER_ENTRY, WORKOUT_ENTRY или STEPS_ENTRY - просто показываем ответ
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

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выбери изображение (JPG, PNG, HEIC)')
      return
    }

    try {
      const compressed = await compressImage(file)
      setSelectedImage(compressed)
      setImageDescription('')
    } catch (error) {
      console.error('Image select error:', error)
      alert('Ошибка загрузки фото')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function sendImageWithDescription() {
    if (!selectedImage) return
    
    setAnalyzingImage(true)
    try {
      const prompt = imageDescription 
        ? `Ты эксперт по питанию. Проанализируй фото еды. Описание от пользователя: "${imageDescription}". Определи блюда, примерный вес и КБЖУ. Верни ТОЛЬКО JSON: {"items":[{"name":"название","calories":число,"protein":число,"fat":число,"carbs":число,"weight":число}],"total":{"calories":число,"protein":число,"fat":число,"carbs":число},"comment":"краткий комментарий на русском"}`
        : 'Ты эксперт по питанию. Проанализируй фото еды. Определи блюда, примерный вес и КБЖУ. Верни ТОЛЬКО JSON: {"items":[{"name":"название","calories":число,"protein":число,"fat":число,"carbs":число,"weight":число}],"total":{"calories":число,"protein":число,"fat":число,"carbs":число},"comment":"краткий комментарий на русском"}'

      // Добавляем фото с описанием как сообщение пользователя
      setMessages(prev => [...prev, {
        role: 'user',
        content: imageDescription || '📸 Фото еды',
        image: selectedImage,
        timestamp: Date.now()
      }])

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          imageUrl: selectedImage,
          prompt,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.data) {
        let jsonStr = data.data
        const markdownMatch = data.data.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                              data.data.match(/```\s*([\s\S]*?)```/)
        if (markdownMatch) {
          jsonStr = markdownMatch[1].trim()
        }

        try {
          const parsed = JSON.parse(jsonStr)
          const foodEntry = { items: parsed.items || [], total: parsed.total || { calories: 0, protein: 0, fat: 0, carbs: 0 } }

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

          const newItems = foodEntry.items.filter((item: {name: string}) => !isDuplicate(item.name, todayItems))

          if (newItems.length === 0) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `📸 ${parsed.comment || 'Вот что я нашла:'}\n\n✅ Это уже записано в дневнике сегодня! 💕`,
              timestamp: Date.now()
            }])
          } else if (newItems.length < foodEntry.items.length) {
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
              content: `📸 ${parsed.comment || 'Вот что я нашла:'}\n\n⚠️ Часть продуктов уже записана. Добавлю только новое:`,
              timestamp: Date.now(),
              foodEntry: partialEntry
            }])
            setPendingFoodEntry(partialEntry)
          } else {
            setPendingFoodEntry(foodEntry)
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `📸 ${parsed.comment || 'Вот что я нашла:'}`, 
              timestamp: Date.now(), 
              foodEntry 
            }])
          }
        } catch (parseError: any) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `😕 Не удалось распознать фото\n\n${parseError.message || 'Попробуй другое фото'}`,
            timestamp: Date.now()
          }])
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `😕 Ошибка анализа\n\n${error.message || 'Попробуй ещё раз'}`,
        timestamp: Date.now()
      }])
    } finally {
      setAnalyzingImage(false)
      setSelectedImage(null)
      setImageDescription('')
    }
  }

  function cancelImageSelect() {
    setSelectedImage(null)
    setImageDescription('')
  }

  function addFoodToDiary() {
    if (!pendingFoodEntry) return
    const saved = localStorage.getItem('fitmate-diary')
    let logs = saved ? JSON.parse(saved) : []
    
    // Используем локальную дату Москвы, а не UTC
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}`
    
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
    
    // Используем локальную дату Москвы
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}`
    
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
    
    // Добавляем сообщение в чат
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `💧 Записала ${pendingWaterVolume} мл воды! Теперь за сегодня: ${logs[0].intake} мл`,
      timestamp: Date.now()
    }])
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
          <div className="flex items-center gap-2">
            <WaterWidget />
            <CaloriesWidget />
            <button onClick={clearChat} className="p-2 text-xs text-[hsl(var(--text-secondary))] hover:text-red-500">Очистить</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col overflow-hidden mt-20">
        {/* Вода - подтверждение (компактное) */}
        {pendingWaterVolume !== null && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="pointer-events-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full px-6 py-3 shadow-2xl border border-blue-400/30 animate-fade-in flex items-center gap-4">
              <span className="text-white font-bold">{pendingWaterVolume} мл 💧</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingWaterVolume(null)}
                  className="text-white/80 hover:text-white text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={addWaterToDiary}
                  className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-50 transition-colors"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Еда - подтверждение (компактное) */}
        {pendingFoodEntry && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="pointer-events-auto bg-gradient-to-r from-[hsl(var(--primary))] to-pink-500 rounded-full px-5 py-2.5 shadow-2xl border border-[hsl(var(--primary))]/30 animate-fade-in flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm whitespace-nowrap">{pendingFoodEntry.items.length} прод.</span>
                <span className="text-white text-sm">🍽️</span>
              </div>
              <div className="h-4 w-px bg-white/30"></div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingFoodEntry(null)}
                  className="text-white/80 hover:text-white text-xs px-2"
                >
                  Отмена
                </button>
                <button
                  onClick={addFoodToDiary}
                  className="bg-white text-[hsl(var(--primary))] px-3 py-1 rounded-full text-xs font-bold hover:bg-white/90 transition-colors"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-[hsl(var(--primary))] text-white rounded-br-md' : 'bg-[hsl(var(--card))] text-[hsl(var(--text-primary))] border border-[hsl(var(--border))] rounded-bl-md'}`}>
                {/* Фото если есть */}
                {msg.image && (
                  <img 
                    src={msg.image} 
                    alt="Attached" 
                    className="w-full max-w-xs rounded-lg mb-2 border border-white/20"
                  />
                )}
                {/* Контент */}
                <p className="text-sm whitespace-pre-wrap">{msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}</p>
                {/* Время */}
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-[hsl(var(--text-secondary))]'}`}>{new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-message-in">
              <div className="bg-[hsl(var(--card))] rounded-2xl px-4 py-3 border border-[hsl(var(--border))]">
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

        {/* Модальное окно для фото с описанием */}
        {selectedImage && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[hsl(var(--card))] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[hsl(var(--border))] animate-message-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[hsl(var(--text-primary))]">📸 Фото еды</h2>
                <button onClick={cancelImageSelect} className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
                  <span className="text-xl text-[hsl(var(--text-secondary))]">×</span>
                </button>
              </div>
              
              {/* Превью фото */}
              <img src={selectedImage} alt="Preview" className="w-full h-48 object-cover rounded-xl mb-4" />
              
              {/* Описание */}
              <div className="mb-4">
                <label className="text-sm font-medium text-[hsl(var(--text-primary))] mb-2 block">
                  Описание (необязательно)
                </label>
                <textarea
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="Например: завтракала овсянкой с ягодами..."
                  rows={3}
                  className="w-full resize-none bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
                />
              </div>
              
              {/* Кнопки */}
              <div className="flex gap-3">
                <button
                  onClick={cancelImageSelect}
                  className="flex-1 py-3 bg-[hsl(var(--muted))] text-[hsl(var(--text-primary))] rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={sendImageWithDescription}
                  disabled={analyzingImage}
                  className={`flex-1 py-3 bg-[hsl(var(--primary))] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2`}
                >
                  {analyzingImage ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Анализ...</>
                  ) : (
                    <><Send className="w-5 h-5" />Отправить</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
