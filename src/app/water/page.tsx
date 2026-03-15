'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function WaterPage() {
  const { themeConfig } = useTheme()
  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Трекер воды</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-[hsl(var(--card))] rounded-3xl p-8 shadow-lg border border-[hsl(var(--border))] text-center">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💧</span>
          </div>
          <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">Трекер воды</h2>
          <p className="text-[hsl(var(--text-secondary))] mb-6">Отслеживай потребление воды и получай напоминания</p>
          <div className="bg-[hsl(var(--muted))] rounded-2xl p-4 text-sm text-[hsl(var(--text-secondary))]">🚧 В разработке</div>
        </div>
      </main>
    </div>
  )
}
