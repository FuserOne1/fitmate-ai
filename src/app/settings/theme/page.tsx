'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ThemePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-rose-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-rose-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Тема</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-8 shadow-lg shadow-rose-100 text-center">
          <div className="text-4xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Тема оформления</h2>
          <p className="text-gray-600 mb-6">Выбор цветовой темы (Rose, Lavender, Peach, Sage, Dark)</p>
          <div className="bg-rose-50 rounded-2xl p-4 text-sm text-gray-600">🚧 В разработке</div>
        </div>
      </main>
    </div>
  )
}
