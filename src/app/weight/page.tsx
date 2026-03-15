'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Scale, TrendingDown, TrendingUp, Minus, History, Trash2 } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type WeightLog = {
  date: string
  weight: number
  fatPercent?: number
  muscleMass?: number
}

function getMoscowDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function WeightPage() {
  const { themeConfig } = useTheme()
  const [weight, setWeight] = useState('')
  const [fatPercent, setFatPercent] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fitmate-weight')
    if (saved) {
      try {
        const parsedLogs: WeightLog[] = JSON.parse(saved)
        setLogs(parsedLogs)
      } catch {}
    }
  }, [])

  const handleSave = () => {
    if (!weight) return
    
    const today = getMoscowDate()
    const newLog: WeightLog = {
      date: today,
      weight: parseFloat(weight),
      fatPercent: fatPercent ? parseFloat(fatPercent) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined
    }
    
    const updatedLogs = logs.filter(log => log.date !== today)
    updatedLogs.unshift(newLog)
    updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    setLogs(updatedLogs)
    localStorage.setItem('fitmate-weight', JSON.stringify(updatedLogs))
    window.dispatchEvent(new Event('storage'))
    
    // Очистка
    setWeight('')
    setFatPercent('')
    setMuscleMass('')
    
    alert('✅ Вес записан!')
  }

  const handleDelete = (date: string) => {
    if (confirm('Удалить эту запись?')) {
      const updatedLogs = logs.filter(log => log.date !== date)
      setLogs(updatedLogs)
      localStorage.setItem('fitmate-weight', JSON.stringify(updatedLogs))
      window.dispatchEvent(new Event('storage'))
    }
  }

  const latestLog = logs[0]
  const previousLog = logs[1]
  
  // Расчет изменений
  const weightChange = previousLog ? latestLog.weight - previousLog.weight : 0
  const fatChange = previousLog && previousLog.fatPercent && latestLog.fatPercent 
    ? latestLog.fatPercent - previousLog.fatPercent 
    : 0
  const muscleChange = previousLog && previousLog.muscleMass && latestLog.muscleMass 
    ? latestLog.muscleMass - previousLog.muscleMass 
    : 0

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-green-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getTrendText = (change: number, suffix: string) => {
    if (change > 0) return `+${change.toFixed(1)} ${suffix}`
    if (change < 0) return `${change.toFixed(1)} ${suffix}`
    return '0'
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
              <Scale className="w-6 h-6 text-purple-500" />
              <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Взвешивания</h1>
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
        {/* Текущие показатели */}
        {latestLog && (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-6 shadow-lg border border-purple-500/20 mb-6">
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-500" />
              Последние замеры
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Вес */}
              <div className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[hsl(var(--text-secondary))]">Вес</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(weightChange)}
                    <span className={`text-xs font-medium ${weightChange > 0 ? 'text-red-500' : weightChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                      {getTrendText(weightChange, 'кг')}
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-500">{latestLog.weight}</span>
                  <span className="text-sm text-[hsl(var(--text-secondary))]">кг</span>
                </div>
              </div>

              {/* Процент жира */}
              {latestLog.fatPercent !== undefined && (
                <div className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[hsl(var(--text-secondary))]">Процент жира</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(fatChange)}
                      <span className={`text-xs font-medium ${fatChange > 0 ? 'text-red-500' : fatChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                        {getTrendText(fatChange, '%')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-orange-500">{latestLog.fatPercent}</span>
                    <span className="text-sm text-[hsl(var(--text-secondary))]">%</span>
                  </div>
                </div>
              )}

              {/* Мышечная масса */}
              {latestLog.muscleMass !== undefined && (
                <div className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[hsl(var(--text-secondary))]">Мышечная масса</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(muscleChange)}
                      <span className={`text-xs font-medium ${muscleChange > 0 ? 'text-green-500' : muscleChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {getTrendText(muscleChange, 'кг')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-500">{latestLog.muscleMass}</span>
                    <span className="text-sm text-[hsl(var(--text-secondary))]">кг</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Форма ввода */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">
            📝 Новое взвешивание
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                ⚖️ Вес (кг)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Например: 55.5"
                className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                💪 Процент жира (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={fatPercent}
                onChange={(e) => setFatPercent(e.target.value)}
                placeholder="Например: 22.5"
                className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-[hsl(var(--text-secondary))] mt-1">
                Измеряется умными весами или калипером
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                🏋️‍♀️ Мышечная масса (кг)
              </label>
              <input
                type="number"
                step="0.1"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                placeholder="Например: 35.2"
                className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-[hsl(var(--text-secondary))] mt-1">
                Объем мышечной массы в килограммах
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={!weight}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-4 font-bold transition-all active:scale-98 shadow-lg"
            >
              💾 Сохранить запись
            </button>
          </div>
        </div>

        {/* История */}
        {showHistory && (
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6 animate-fade-in">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              История взвешиваний
            </h3>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-center text-[hsl(var(--text-secondary))] py-4">
                  История пуста
                </p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Scale className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-[hsl(var(--text-primary))]">
                          {log.date === getMoscowDate() ? 'Сегодня' : new Date(log.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-purple-500 font-bold">{log.weight} кг</span>
                        {log.fatPercent !== undefined && (
                          <span className="text-orange-500">🔹 {log.fatPercent}% жира</span>
                        )}
                        {log.muscleMass !== undefined && (
                          <span className="text-blue-500">💪 {log.muscleMass} кг мышц</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(log.date)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Советы */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-6 border border-purple-500/20">
          <h4 className="font-bold text-[hsl(var(--text-primary))] mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Советы по взвешиванию
          </h4>
          <ul className="space-y-2 text-sm text-[hsl(var(--text-secondary))]">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Взвешивайся утром натощак после туалета для точных результатов</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Процент жира лучше измерять умными весами или калипером</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Отслеживай тренд, а не отдельные значения — вес колеблется!</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Spacer for bottom nav */}
      <div className="h-24"></div>
    </div>
  )
}
