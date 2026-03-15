'use client'

import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function ThemePage() {
  const { theme, setTheme, themeConfig } = useTheme()

  const themes = [
    { id: 'rose', name: 'Розовая', emoji: '🌸' },
    { id: 'lavender', name: 'Лаванда', emoji: '💜' },
    { id: 'peach', name: 'Персик', emoji: '🍑' },
    { id: 'sage', name: 'Шалфей', emoji: '🌿' },
    { id: 'dark', name: 'Тёмная', emoji: '🌙' },
  ]

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/settings" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Выбор темы</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <p className="text-[hsl(var(--text-secondary))] mb-4">
            Выбери тему оформления для приложения:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`relative flex items-center p-4 rounded-2xl border-2 transition-all ${
                  theme === t.id
                    ? `border-[hsl(var(--primary))] bg-[hsl(var(--muted))]`
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/60'
                }`}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-3xl mr-4 shadow-md
                  ${t.id === 'rose' ? 'from-rose-50 to-pink-100' : 
                    t.id === 'lavender' ? 'from-violet-50 to-purple-100' :
                    t.id === 'peach' ? 'from-orange-50 to-amber-100' :
                    t.id === 'sage' ? 'from-emerald-50 to-green-100' :
                    'from-gray-700 to-gray-900'
                  }`}
                >
                  {t.emoji}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[hsl(var(--text-primary))]">{t.name}</p>
                  <p className="text-sm text-[hsl(var(--text-secondary))]">
                    {t.id === theme ? 'Выбрана' : 'Нажми для выбора'}
                  </p>
                </div>
                {theme === t.id && (
                  <div className={`w-8 h-8 ${themeConfig.colors.primaryBg} rounded-full flex items-center justify-center`}>
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">
            Предпросмотр
          </h2>
          <div className={`rounded-2xl p-6 bg-gradient-to-br ${themeConfig.colors.gradient}`}>
            <div className="bg-[hsl(var(--card))]/90 backdrop-blur rounded-xl p-4 shadow-md border border-[hsl(var(--border))]">
              <p className={`font-bold ${themeConfig.colors.primaryText} mb-2`}>
                {themeConfig.name} {themeConfig.emoji}
              </p>
              <p className="text-sm text-[hsl(var(--text-secondary))]">
                Так будет выглядеть твоё приложение с этой темой
              </p>
              <button className={`mt-3 px-4 py-2 ${themeConfig.colors.primaryBg} text-white rounded-lg text-sm font-medium`}>
                Пример кнопки
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
