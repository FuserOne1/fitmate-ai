'use client'

import Link from 'next/link'
import { ArrowLeft, User, Bell, Palette, Database } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function SettingsPage() {
  const { themeConfig } = useTheme()

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Настройки</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">⚙️ Настройки</h2>
          <div className="space-y-3">
            <Link href="/settings/profile" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <User className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Профиль</span>
            </Link>
            <Link href="/settings/reminders" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <Bell className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Напоминания</span>
            </Link>
            <Link href="/settings/theme" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <Palette className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Тема</span>
            </Link>
            <Link href="/settings/data" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <Database className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Данные и память</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
