'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Minus, Save, Droplets, GlassWater, Bottle, MugShot, History, Trash2 } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type WaterLog = {
  date: string
  intake: number
}

type VolumeOption = {
  id: string
  label: string
  volume: number
  icon: React.ReactNode
  emoji: string
}

const VOLUME_OPTIONS: VolumeOption[] = [
  { id: 'sip', label: 'Глоток', volume: 50, icon: <Droplets className="w-6 h-6" />, emoji: '💧' },
  { id: 'glass', label: 'Стакан', volume: 250, icon: <GlassWater className="w-6 h-6" />, emoji: '🥛' },
  { id: 'cup', label: 'Кружка', volume: 350, icon: <MugShot className="w-6 h-6" />, emoji: '☕' },
  { id: 'bottle', label: 'Бутылка', volume: 500, icon: <Bottle className="w-6 h-6" />, emoji: '🍼' },
]

const DAILY_GOAL = 2000 // 2 литра

function getMoscowDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function WaterPage() {
  const { themeConfig } = useTheme()
  const [currentIntake, setCurrentIntake] = useState(0)
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [selectedDate, setSelectedDate] = useState(getMoscowDate())
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fitmate-water')
    if (saved) {
      try {
        const parsedLogs: WaterLog[] = JSON.parse(saved)
        setLogs(parsedLogs)
        const today = getMoscowDate()
        const todayLog = parsedLogs.find(log => log.date === today)
        if (todayLog) {
          setCurrentIntake(todayLog.intake)
        }
      } catch {}
    }
  }, [])

  const saveToIntake = (volume: number) => {
    const newIntake = Math.max(0, currentIntake + volume)
    setCurrentIntake(newIntake)
    
    const today = getMoscowDate()
    const newLog: WaterLog = { date: today, intake: newIntake }
    
    const updatedLogs = logs.filter(log => log.date !== today)
    updatedLogs.unshift(newLog)
    updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    setLogs(updatedLogs)
    localStorage.setItem('fitmate-water', JSON.stringify(updatedLogs))
    
    // Триггерим событие для других страниц
    window.dispatchEvent(new Event('storage'))
  }

  const handleAddWater = (volume: number) => {
    saveToIntake(volume)
  }

  const handleRemoveWater = () => {
    if (currentIntake >= 250) {
      saveToIntake(currentIntake - 250)
    } else if (currentIntake > 0) {
      saveToIntake(0)
    }
  }

  const handleSave = () => {
    // Данные уже сохранены в localStorage при каждом добавлении
    // Здесь можно добавить дополнительную логику если нужно
    alert('✅ Данные сохранены!')
  }

  const handleClearToday = () => {
    if (confirm('Очистить данные за сегодня?')) {
      const today = getMoscowDate()
      const updatedLogs = logs.filter(log => log.date !== today)
      setLogs(updatedLogs)
      setCurrentIntake(0)
      localStorage.setItem('fitmate-water', JSON.stringify(updatedLogs))
      window.dispatchEvent(new Event('storage'))
    }
  }

  const progressPercent = Math.min(100, (currentIntake / DAILY_GOAL) * 100)
  
  // Анимация волн
  const getWaveAnimation = () => {
    const waves = []
    for (let i = 0; i < 3; i++) {
      waves.push(
        <div
          key={i}
          className="absolute bottom-0 left-0 right-0 bg-blue-400/20 rounded-t-full"
          style={{
            height: `${progressPercent}%`,
            animation: `wave ${2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      )
    }
    return waves
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-primary))] flex flex-col">
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl">
              <ArrowLeft className="w-6 h-6 text-[hsl(var(--primary))]" />
            </Link>
            <div className="flex items-center gap-2">
              <Droplets className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Трекер воды</h1>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl"
          >
            <History className="w-5 h-5 text-[hsl(var(--text-secondary))]" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 overflow-y-auto">
        {/* Прогресс бар с анимацией */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-[hsl(var(--text-primary))]">
                💧 Прогресс за сегодня
              </h2>
              <span className="text-sm font-medium text-blue-500">
                {currentIntake} / {DAILY_GOAL} мл
              </span>
            </div>
            
            {/* Круговой прогресс */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--muted))"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-blue-500">{Math.round(progressPercent)}%</span>
                  <span className="text-sm text-[hsl(var(--text-secondary))]">выполнено</span>
                </div>
              </div>
            </div>

            {/* Статус */}
            <div className="text-center">
              {currentIntake >= DAILY_GOAL ? (
                <div className="bg-green-500/10 rounded-xl p-3">
                  <p className="text-green-500 font-bold text-lg">🎉 Норма выполнена!</p>
                  <p className="text-sm text-[hsl(var(--text-secondary))]">Молодец! Так держать! 💪</p>
                </div>
              ) : (
                <div className="bg-[hsl(var(--muted))] rounded-xl p-3">
                  <p className="text-[hsl(var(--text-primary))] font-medium">
                    Осталось: <span className="text-blue-500 font-bold">{DAILY_GOAL - currentIntake} мл</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки добавления */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">
            💦 Добавить воду
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {VOLUME_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAddWater(option.volume)}
                className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 rounded-2xl p-4 transition-all active:scale-95 border border-blue-500/20 hover:border-blue-500/40"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="font-semibold text-[hsl(var(--text-primary))]">{option.label}</span>
                  <span className="text-sm text-[hsl(var(--text-secondary))]">{option.volume} мл</span>
                </div>
              </button>
            ))}
          </div>

          {/* Кнопка убрать */}
          <button
            onClick={handleRemoveWater}
            disabled={currentIntake === 0}
            className="w-full bg-[hsl(var(--muted))] hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-3 transition-colors flex items-center justify-center gap-2 border border-[hsl(var(--border))] hover:border-red-500/30"
          >
            <Minus className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-500">Убрать 250 мл</span>
          </button>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl p-4 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span className="font-bold">Сохранить</span>
          </button>
          <button
            onClick={handleClearToday}
            className="bg-[hsl(var(--muted))] hover:bg-red-500/10 rounded-2xl p-4 transition-colors border border-[hsl(var(--border))] hover:border-red-500/30"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>

        {/* История */}
        {showHistory && (
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6 animate-fade-in">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              История
            </h3>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-center text-[hsl(var(--text-secondary))] py-4">
                  История пуста
                </p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-xl ${
                      log.date === selectedDate
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-[hsl(var(--muted))]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-[hsl(var(--text-primary))]">
                        {log.date === selectedDate ? 'Сегодня' : new Date(log.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    <span className="font-bold text-blue-500">{log.intake} мл</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Советы */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl p-6 border border-blue-500/20">
          <h4 className="font-bold text-[hsl(var(--text-primary))] mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Полезные советы
          </h4>
          <ul className="space-y-2 text-sm text-[hsl(var(--text-secondary))]">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Пей стакан воды утром натощак для запуска метаболизма</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Выпивай стакан за 30 минут до еды для лучшего пищеварения</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Не забывай пить во время тренировки</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Spacer for bottom nav */}
      <div className="h-24"></div>
    </div>
  )
}
