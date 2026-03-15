'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Utensils, Droplets, Scale, MessageCircle, User, Settings, Heart } from 'lucide-react'
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

  useEffect(() => {
    // Выбираем случайную фразу при загрузке
    const random = CUTE_PHRASES[Math.floor(Math.random() * CUTE_PHRASES.length)]
    setPhrase(random)
  }, [])

  useEffect(() => {
    // Загружаем данные из дневника
    const loadDiaryData = () => {
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
    
    loadDiaryData()
    
    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fitmate-diary') {
        loadDiaryData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-pink-500 bg-clip-text text-transparent">
            FitMate AI 🌸
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Приветствие */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg mb-6 animate-fade-in border border-[hsl(var(--border))]">
          <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
            Привет! 👋
          </h2>
          <p className="text-[hsl(var(--text-secondary))] mb-4">
            Твой умный помощник для похудения
          </p>
          <div className="bg-[hsl(var(--muted))] rounded-2xl p-4 border border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 [color:hsl(var(--primary))]" />
              <p className="text-xs [color:hsl(var(--primary))] font-medium">От Сережи с любовью</p>
            </div>
            <p className="text-[hsl(var(--text-primary))] font-medium italic">"{phrase}"</p>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/diary" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className={`w-12 h-12 ${themeConfig.colors.primaryBg}/10 rounded-xl flex items-center justify-center mb-3`}>
              <Utensils className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">Дневник</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))]">Записать еду</p>
          </Link>

          <Link href="/water" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
              <Droplets className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">Вода</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))]">Трекер</p>
          </Link>

          <Link href="/weight" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
              <Scale className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">Вес</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))]">Взвешивание</p>
          </Link>

          <Link href="/chat" className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-95 border border-[hsl(var(--border))]">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--text-primary))]">AI Чат</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))]">Помощник</p>
          </Link>
        </div>

        {/* Статистика за день */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg mb-6 border border-[hsl(var(--border))]">
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">📊 Сегодня</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${themeConfig.colors.primaryText}`}>{diaryData.calories}</div>
              <div className="text-xs text-[hsl(var(--text-secondary))]">ккал</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{diaryData.protein}</div>
              <div className="text-xs text-[hsl(var(--text-secondary))]">белки</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{diaryData.fat}</div>
              <div className="text-xs text-[hsl(var(--text-secondary))]">жиры</div>
            </div>
          </div>
        </div>

        {/* Настройки */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">⚙️ Настройки</h3>
          <div className="space-y-3">
            <Link href="/settings/profile" className="flex items-center p-3 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors">
              <User className={`w-5 h-5 ${themeConfig.colors.primaryText} mr-3`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Профиль</span>
            </Link>
            <Link href="/settings/reminders" className="flex items-center p-3 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors">
              <span className="text-xl mr-3">🔔</span>
              <span className="font-medium text-[hsl(var(--text-primary))]">Напоминания</span>
            </Link>
            <Link href="/settings/theme" className="flex items-center p-3 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors">
              <span className="text-xl mr-3">🎨</span>
              <span className="font-medium text-[hsl(var(--text-primary))]">Тема</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Romantic Footer */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-[hsl(var(--card))]/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-[hsl(var(--border))] animate-fade-in">
          <p className="text-sm text-[hsl(var(--text-secondary))] flex items-center gap-2">
            <span className={themeConfig.colors.primaryText}>❤️</span>
            <span className="font-medium">Created with love by FuserOne1</span>
            <span className={themeConfig.colors.primaryText}>❤️</span>
            <span className={`${themeConfig.colors.primaryText} font-semibold`}>for Mashutka</span>
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-around">
          <Link href="/" className="flex flex-col items-center p-2">
            <span className={`text-xl ${themeConfig.colors.primaryText}`}>🏠</span>
            <span className={`text-xs font-medium ${themeConfig.colors.primaryText}`}>Главная</span>
          </Link>
          <Link href="/diary" className="flex flex-col items-center p-2 text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText} transition-colors">
            <span className="text-xl">🍽️</span>
            <span className="text-xs font-medium text-[hsl(var(--text-secondary))] hover:${themeConfig.colors.primaryText}">Дневник</span>
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
