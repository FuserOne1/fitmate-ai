'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Utensils, X, ArrowRight } from 'lucide-react'

export default function CaloriesWidget() {
  const [diaryData, setDiaryData] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fitmate-diary')
    if (saved) {
      try {
        const logs = JSON.parse(saved)
        if (logs[0]?.total) {
          setDiaryData(logs[0].total)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('fitmate-diary')
      if (saved) {
        try {
          const logs = JSON.parse(saved)
          if (logs[0]?.total) {
            setDiaryData(logs[0].total)
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Прогресс для каждого макроса (примерные нормы)
  const norms = { calories: 2000, protein: 100, fat: 70, carbs: 250 }
  const progress = {
    calories: Math.min(100, (diaryData.calories / norms.calories) * 100),
    protein: Math.min(100, (diaryData.protein / norms.protein) * 100),
    fat: Math.min(100, (diaryData.fat / norms.fat) * 100),
    carbs: Math.min(100, (diaryData.carbs / norms.carbs) * 100),
  }

  const colors = {
    calories: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-500/10' },
    protein: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/10' },
    fat: { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-500/10' },
    carbs: { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-500/10' },
  }

  return (
    <div className="relative">
      {/* Кнопка-виджет */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-to-br from-[hsl(var(--primary))] to-pink-500 rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform border-2 border-[hsl(var(--primary))]/30"
      >
        <svg className="absolute w-full h-full transform -rotate-90 p-1.5">
          <circle
            cx="26"
            cy="26"
            r="18"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="26"
            cy="26"
            r="18"
            stroke="white"
            strokeWidth="4"
            fill="none"
            strokeDasharray={2 * Math.PI * 18}
            strokeDashoffset={2 * Math.PI * 18 * (1 - progress.calories / 100)}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <Utensils className="w-6 h-6 text-white" />
        {diaryData.calories > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-[hsl(var(--primary))] text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
            {diaryData.calories}
          </span>
        )}
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed right-4 top-16 z-50 w-80 bg-[hsl(var(--card))] rounded-3xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden animate-fade-in max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-pink-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-white" />
                  <h3 className="font-bold text-white">КБЖУ</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 text-center">
                <p className="text-3xl font-bold text-white">{diaryData.calories} <span className="text-sm font-medium">ккал</span></p>
                <p className="text-xs text-white/80 mt-1">из 2000 ккал</p>
              </div>
            </div>

            {/* Macros */}
            <div className="p-4 space-y-4">
              {/* Белки */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium ${colors.protein.text}`}>Белки</span>
                  <span className="text-[hsl(var(--text-secondary))]">{diaryData.protein}г / {norms.protein}г</span>
                </div>
                <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.protein.bg} transition-all duration-500`}
                    style={{ width: `${progress.protein}%` }}
                  />
                </div>
              </div>

              {/* Жиры */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium ${colors.fat.text}`}>Жиры</span>
                  <span className="text-[hsl(var(--text-secondary))]">{diaryData.fat}г / {norms.fat}г</span>
                </div>
                <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.fat.bg} transition-all duration-500`}
                    style={{ width: `${progress.fat}%` }}
                  />
                </div>
              </div>

              {/* Углеводы */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium ${colors.carbs.text}`}>Углеводы</span>
                  <span className="text-[hsl(var(--text-secondary))]">{diaryData.carbs}г / {norms.carbs}г</span>
                </div>
                <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.carbs.bg} transition-all duration-500`}
                    style={{ width: `${progress.carbs}%` }}
                  />
                </div>
              </div>

              {/* Кнопка перехода в дневник */}
              <Link
                href="/diary"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-[hsl(var(--primary))] hover:opacity-90 text-white rounded-2xl py-3 font-bold transition-colors"
              >
                <span>Открыть дневник</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
