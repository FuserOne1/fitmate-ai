'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Utensils, Droplets, Scale, MessageCircle, Heart, Footprints, Dumbbell, TrendingUp } from 'lucide-react'
import { useTheme } from '@/lib/theme'

// Милые фразы от Сережи
const CUTE_PHRASES = [
  'Отлично выглядишь! 💕',
  'У тебя всё получится! 💪',
  'Пей больше водички! 💧',
  'Люблю тебя! — Сережа ❤️',
  'Ты самая красивая! 🌸',
  'Горжусь тобой! 🥰',
  'Ты молодец! Так держать! ✨',
  'Каждый шаг к цели — это победа! 🎯',
  'Ты сильнее, чем думаешь! 💖',
  'Сияй, моя хорошая! 🌟',
]

export default function HomePage() {
  const [phrase, setPhrase] = useState(CUTE_PHRASES[0])
  const { themeConfig } = useTheme()
  const [diaryData, setDiaryData] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 })
  const [waterIntake, setWaterIntake] = useState(0)
  const [weightData, setWeightData] = useState<{weight: number, fatPercent?: number, muscleMass?: number} | null>(null)
  const [stepsData, setStepsData] = useState<{steps: number, distance_km?: number, calories_burned?: number} | null>(null)
  const [workoutStats, setWorkoutStats] = useState<{count: number, calories: number, minutes: number}>({ count: 0, calories: 0, minutes: 0 })

  useEffect(() => {
    // Выбираем случайную фразу при загрузке
    const random = CUTE_PHRASES[Math.floor(Math.random() * CUTE_PHRASES.length)]
    setPhrase(random)
  }, [])

  useEffect(() => {
    // Загружаем все данные
    const loadAllData = () => {
      // Дневник питания
      const diarySaved = localStorage.getItem('fitmate-diary')
      if (diarySaved) {
        try {
          const logs = JSON.parse(diarySaved)
          const today = logs[0]
          if (today && today.total) {
            setDiaryData(today.total)
          }
        } catch {}
      }

      // Вода (ищем за сегодня)
      const waterSaved = localStorage.getItem('fitmate-water')
      if (waterSaved) {
        try {
          const logs = JSON.parse(waterSaved)
          const today = new Date().toISOString().split('T')[0]
          const todayLog = logs.find((log: any) => log.date === today)
          if (todayLog) {
            setWaterIntake(todayLog.intake || 0)
          }
        } catch {}
      }

      // Вес (последняя запись)
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

      // Тренировки (статистика за неделю)
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
    }

    loadAllData()

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (['fitmate-diary', 'fitmate-water', 'fitmate-weight', 'fitmate-steps', 'fitmate-workouts'].includes(e.key || '')) {
        loadAllData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-pink-500 bg-clip-text text-transparent">
              FitMate AI 🌸
            </h1>
            <p className="text-[10px] text-[hsl(var(--text-secondary))]">
              Created with ❤️ by FuserOne1 for Mashutka
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Послание от Сережи */}
        <div className="bg-gradient-to-r from-[hsl(var(--primary))]/10 to-pink-500/10 rounded-2xl p-4 border border-[hsl(var(--primary))]/20 mb-6">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Heart className="w-4 h-4 [color:hsl(var(--primary))]" />
            <p className="text-xs [color:hsl(var(--primary))] font-medium">От Сережи с любовью ❤️</p>
          </div>
          <p className="text-[hsl(var(--text-primary))] font-medium italic text-center text-lg">"{phrase}"</p>
        </div>

        {/* Быстрые действия - 4 основные кнопки */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/nutrition" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-xl flex items-center justify-center mb-3">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">Питание</h3>
            <p className="text-xs text-[hsl(var(--text-secondary))]">Дневник и вода</p>
          </Link>

          <Link href="/activity" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl flex items-center justify-center mb-3">
              <span className="text-2xl">🏃‍♀️</span>
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">Активность</h3>
            <p className="text-xs text-[hsl(var(--text-secondary))]">Шаги и тренировки</p>
          </Link>

          <Link href="/weight" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl flex items-center justify-center mb-3">
              <Scale className={`w-6 h-6 text-purple-500`} />
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">Вес</h3>
            <p className="text-xs text-[hsl(var(--text-secondary))]">Взвешивание</p>
          </Link>

          <Link href="/chat" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">AI Чат</h3>
            <p className="text-xs text-[hsl(var(--text-secondary))]">Помощник</p>
          </Link>
        </div>

        {/* Статистика за день */}
        <div className="space-y-4">
          {/* КБЖУ */}
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              КБЖУ за сегодня
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
                <div className={`text-2xl font-bold ${themeConfig.colors.primaryText}`}>{Math.round(diaryData.calories)}</div>
                <div className="text-xs text-[hsl(var(--text-secondary))]">ккал</div>
              </div>
              <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
                <div className="text-lg font-bold text-blue-500">{Math.round(diaryData.protein)}</div>
                <div className="text-xs text-[hsl(var(--text-secondary))]">белки</div>
              </div>
              <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
                <div className="text-lg font-bold text-yellow-500">{Math.round(diaryData.fat)}</div>
                <div className="text-xs text-[hsl(var(--text-secondary))]">жиры</div>
              </div>
              <div className="text-center p-3 bg-[hsl(var(--muted))] rounded-xl">
                <div className="text-lg font-bold text-green-500">{Math.round(diaryData.carbs)}</div>
                <div className="text-xs text-[hsl(var(--text-secondary))]">углеводы</div>
              </div>
            </div>
          </div>

          {/* Вода */}
          <Link href="/water" className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] block hover:shadow-xl transition-all active:scale-98">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
              <span className="text-xl">💧</span>
              Вода за сегодня
            </h3>
            <div className="relative overflow-hidden">
              {/* Прогресс бар */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/20 to-cyan-500/20 rounded-t-full transition-all duration-500" style={{ height: `${Math.min(100, (waterIntake / 2000) * 100)}%` }}></div>
              <div className="relative z-10 text-center p-4 bg-blue-500/10 rounded-2xl">
                <div className="text-4xl font-bold text-blue-500 mb-1">{waterIntake}</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">мл выпито</div>
                <div className="text-xs text-blue-500 mt-2 font-medium">
                  {waterIntake >= 2000 ? '✅ Норма выполнена!' : `Осталось: ${2000 - waterIntake} мл`}
                </div>
              </div>
            </div>
          </Link>

          {/* Вес */}
          <Link href="/weight" className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] block hover:shadow-xl transition-all active:scale-98">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              Вес и замеры
            </h3>
            {weightData ? (
              <div className="space-y-3">
                <div className="text-center p-4 bg-purple-500/10 rounded-2xl">
                  <div className="text-4xl font-bold text-purple-500 mb-1">{weightData.weight}</div>
                  <div className="text-sm text-[hsl(var(--text-secondary))]">кг</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {weightData.fatPercent && (
                    <div className="text-center p-3 bg-orange-500/10 rounded-xl">
                      <div className="text-lg font-bold text-orange-500">{weightData.fatPercent}%</div>
                      <div className="text-xs text-[hsl(var(--text-secondary))]">жир</div>
                    </div>
                  )}
                  {weightData.muscleMass && (
                    <div className="text-center p-3 bg-blue-500/10 rounded-xl">
                      <div className="text-lg font-bold text-blue-500">{weightData.muscleMass}</div>
                      <div className="text-xs text-[hsl(var(--text-secondary))]">мышцы, кг</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-[hsl(var(--muted))] rounded-2xl">
                <div className="text-sm text-[hsl(var(--text-secondary))]">Вес ещё не записан</div>
              </div>
            )}
          </Link>

          {/* Шаги */}
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Footprints className="w-5 h-5 text-green-500" />
                Шаги сегодня
              </h3>
              <Link href="/steps" className={`text-xs font-medium ${themeConfig.colors.primaryText} hover:underline`}>
                Все →
              </Link>
            </div>
            {stepsData && stepsData.steps > 0 ? (
              <div className="space-y-3">
                <div className="text-center p-4 bg-green-500/10 rounded-2xl">
                  <div className="text-4xl font-bold text-green-500 mb-1">{stepsData.steps.toLocaleString()}</div>
                  <div className="text-sm text-[hsl(var(--text-secondary))]">шагов</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {stepsData.distance_km && (
                    <div className="text-center p-3 bg-blue-500/10 rounded-xl">
                      <div className="text-lg font-bold text-blue-500">{stepsData.distance_km.toFixed(1)}</div>
                      <div className="text-xs text-[hsl(var(--text-secondary))]">км</div>
                    </div>
                  )}
                  {stepsData.calories_burned && (
                    <div className="text-center p-3 bg-orange-500/10 rounded-xl">
                      <div className="text-lg font-bold text-orange-500">{Math.round(stepsData.calories_burned)}</div>
                      <div className="text-xs text-[hsl(var(--text-secondary))]">ккал</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-[hsl(var(--muted))] rounded-2xl">
                <div className="text-sm text-[hsl(var(--text-secondary))]">Шаги ещё не записаны</div>
              </div>
            )}
          </div>

          {/* Тренировки за неделю */}
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-500" />
                Активность за неделю
              </h3>
              <Link href="/workouts" className={`text-xs font-medium ${themeConfig.colors.primaryText} hover:underline`}>
                Все →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-orange-500/10 rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{workoutStats.count}</div>
                <div className="text-xs text-[hsl(var(--text-secondary))]">тренировок</div>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-xl">
                <div className="text-2xl font-bold text-red-500">{workoutStats.calories}</div>
                <div className="text-xs text-[hsl(var(--text-secondary))]">ккал</div>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-xl">
                <div className="text-2xl font-bold text-green-500">{Math.round(workoutStats.minutes / 60)}</div>
                <div className="text-xs text-[hsl(var(--text-secondary))]">часов</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--card))]/95 backdrop-blur-lg border-t border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-around">
          <Link href="/" className="flex flex-col items-center p-2">
            <span className={`text-xl ${themeConfig.colors.primaryText}`}>🏠</span>
            <span className={`text-xs font-medium ${themeConfig.colors.primaryText}`}>Главная</span>
          </Link>
          <Link href="/nutrition" className="flex flex-col items-center p-2 text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText} transition-colors">
            <span className="text-xl">🍽️</span>
            <span className="text-xs font-medium text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText}">Питание</span>
          </Link>
          <Link href="/activity" className="flex flex-col items-center p-2 text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText} transition-colors">
            <span className="text-xl">🏃‍♀️</span>
            <span className="text-xs font-medium text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText}">Активность</span>
          </Link>
          <Link href="/chat" className="flex flex-col items-center p-2 text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText} transition-colors">
            <span className="text-xl">💬</span>
            <span className="text-xs font-medium text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText}">Чат</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center p-2 text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText} transition-colors">
            <span className="text-xl">⚙️</span>
            <span className="text-xs font-medium text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText}">Настройки</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-24"></div>
    </div>
  )
}
