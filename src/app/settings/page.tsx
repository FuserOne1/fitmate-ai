'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-rose-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-rose-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Настройки</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-8 shadow-lg shadow-rose-100 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚙️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Настройки
          </h2>
          <p className="text-gray-600 mb-6">
            Управление профилем, напоминаниями и темой оформления
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600">
            🚧 В разработке
          </div>
        </div>
      </main>
    </div>
  )
}
