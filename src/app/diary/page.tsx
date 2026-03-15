'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Utensils, Plus, Trash2 } from 'lucide-react'

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

export default function DiaryPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedItems, setParsedItems] = useState<FoodItem[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [logs, setLogs] = useState<DailyLog[]>(() => {
    // Загрузка из localStorage при первом рендере
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitmate-diary')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {}
      }
    }
    return [
      {
        date: new Date().toLocaleDateString('ru-RU'),
        items: [],
        total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
      },
    ]
  })

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    const total = parsedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    )

    setLogs([
      {
        date: new Date().toLocaleDateString('ru-RU'),
        items: [...parsedItems, ...logs[0].items],
        total,
      },
      ...logs.slice(1),
    ])

    setParsedItems([])
    setShowConfirm(false)
    setInput('')
  }

  function removeItem(index: number) {
    setLogs([
      {
        ...logs[0],
        items: logs[0].items.filter((_, i) => i !== index),
        total: logs[0].items.reduce(
          (acc, item, i) => {
            if (i === index) return acc
            return {
              calories: acc.calories + item.calories,
              protein: acc.protein + item.protein,
              fat: acc.fat + item.fat,
              carbs: acc.carbs + item.carbs,
            }
          },
          { calories: 0, protein: 0, fat: 0, carbs: 0 }
        ),
      },
      ...logs.slice(1),
    ])
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
            📊 Сегодня ({logs[0].date})
          </h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-rose-50 rounded-xl">
              <p className="text-2xl font-bold text-rose-600">
                {logs[0].total.calories}
              </p>
              <p className="text-xs text-gray-500">ккал</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {logs[0].total.protein}
              </p>
              <p className="text-xs text-gray-500">белки</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">
                {logs[0].total.fat}
              </p>
              <p className="text-xs text-gray-500">жиры</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {logs[0].total.carbs}
              </p>
              <p className="text-xs text-gray-500">углеводы</p>
            </div>
          </div>

          {/* Food List */}
          {logs[0].items.length > 0 && (
            <div className="space-y-2">
              {logs[0].items.map((item, index) => (
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

          {logs[0].items.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">
              Пока ничего не записано 🍃
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
