'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Save } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function ProfilePage() {
  const { themeConfig } = useTheme()
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [proteinGoal, setProteinGoal] = useState(100)
  const [fatGoal, setFatGoal] = useState(70)
  const [carbsGoal, setCarbsGoal] = useState(250)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Загружаем настройки
    const saved = localStorage.getItem('fitmate-goals')
    if (saved) {
      try {
        const goals = JSON.parse(saved)
        if (goals.calories) setCalorieGoal(goals.calories)
        if (goals.protein) setProteinGoal(goals.protein)
        if (goals.fat) setFatGoal(goals.fat)
        if (goals.carbs) setCarbsGoal(goals.carbs)
      } catch {}
    }
  }, [])

  const handleSave = () => {
    setSaving(true)
    const goals = {
      calories: calorieGoal,
      protein: proteinGoal,
      fat: fatGoal,
      carbs: carbsGoal
    }
    localStorage.setItem('fitmate-goals', JSON.stringify(goals))
    window.dispatchEvent(new Event('storage'))
    setSaving(false)
    alert('✅ Цели сохранены!')
  }

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/settings" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Профиль</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Цели по КБЖУ */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
            <User className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
            Цели по КБЖУ
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                🔥 Калории (ккал/день)
              </label>
              <input
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--text-primary))] mb-2">
                  Белки (г)
                </label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-[hsl(var(--muted))] rounded-xl px-3 py-3 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--text-primary))] mb-2">
                  Жиры (г)
                </label>
                <input
                  type="number"
                  value={fatGoal}
                  onChange={(e) => setFatGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-[hsl(var(--muted))] rounded-xl px-3 py-3 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--text-primary))] mb-2">
                  Углеводы (г)
                </label>
                <input
                  type="number"
                  value={carbsGoal}
                  onChange={(e) => setCarbsGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-[hsl(var(--muted))] rounded-xl px-3 py-3 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-pink-500 hover:from-[hsl(var(--primary))]/90 hover:to-pink-500/90 disabled:opacity-50 text-white rounded-2xl py-3 font-bold transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Сохранение...' : 'Сохранить цели'}
            </button>
          </div>
        </div>

        {/* Информация */}
        <div className="bg-gradient-to-br from-[hsl(var(--primary))]/10 to-pink-500/10 rounded-3xl p-6 border border-[hsl(var(--primary))]/20">
          <h3 className="font-bold text-[hsl(var(--text-primary))] mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Как рассчитать норму?
          </h3>
          <ul className="space-y-2 text-sm text-[hsl(var(--text-secondary))]">
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--primary))] mt-1">•</span>
              <span>Для похудения: вес (кг) × 24-28 ккал</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--primary))] mt-1">•</span>
              <span>Для поддержания: вес (кг) × 30-35 ккал</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--primary))] mt-1">•</span>
              <span>Белки: 1.5-2г на кг веса</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--primary))] mt-1">•</span>
              <span>Жиры: 0.8-1.2г на кг веса</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--primary))] mt-1">•</span>
              <span>Углеводы: остаток калорий</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
