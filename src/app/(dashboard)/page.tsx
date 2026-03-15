'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Utensils, Droplets, Scale, MessageCircle, User, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        window.location.href = '/login'
        return
      }
      
      // Загрузка профиля
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('Profile:', profile)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rose-600 font-medium">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-rose-100 safe-top">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            FitMate AI 🌸
          </h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 text-rose-600" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Приветствие */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-rose-100 mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Привет, {user?.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Готова к новому дню здоровых привычек?
          </p>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/diary" className="bg-white rounded-2xl p-5 shadow-md shadow-rose-100 hover:shadow-lg transition-all active:scale-95">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-3">
              <Utensils className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Дневник</h3>
            <p className="text-sm text-gray-500">Записать еду</p>
          </Link>

          <Link href="/water" className="bg-white rounded-2xl p-5 shadow-md shadow-rose-100 hover:shadow-lg transition-all active:scale-95">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Droplets className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Вода</h3>
            <p className="text-sm text-gray-500">Трекер</p>
          </Link>

          <Link href="/weight" className="bg-white rounded-2xl p-5 shadow-md shadow-rose-100 hover:shadow-lg transition-all active:scale-95">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Scale className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Вес</h3>
            <p className="text-sm text-gray-500">Взвешивание</p>
          </Link>

          <Link href="/chat" className="bg-white rounded-2xl p-5 shadow-md shadow-rose-100 hover:shadow-lg transition-all active:scale-95">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-800">AI Чат</h3>
            <p className="text-sm text-gray-500">Помощник</p>
          </Link>
        </div>

        {/* Статистика за день */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-rose-100 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Сегодня</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-500">0</div>
              <div className="text-xs text-gray-500">ккал</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">0</div>
              <div className="text-xs text-gray-500">стаканов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">--</div>
              <div className="text-xs text-gray-500">вес</div>
            </div>
          </div>
        </div>

        {/* Настройки */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-rose-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚙️ Настройки</h3>
          <div className="space-y-3">
            <Link href="/settings/profile" className="flex items-center p-3 rounded-xl hover:bg-rose-50 transition-colors">
              <User className="w-5 h-5 text-rose-500 mr-3" />
              <span className="font-medium text-gray-700">Профиль</span>
            </Link>
            <Link href="/settings/reminders" className="flex items-center p-3 rounded-xl hover:bg-rose-50 transition-colors">
              <span className="text-xl mr-3">🔔</span>
              <span className="font-medium text-gray-700">Напоминания</span>
            </Link>
            <Link href="/settings/theme" className="flex items-center p-3 rounded-xl hover:bg-rose-50 transition-colors">
              <span className="text-xl mr-3">🎨</span>
              <span className="font-medium text-gray-700">Тема</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 safe-bottom">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-around">
          <Link href="/" className="flex flex-col items-center p-2 text-rose-500">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">Главная</span>
          </Link>
          <Link href="/diary" className="flex flex-col items-center p-2 text-gray-400 hover:text-rose-500">
            <span className="text-xl">🍽️</span>
            <span className="text-xs font-medium">Дневник</span>
          </Link>
          <Link href="/chat" className="flex flex-col items-center p-2 text-gray-400 hover:text-rose-500">
            <span className="text-xl">💬</span>
            <span className="text-xs font-medium">Чат</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center p-2 text-gray-400 hover:text-rose-500">
            <span className="text-xl">⚙️</span>
            <span className="text-xs font-medium">Настройки</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-20"></div>
    </div>
  )
}
