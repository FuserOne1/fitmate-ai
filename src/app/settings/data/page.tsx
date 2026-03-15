'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Database, MessageSquare, Utensils } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function DataPage() {
  const { themeConfig } = useTheme()
  const [clearing, setClearing] = useState(false)
  const [stats, setStats] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        chat: localStorage.getItem('fitmate-chat') ? 'Есть данные' : 'Пусто',
        diary: localStorage.getItem('fitmate-diary') ? 'Есть данные' : 'Пусто',
        theme: localStorage.getItem('fitmate-theme') || 'rose',
      }
    }
    return { chat: '...', diary: '...', theme: '...' }
  })

  function clearLocalStorage() {
    if (!confirm('Вы уверены? Это удалит ВСЕ данные:\n\n• История чата\n• Записи дневника\n• Настройки темы\n\nЭто действие необратимо!')) {
      return
    }

    setClearing(true)
    
    // Очищаем всё
    localStorage.removeItem('fitmate-chat')
    localStorage.removeItem('fitmate-diary')
    localStorage.removeItem('fitmate-theme')
    
    // Обновляем статистику
    setStats({
      chat: 'Пусто',
      diary: 'Пусто',
      theme: 'rose',
    })
    
    setClearing(false)
    alert('Все данные очищены! 🧹')
  }

  function clearChatOnly() {
    if (!confirm('Очистить только историю чата?')) return
    localStorage.removeItem('fitmate-chat')
    setStats(prev => ({ ...prev, chat: 'Пусто' }))
    alert('История чата очищена! 💬')
  }

  function clearDiaryOnly() {
    if (!confirm('Очистить только дневник питания?')) return
    localStorage.removeItem('fitmate-diary')
    setStats(prev => ({ ...prev, diary: 'Пусто' }))
    alert('Дневник питания очищен! 🍽️')
  }

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/settings" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Данные и память</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Статистика */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
            <Database className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
            Состояние хранилища
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[hsl(var(--muted))] rounded-xl">
              <div className="flex items-center gap-3">
                <MessageSquare className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
                <span className="text-[hsl(var(--text-primary))]">История чата</span>
              </div>
              <span className={`text-sm font-medium ${
                stats.chat === 'Пусто' ? 'text-green-500' : 'text-yellow-500'
              }`}>{stats.chat}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[hsl(var(--muted))] rounded-xl">
              <div className="flex items-center gap-3">
                <Utensils className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
                <span className="text-[hsl(var(--text-primary))]">Дневник питания</span>
              </div>
              <span className={`text-sm font-medium ${
                stats.diary === 'Пусто' ? 'text-green-500' : 'text-yellow-500'
              }`}>{stats.diary}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[hsl(var(--muted))] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎨</span>
                <span className="text-[hsl(var(--text-primary))]">Тема</span>
              </div>
              <span className="text-sm font-medium text-[hsl(var(--text-secondary))]">{stats.theme}</span>
            </div>
          </div>
        </div>

        {/* Очистка всего */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">
            🧹 Полная очистка
          </h2>
          <p className="text-[hsl(var(--text-secondary))] text-sm mb-4">
            Удалить ВСЕ данные приложения из localStorage браузера
          </p>
          <button
            onClick={clearLocalStorage}
            disabled={clearing}
            className={`w-full py-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium`}
          >
            <Trash2 className="w-5 h-5" />
            {clearing ? 'Очистка...' : 'Очистить все данные'}
          </button>
        </div>

        {/* Частичная очистка */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">
            🗑️ Выборочная очистка
          </h2>
          <div className="space-y-3">
            <button
              onClick={clearChatOnly}
              className="w-full py-3 bg-[hsl(var(--muted))] text-[hsl(var(--text-primary))] rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <MessageSquare className="w-5 h-5" />
              Очистить историю чата
            </button>
            <button
              onClick={clearDiaryOnly}
              className="w-full py-3 bg-[hsl(var(--muted))] text-[hsl(var(--text-primary))] rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Utensils className="w-5 h-5" />
              Очистить дневник питания
            </button>
          </div>
        </div>

        {/* Информация */}
        <div className="mt-6 p-4 bg-[hsl(var(--muted))] rounded-2xl border border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--text-secondary))]">
            💡 <strong>Где хранятся данные:</strong><br/>
            Все данные хранятся в localStorage вашего браузера. Это означает, что они привязаны к устройству и браузеру. 
            При очистке браузера или смене устройства данные будут утеряны.<br/><br/>
            🔒 <strong>Безопасность:</strong><br/>
            Данные не передаются на сервер (кроме AI запросов). Каждый пользователь видит только свои данные.
          </p>
        </div>
      </main>
    </div>
  )
}
