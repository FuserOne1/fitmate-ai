'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Utensils, Plus, Trash2, History } from 'lucide-react'

type FoodItem = {
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  weight?: number
}

type DailyLog = {
  date: string // YYYY-MM-DD
  items: FoodItem[]
  total: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

// Получение текущей даты в формате YYYY-MM-DD по МСК
function getMoscowDate(): string {
  try {
    const now = new Date()
    const moscowTime = new Date(now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }))
    return moscowTime.toISOString().split('T')[0]
  } catch (e) {
    console.error('getMoscowDate error:', e)
    // Fallback: просто берём текущую дату
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

// Конвертация даты в формат YYYY-MM-DD из разных форматов
function parseDate(dateStr: string): string {
  try {
    // Если уже в формате YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    // Если в формате DD.MM.YYYY
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('.')
      return `${year}-${month}-${day}`
    }
    
    // Пытаемся распарсить как Date
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    return dateStr
  } catch (e) {
    console.error('parseDate error:', e, dateStr)
    return dateStr
  }
}

// Получение текущей даты для отображения
function getDisplayDate(dateStr: string): string {
  try {
    const normalizedDate = parseDate(dateStr)
    const date = new Date(normalizedDate + 'T00:00:00')
    
    if (isNaN(date.getTime())) {
      return dateStr
    }
    
    const today = new Date()
    const moscowToday = new Date(today.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }))
    
    if (normalizedDate === getMoscowDate()) {
      return 'Сегодня'
    }
    
    const yesterday = new Date(moscowToday)
    yesterday.setDate(yesterday.getDate() - 1)
    if (normalizedDate === yesterday.toISOString().split('T')[0]) {
      return 'Вчера'
    }
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  } catch (e) {
    console.error('getDisplayDate error:', e)
    return dateStr
  }
}

