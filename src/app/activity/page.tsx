'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Footprints, Dumbbell } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function ActivityPage() {
  const { themeConfig } = useTheme()

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">🏃‍♀️ Активность</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Шаги */}
          <Link
            href="/steps"
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-lg text-white hover:shadow-xl transition-all active:scale-98"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Footprints className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Шаги</h2>
                <p className="text-xs text-white/80">Трекер шагов</p>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">👣</div>
            <p className="text-sm text-white/80">Следи за активностью</p>
          </Link>

          {/* Тренировки */}
          <Link
            href="/workouts"
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 shadow-lg text-white hover:shadow-xl transition-all active:scale-98"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Тренировки</h2>
                <p className="text-xs text-white/80">Планы и история</p>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">💪</div>
            <p className="text-sm text-white/80">Йога, пилатес и не только</p>
          </Link>
        </div>

        {/* Инфо */}
        <div className="mt-6 bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-3">📊 Зачем это нужно?</h3>
          <div className="space-y-3 text-sm text-[hsl(var(--text-secondary))]">
            <div className="flex items-start gap-3">
              <span className="text-xl">👣</span>
              <div>
                <p className="font-medium text-[hsl(var(--text-primary))]">Шаги</p>
                <p>Ежедневная активность влияет на расход калорий и общее самочувствие</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">💪</span>
              <div>
                <p className="font-medium text-[hsl(var(--text-primary))]">Тренировки</p>
                <p>Регулярные занятия укрепляют тело, улучшают настроение и помогают достигать целей</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
