'use client'

import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function ThemePage() {
  const { theme, setTheme, themeConfig } = useTheme()

  const themes: Array<{
    id: string
    name: string
    emoji: string
    gradient: string
    preview: string
  }> = [
    {
      id: 'rose',
      name: 'Розовая',
      emoji: '🌸',
      gradient: 'from-rose-50 to-pink-100',
      preview: 'bg-rose-500',
    },
    {
      id: 'lavender',
      name: 'Лаванда',
      emoji: '💜',
      gradient: 'from-violet-50 to-purple-100',
      preview: 'bg-violet-500',
    },
    {
      id: 'peach',
      name: 'Персик',
      emoji: '🍑',
      gradient: 'from-orange-50 to-amber-100',
      preview: 'bg-orange-500',
    },
    {
      id: 'sage',
      name: 'Шалфей',
      emoji: '🌿',
      gradient: 'from-emerald-50 to-green-100',
      preview: 'bg-emerald-500',
    },
    {
      id: 'dark',
      name: 'Тёмная',
      emoji: '🌙',
      gradient: 'from-gray-900 to-gray-800',
      preview: 'bg-gray-700',
    },
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.gradient}`}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/settings"
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Выбор темы</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <p className="text-gray-600 mb-4">
            Выбери тему оформления для приложения:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`relative flex items-center p-4 rounded-2xl border-2 transition-all ${
                  theme === t.id
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-3xl mr-4 shadow-md`}
                >
                  {t.emoji}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <p className="text-sm text-gray-500">
                    {t.id === theme ? 'Выбрана' : 'Нажми для выбора'}
                  </p>
                </div>
                {theme === t.id && (
                  <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Предпросмотр
          </h2>
          <div className={`rounded-2xl p-6 bg-gradient-to-br ${themeConfig.colors.gradient}`}>
            <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-md">
              <p className={`font-bold ${themeConfig.colors.primaryText} mb-2`}>
                {themeConfig.name} {themeConfig.emoji}
              </p>
              <p className="text-sm text-gray-600">
                Так будет выглядеть твоё приложение с этой темой
              </p>
              <button
                className={`mt-3 px-4 py-2 ${themeConfig.colors.primaryBg} text-white rounded-lg text-sm font-medium`}
              >
                Пример кнопки
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
