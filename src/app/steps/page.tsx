'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Plus, Footprints, TrendingUp, Flame, MapPin, Image as ImageIcon, X, Upload } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type StepsLog = {
  id: string
  date: string
  steps: number
  distance_km?: number | null
  calories_burned?: number | null
  source: string
  screenshot_url?: string | null
}

export default function StepsPage() {
  const { themeConfig } = useTheme()
  const [stepsLogs, setStepsLogs] = useState<StepsLog[]>([])
  const [todaySteps, setTodaySteps] = useState<StepsLog | null>(null)
  const [manualSteps, setManualSteps] = useState('')
  const [manualDistance, setManualDistance] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSteps()
  }, [])

  async function loadSteps() {
    try {
      // Читаем напрямую из localStorage
      const stepsSaved = localStorage.getItem('fitmate-steps')
      const stepsLogs = stepsSaved ? JSON.parse(stepsSaved) : []
      
      setStepsLogs(stepsLogs)

      const today = new Date().toISOString().split('T')[0]
      const todayLog = stepsLogs.find((log: any) => log.date === today)
      setTodaySteps(todayLog || null)
    } catch (error) {
      console.error('Failed to load steps:', error)
    }
  }

  async function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = document.createElement('img')
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width, height = img.height
          if (width > 1024) { height = (height * 1024) / width; width = 1024 }
          canvas.width = width; canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        reader.onerror = reject
      }
    })
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выбери изображение')
      return
    }
    try {
      setUploading(true)
      const compressed = await compressImage(file)
      setSelectedPhoto(compressed)
    } catch (error) {
      console.error('Photo error:', error)
      alert('Ошибка загрузки фото')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function analyzeScreenshot() {
    if (!selectedPhoto) return
    setLoading(true)
    try {
      const response = await fetch('/api/ai/analyze-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: selectedPhoto }),
      })
      const data = await response.json()
      if (data.success) {
        setManualSteps(data.data.steps?.toString() || '')
        setManualDistance(data.data.distance_km?.toString() || '')
        if (data.data.calories_burned) {
          // Можно сохранить в состояние
        }
      } else {
        alert('Не удалось распознать скриншот 😅 Попробуй вручную')
      }
    } catch (error) {
      console.error('Analyze error:', error)
      alert('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  async function saveSteps() {
    const steps = parseInt(manualSteps)
    if (!steps || steps <= 0) {
      alert('Введи количество шагов')
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const distance = manualDistance ? parseFloat(manualDistance) : null

      const stepsData = {
        date: today,
        steps,
        distance_km: distance,
        calories_burned: Math.round(steps * 0.04),
        source: selectedPhoto ? 'screenshot' : 'manual',
        screenshot_url: selectedPhoto,
      }

      // Сохраняем в localStorage
      const stepsSaved = localStorage.getItem('fitmate-steps')
      let stepsLogs = stepsSaved ? JSON.parse(stepsSaved) : []
      const todayIndex = stepsLogs.findIndex((log: any) => log.date === today)
      
      if (todayIndex >= 0) {
        stepsLogs[todayIndex] = stepsData
      } else {
        stepsLogs.unshift(stepsData)
      }
      localStorage.setItem('fitmate-steps', JSON.stringify(stepsLogs))

      loadSteps()
      setManualSteps('')
      setManualDistance('')
      setSelectedPhoto(null)
    } catch (error) {
      console.error('Save error:', error)
      alert('Не удалось сохранить шаги')
    }
  }

  function getDisplayDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Сегодня'
    if (days === 1) return 'Вчера'
    if (days < 7) return date.toLocaleDateString('ru-RU', { weekday: 'long' })
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  // Статистика за неделю
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekLogs = stepsLogs.filter(log => new Date(log.date) >= weekAgo)
  const avgSteps = weekLogs.length > 0 
    ? Math.round(weekLogs.reduce((sum, log) => sum + log.steps, 0) / weekLogs.length)
    : 0
  const totalSteps = weekLogs.reduce((sum, log) => sum + log.steps, 0)
  const totalDistance = weekLogs.reduce((sum, log) => sum + (log.distance_km || 0), 0)

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">👣 Шаги</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Сегодня */}
        {todaySteps && (
          <div className={`bg-gradient-to-r ${themeConfig.colors.gradient} rounded-3xl p-6 shadow-lg mb-6`}>
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">Сегодня</h2>
            <div className="text-center">
              <div className="text-6xl font-bold text-[hsl(var(--text-primary))] mb-2">
                {todaySteps.steps.toLocaleString()}
              </div>
              <p className="text-sm text-[hsl(var(--text-secondary))] mb-4">шагов</p>
              
              <div className="grid grid-cols-2 gap-3">
                {todaySteps.distance_km && (
                  <div className="bg-white/50 rounded-xl p-3">
                    <MapPin className={`w-5 h-5 ${themeConfig.colors.primaryText} mx-auto mb-1`} />
                    <div className={`text-lg font-bold ${themeConfig.colors.primaryText}`}>
                      {todaySteps.distance_km.toFixed(1)} км
                    </div>
                    <div className="text-xs text-[hsl(var(--text-secondary))]">дистанция</div>
                  </div>
                )}
                {todaySteps.calories_burned && (
                  <div className="bg-white/50 rounded-xl p-3">
                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-orange-500">
                      {todaySteps.calories_burned}
                    </div>
                    <div className="text-xs text-[hsl(var(--text-secondary))]">ккал</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Статистика за неделю */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] text-center`}>
            <Footprints className={`w-6 h-6 ${themeConfig.colors.primaryText} mx-auto mb-2`} />
            <div className={`text-xl font-bold ${themeConfig.colors.primaryText}`}>
              {avgSteps.toLocaleString()}
            </div>
            <div className="text-xs text-[hsl(var(--text-secondary))]">среднее за неделю</div>
          </div>
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] text-center">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-500">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-xs text-[hsl(var(--text-secondary))]">всего за неделю</div>
          </div>
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] text-center">
            <MapPin className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-500">
              {totalDistance.toFixed(1)}
            </div>
            <div className="text-xs text-[hsl(var(--text-secondary))]">км за неделю</div>
          </div>
        </div>

        {/* Добавить шаги */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">➕ Добавить шаги</h2>
          <div className="space-y-4">
            {/* Загрузка скриншота */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(var(--text-primary))]">
                Или загрузи скриншот из приложения
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="steps-screenshot"
                />
                <label
                  htmlFor="steps-screenshot"
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] rounded-xl cursor-pointer hover:bg-[hsl(var(--muted))]/80 transition-colors"
                >
                  <Upload className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
                  <span className="text-sm text-[hsl(var(--text-primary))]">
                    {selectedPhoto ? 'Скриншот выбран' : 'Загрузить скриншот'}
                  </span>
                </label>
                {selectedPhoto && (
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                )}
              </div>
              
              {selectedPhoto && (
                <div className="relative">
                  <img src={selectedPhoto} alt="Screenshot" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    onClick={analyzeScreenshot}
                    disabled={loading}
                    className={`absolute bottom-3 right-3 px-4 py-2 ${themeConfig.colors.primaryBg} text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50`}
                  >
                    {loading ? 'Анализирую...' : '🤖 Распознать'}
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[hsl(var(--border))]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={`bg-[hsl(var(--card))] px-2 text-[hsl(var(--text-secondary))]`}>или вручную</span>
              </div>
            </div>

            {/* Ручной ввод */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[hsl(var(--text-primary))] mb-2 block">
                  Шаги *
                </label>
                <input
                  type="number"
                  value={manualSteps}
                  onChange={(e) => setManualSteps(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[hsl(var(--text-primary))] mb-2 block">
                  Км (необязательно)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualDistance}
                  onChange={(e) => setManualDistance(e.target.value)}
                  placeholder="7.5"
                  className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
                />
              </div>
            </div>

            <button
              onClick={saveSteps}
              disabled={!manualSteps.trim()}
              className={`w-full py-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium`}
            >
              <Plus className="w-5 h-5" />Сохранить
            </button>
          </div>
        </div>

        {/* История */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">📅 История</h2>
          
          {stepsLogs.length > 0 ? (
            <div className="space-y-2">
              {stepsLogs.slice(0, 14).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Footprints className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
                    <div>
                      <p className="font-medium text-[hsl(var(--text-primary))]">
                        {log.steps.toLocaleString()} шагов
                      </p>
                      <p className="text-xs text-[hsl(var(--text-secondary))]">
                        {getDisplayDate(log.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {log.distance_km && (
                      <p className="text-xs text-[hsl(var(--text-secondary))]">
                        {log.distance_km.toFixed(1)} км
                      </p>
                    )}
                    {log.calories_burned && (
                      <p className="text-xs text-orange-500">
                        {log.calories_burned} ккал
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[hsl(var(--text-secondary))] text-sm py-8">
              Пока нет записей 🍃 Начни с добавления первых шагов!
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
