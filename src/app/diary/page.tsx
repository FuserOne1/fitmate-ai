'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Utensils, Plus, Trash2, History } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type FoodItem = {
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  weight?: number
}

type DailyLog = {
  date: string
  items: FoodItem[]
  total: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

function getMoscowDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('.')
    return `${year}-${month}-${day}`
  }
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return dateStr
}

function getDisplayDate(dateStr: string): string {
  const normalizedDate = parseDate(dateStr)
  const [year, month, day] = normalizedDate.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const todayStr = getMoscowDate()
  if (normalizedDate === todayStr) return 'Сегодня'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export default function DiaryPage() {
  const { themeConfig } = useTheme()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedItems, setParsedItems] = useState<FoodItem[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [selectedDate, setSelectedDate] = useState(getMoscowDate())
  const [goals, setGoals] = useState({ calories: 2000, protein: 100, fat: 70, carbs: 250 })

  useEffect(() => {
    // Загружаем цели
    const savedGoals = localStorage.getItem('fitmate-goals')
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals)
        setGoals({
          calories: parsed.calories || 2000,
          protein: parsed.protein || 100,
          fat: parsed.fat || 70,
          carbs: parsed.carbs || 250
        })
      } catch {}
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('fitmate-diary')
    if (saved) {
      try {
        const parsedLogs = JSON.parse(saved)
        const normalizedLogs = parsedLogs.map((log: DailyLog) => ({
          ...log,
          date: parseDate(log.date),
        }))
        const today = getMoscowDate()
        const todayLog = normalizedLogs.find((log: DailyLog) => log.date === today)
        if (!todayLog) {
          normalizedLogs.unshift({
            date: today,
            items: [],
            total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
          })
        }
        const validLogs = normalizedLogs.filter((log: DailyLog) =>
          log.date && /^\d{4}-\d{2}-\d{2}$/.test(log.date)
        )
        setLogs(validLogs)
      } catch (e) {
        console.error('Failed to parse diary:', e)
        setLogs([{ date: getMoscowDate(), items: [], total: { calories: 0, protein: 0, fat: 0, carbs: 0 } }])
      }
    } else {
      setLogs([{ date: getMoscowDate(), items: [], total: { calories: 0, protein: 0, fat: 0, carbs: 0 } }])
    }
  }, [])

  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('fitmate-diary', JSON.stringify(logs))
    }
  }, [logs])

  async function parseFood() {
    if (!input.trim() || loading) return
    setLoading(true)
    try {
      const response = await fetch('/api/ai/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      })
      const data = await response.json()
      if (data.success && data.items) {
        setParsedItems(data.items)
        setShowConfirm(true)
      } else {
        alert('Не удалось распознать продукты 😅')
      }
    } catch (error) {
      console.error('Parse error:', error)
      alert('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  function addToDiary() {
    // Считаем новый тотал
    const todayIndex = logs.findIndex(log => log.date === selectedDate)
    const currentTotal = todayIndex >= 0 ? logs[todayIndex].total : { calories: 0, protein: 0, fat: 0, carbs: 0 }
    const newItemsTotal = parsedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    )
    const newTotal = {
      calories: currentTotal.calories + newItemsTotal.calories,
      protein: currentTotal.protein + newItemsTotal.protein,
      fat: currentTotal.fat + newItemsTotal.fat,
      carbs: currentTotal.carbs + newItemsTotal.carbs
    }
    
    // Проверяем превышение
    const calorieOver = newTotal.calories - goals.calories
    const isToday = selectedDate === getMoscowDate()
    
    if (isToday && calorieOver > 0) {
      const confirmSave = confirm(
        `⚠️ Превышение калорий!\n\n` +
        `После записи будет: ${newTotal.calories} ккал\n` +
        `Норма: ${goals.calories} ккал\n` +
        `Превышение: ${calorieOver} ккал\n\n` +
        `Может стоит притормозить? 🤔\n\n` +
        `Всё равно записать?`
      )
      if (!confirmSave) {
        setShowConfirm(false)
        return
      }
    }
    
    setLogs(prevLogs => {
      const newLogs = [...prevLogs]
      const newItems = [...parsedItems, ...(todayIndex >= 0 ? newLogs[todayIndex].items : [])]
      if (todayIndex >= 0) {
        newLogs[todayIndex] = { ...newLogs[todayIndex], items: newItems, total: newTotal }
      } else {
        newLogs.unshift({ date: selectedDate, items: newItems, total: newTotal })
      }
      return newLogs
    })
    setParsedItems([])
    setShowConfirm(false)
    setInput('')
  }

  function removeItem(index: number) {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs]
      const todayIndex = newLogs.findIndex(log => log.date === selectedDate)
      if (todayIndex === -1) return prevLogs
      const todayLog = newLogs[todayIndex]
      const newItems = todayLog.items.filter((_, i) => i !== index)
      const newTotal = newItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          fat: acc.fat + item.fat,
          carbs: acc.carbs + item.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      )
      newLogs[todayIndex] = { ...todayLog, items: newItems, total: newTotal }
      return newLogs
    })
  }

  const currentLog = logs.find(log => log.date === selectedDate) || {
    date: selectedDate,
    items: [],
    total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  }

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <div className="flex items-center gap-2">
            <Utensils className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
            <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Дневник Питания</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <History className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
              {getDisplayDate(selectedDate)}
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {logs.slice(0, 7).map(log => (
              <button
                key={log.date}
                onClick={() => setSelectedDate(log.date)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedDate === log.date
                    ? `${themeConfig.colors.primaryBg} text-white`
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--muted))]/80'
                }`}
              >
                {getDisplayDate(log.date)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">🍽️ Что съела?</h2>
          <div className="space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Например: 9 наггетсов, 2 больших теоса, протеиновый коктейль"
              className="w-full resize-none bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
            />
            <button
              onClick={parseFood}
              disabled={loading || !input.trim()}
              className={`w-full py-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium`}
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Анализирую...</>
              ) : (
                <><Send className="w-5 h-5" />Распознать</>
              )}
            </button>
          </div>
        </div>

        {showConfirm && (
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">✅ Подтверди продукты</h2>
            <div className="space-y-3 mb-4">
              {parsedItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-[hsl(var(--muted))] rounded-xl">
                  <div>
                    <p className="font-medium text-[hsl(var(--text-primary))]">{item.name}</p>
                    <p className="text-xs text-[hsl(var(--text-secondary))]">
                      {item.weight ? `${item.weight}г • ` : ''}{item.calories} ккал
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[hsl(var(--text-secondary))]">
                      Б: {item.protein}г | Ж: {item.fat}г | У: {item.carbs}г
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setParsedItems([]); }}
                className="flex-1 py-3 bg-[hsl(var(--muted))] text-[hsl(var(--text-primary))] rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                onClick={addToDiary}
                className={`flex-1 py-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 transition-colors font-medium flex items-center justify-center gap-2`}
              >
                <Plus className="w-5 h-5" />Добавить
              </button>
            </div>
          </div>
        )}

        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">📊 {getDisplayDate(selectedDate)}</h2>
          
          {/* Прогресс с целями */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[hsl(var(--text-primary))]">Калории</span>
              <span className={`text-sm font-bold ${currentLog.total.calories > goals.calories ? 'text-red-500' : 'text-[hsl(var(--text-secondary))]'}`}>
                {currentLog.total.calories} / {goals.calories} ккал
              </span>
            </div>
            <div className="h-3 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  currentLog.total.calories > goals.calories ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-[hsl(var(--primary))] to-pink-500'
                }`}
                style={{ width: `${Math.min(100, (currentLog.total.calories / goals.calories) * 100)}%` }}
              />
            </div>
            {currentLog.total.calories > goals.calories && selectedDate === getMoscowDate() && (
              <p className="text-xs text-red-500 mt-2 text-center font-medium">
                ⚠️ Превышение на {currentLog.total.calories - goals.calories} ккал!
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
              <p className={`text-2xl font-bold ${themeConfig.colors.primaryText}`}>{currentLog.total.calories}</p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">ккал</p>
            </div>
            <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
              <p className="text-2xl font-bold text-blue-500">{currentLog.total.protein}</p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">белки</p>
            </div>
            <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
              <p className="text-2xl font-bold text-yellow-500">{currentLog.total.fat}</p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">жиры</p>
            </div>
            <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
              <p className="text-2xl font-bold text-green-500">{currentLog.total.carbs}</p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">углеводы</p>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--border))] pt-4">
            {currentLog.items.length > 0 ? (
            <div className="space-y-2">
              {currentLog.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-[hsl(var(--muted))] rounded-xl">
                  <div>
                    <p className="font-medium text-[hsl(var(--text-primary))]">{item.name}</p>
                    <p className="text-xs text-[hsl(var(--text-secondary))]">{item.calories} ккал</p>
                  </div>
                  <button onClick={() => removeItem(index)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[hsl(var(--text-secondary))] text-sm py-8">Пока ничего не записано 🍃</p>
          )}
          </div>
        </div>
      </main>
    </div>
  )
}
