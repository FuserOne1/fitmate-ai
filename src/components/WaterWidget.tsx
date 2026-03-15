'use client'

import { useState, useEffect } from 'react'
import { Droplets, Plus, Minus, X } from 'lucide-react'

type WaterWidgetProps = {}

export default function WaterWidget({}: WaterWidgetProps) {
  const [intake, setIntake] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fitmate-water')
    if (saved) {
      try {
        const logs = JSON.parse(saved)
        const today = new Date().toISOString().split('T')[0]
        const todayLog = logs.find((log: any) => log.date === today)
        if (todayLog) {
          setIntake(todayLog.intake || 0)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('fitmate-water')
      if (saved) {
        try {
          const logs = JSON.parse(saved)
          const today = new Date().toISOString().split('T')[0]
          const todayLog = logs.find((log: any) => log.date === today)
          if (todayLog) {
            setIntake(todayLog.intake || 0)
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleQuickAdd = (volume: number) => {
    const newIntake = intake + volume
    setIntake(newIntake)

    // Сохраняем в localStorage напрямую
    const saved = localStorage.getItem('fitmate-water')
    let logs = saved ? JSON.parse(saved) : []
    const today = new Date().toISOString().split('T')[0]
    const todayIndex = logs.findIndex((log: any) => log.date === today)

    if (todayIndex >= 0) {
      logs[todayIndex].intake = newIntake
    } else {
      logs.unshift({ date: today, intake: newIntake })
    }

    localStorage.setItem('fitmate-water', JSON.stringify(logs))
    window.dispatchEvent(new Event('storage'))
    
    // Закрываем меню
    setIsOpen(false)
  }

  const progressPercent = Math.min(100, (intake / 2000) * 100)
  const circumference = 2 * Math.PI * 20

  return (
    <div className="relative">
      {/* Кнопка-виджет */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform border-2 border-blue-400/30"
      >
        <svg className="absolute w-full h-full transform -rotate-90 p-1.5">
          <circle
            cx="26"
            cy="26"
            r="18"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="26"
            cy="26"
            r="18"
            stroke="white"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progressPercent / 100)}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <Droplets className="w-6 h-6 text-white relative z-10" />
        {intake > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-blue-600 text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
            {intake >= 1000 ? `${(intake / 1000).toFixed(1)}` : intake}
          </span>
        )}
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed right-4 top-16 z-50 w-72 bg-[hsl(var(--card))] rounded-3xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden animate-fade-in max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-6 h-6 text-white" />
                  <h3 className="font-bold text-white">Вода</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 text-center">
                <p className="text-3xl font-bold text-white">{intake} <span className="text-sm font-medium">/ 2000 мл</span></p>
                <p className="text-xs text-white/80 mt-1">{Math.round(progressPercent)}% нормы</p>
              </div>
            </div>

            {/* Quick add buttons */}
            <div className="p-4">
              <p className="text-xs font-medium text-[hsl(var(--text-secondary))] mb-3">Быстро добавить:</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickAdd(50)}
                  className="flex flex-col items-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors border border-blue-500/20"
                >
                  <span className="text-xl">💧</span>
                  <span className="text-xs font-medium text-[hsl(var(--text-primary))] mt-1">50</span>
                </button>
                <button
                  onClick={() => handleQuickAdd(250)}
                  className="flex flex-col items-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors border border-blue-500/20"
                >
                  <span className="text-xl">🥛</span>
                  <span className="text-xs font-medium text-[hsl(var(--text-primary))] mt-1">250</span>
                </button>
                <button
                  onClick={() => handleQuickAdd(350)}
                  className="flex flex-col items-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors border border-blue-500/20"
                >
                  <span className="text-xl">☕</span>
                  <span className="text-xs font-medium text-[hsl(var(--text-primary))] mt-1">350</span>
                </button>
                <button
                  onClick={() => handleQuickAdd(500)}
                  className="flex flex-col items-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors border border-blue-500/20"
                >
                  <span className="text-xl">🧪</span>
                  <span className="text-xs font-medium text-[hsl(var(--text-primary))] mt-1">500</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {intake >= 2000 && (
                <div className="mt-3 bg-green-500/10 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-green-500">🎉 Норма выполнена!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