export default function DiaryPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedItems, setParsedItems] = useState<FoodItem[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      return getMoscowDate()
    } catch (e) {
      console.error('Error getting Moscow date:', e)
      return new Date().toISOString().split('T')[0]
    }
  })

  console.log('Diary render - selectedDate:', selectedDate, 'logs:', logs)

  // Загрузка из localStorage при первом рендере
  useEffect(() => {
    console.log('Diary useEffect - loading from localStorage')
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fitmate-diary')
        console.log('Raw saved data:', saved)
        
        if (saved) {
          const parsedLogs = JSON.parse(saved)
          console.log('Parsed logs before normalization:', parsedLogs)

          // Нормализуем даты
          const normalizedLogs = parsedLogs.map((log: DailyLog) => ({
            ...log,
            date: parseDate(log.date),
          }))
          console.log('Normalized logs:', normalizedLogs)

          // Проверяем, есть ли запись за сегодня
          const today = getMoscowDate()
          console.log('Today:', today)
          const todayLog = normalizedLogs.find((log: DailyLog) => log.date === today)

          if (!todayLog) {
            // Добавляем запись за сегодня
            normalizedLogs.unshift({
              date: today,
              items: [],
              total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
            })
          }

          // Фильтруем только корректные записи
          const validLogs = normalizedLogs.filter((log: DailyLog) => {
            const isValid = log.date && /^\d{4}-\d{2}-\d{2}$/.test(log.date)
            console.log('Log date:', log.date, 'valid:', isValid)
            return isValid
          })

          console.log('Setting valid logs:', validLogs)
          setLogs(validLogs)
        } else {
          const defaultLog = {
            date: getMoscowDate(),
            items: [],
            total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
          }
          console.log('No saved data, using default:', defaultLog)
          setLogs([defaultLog])
        }
      } catch (e) {
        console.error('Failed to parse diary:', e)
        const fallbackLog = {
          date: getMoscowDate(),
          items: [],
          total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
        }
        setLogs([fallbackLog])
      }
    }
  }, [])

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (logs.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('fitmate-diary', JSON.stringify(logs))
    }
  }, [logs])

  // Проверка смены даты (полночь по МСК)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentMoscowDate = getMoscowDate()
      if (selectedDate !== currentMoscowDate) {
        setSelectedDate(currentMoscowDate)
        
        // Проверяем, есть ли запись за новую дату
        setLogs(prevLogs => {
          const todayLog = prevLogs.find(log => log.date === currentMoscowDate)
          if (!todayLog) {
            return [
              {
                date: currentMoscowDate,
                items: [],
                total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
              },
              ...prevLogs,
            ]
          }
          return prevLogs
        })
      }
    }, 60000) // Проверяем каждую минуту

    return () => clearInterval(interval)
  }, [selectedDate])

  const currentLog = logs.find(log => log.date === selectedDate) || {
    date: selectedDate,
    items: [],
    total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  }

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
        alert('Не удалось распознать продукты 😅 Попробуй описать подробнее!')
      }
    } catch (error) {
      console.error('Parse error:', error)
      alert('Ошибка соединения. Попробуй ещё раз!')
    } finally {
      setLoading(false)
    }
  }

  function addToDiary() {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs]
      const todayIndex = newLogs.findIndex(log => log.date === selectedDate)
      
      if (todayIndex === -1) {
        // Создаём новую запись за сегодня
        const newLog: DailyLog = {
          date: selectedDate,
          items: parsedItems,
          total: parsedItems.reduce(
            (acc, item) => ({
              calories: acc.calories + item.calories,
              protein: acc.protein + item.protein,
              fat: acc.fat + item.fat,
              carbs: acc.carbs + item.carbs,
            }),
            { calories: 0, protein: 0, fat: 0, carbs: 0 }
          ),
        }
        newLogs.unshift(newLog)
      } else {
        // Обновляем существующую запись
        const todayLog = newLogs[todayIndex]
        const newItems = [...parsedItems, ...todayLog.items]
        const newTotal = newItems.reduce(
          (acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            fat: acc.fat + item.fat,
            carbs: acc.carbs + item.carbs,
          }),
          { calories: 0, protein: 0, fat: 0, carbs: 0 }
        )
        newLogs[todayIndex] = {
          ...todayLog,
          items: newItems,
          total: newTotal,
        }
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
      
      newLogs[todayIndex] = {
        ...todayLog,
        items: newItems,
        total: newTotal,
      }
      
      return newLogs
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
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
            <Utensils className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-bold text-gray-800">Дневник Питания</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Date Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-md shadow-rose-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-500" />
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
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getDisplayDate(log.date)}
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-rose-100 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            🍽️ Что съела?
          </h2>
          <div className="space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Например: 9 наггетсов, 2 больших теоса, протеиновый коктейль"
              className="w-full resize-none bg-rose-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 min-h-[100px]"
            />
            <button
              onClick={parseFood}
              disabled={loading || !input.trim()}
              className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Распознать
                </>
              )}
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="bg-white rounded-3xl p-6 shadow-lg shadow-rose-100 mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              ✅ Подтверди продукты
            </h2>
            <div className="space-y-3 mb-4">
              {parsedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-rose-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.weight ? `${item.weight}г • ` : ''}
                      {item.calories} ккал
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      Б: {item.protein}г | Ж: {item.fat}г | У: {item.carbs}г
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setParsedItems([])
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                onClick={addToDiary}
                className="flex-1 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Добавить
              </button>
            </div>
          </div>
        )}

        {/* Today's Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-rose-100 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            📊 {getDisplayDate(selectedDate)}
          </h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-rose-50 rounded-xl">
              <p className="text-2xl font-bold text-rose-600">
                {currentLog.total.calories}
              </p>
              <p className="text-xs text-gray-500">ккал</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {currentLog.total.protein}
              </p>
              <p className="text-xs text-gray-500">белки</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">
                {currentLog.total.fat}
              </p>
              <p className="text-xs text-gray-500">жиры</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {currentLog.total.carbs}
              </p>
              <p className="text-xs text-gray-500">углеводы</p>
            </div>
          </div>

          {/* Food List */}
          {currentLog.items.length > 0 && (
            <div className="space-y-2">
              {currentLog.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.calories} ккал</p>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {currentLog.items.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">
              Пока ничего не записано 🍃
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
