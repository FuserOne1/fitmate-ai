'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Plus, Trash2, Calendar, Flame, TrendingUp, Activity, Image as ImageIcon, X } from 'lucide-react'
import { useTheme } from '@/lib/theme'

type Workout = {
  id: string
  workout_type: string
  workout_date: string
  duration_minutes: number | null
  calories_burned: number | null
  distance_km: number | null
  ai_analysis: string | null
  ai_tips: string[] | null
  mood_before: number | null
  mood_after: number | null
  notes: string | null
  photo_url?: string | null
}

const WORKOUT_TYPES: Record<string, { label: string; emoji: string; color: string }> = {
  yoga: { label: 'Йога', emoji: '🧘‍♀️', color: 'text-purple-500' },
  pilates: { label: 'Пилатес', emoji: '💪', color: 'text-pink-500' },
  cardio: { label: 'Кардио', emoji: '🏃‍♀️', color: 'text-red-500' },
  strength: { label: 'Силовая', emoji: '🏋️‍♀️', color: 'text-orange-500' },
  hiit: { label: 'HIIT', emoji: '🔥', color: 'text-yellow-500' },
  stretching: { label: 'Растяжка', emoji: '🤸‍♀️', color: 'text-blue-500' },
  walking: { label: 'Ходьба', emoji: '🚶‍♀️', color: 'text-green-500' },
  other: { label: 'Другое', emoji: '⭐', color: 'text-gray-500' },
}

export default function WorkoutsPage() {
  const { themeConfig } = useTheme()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [parsedWorkout, setParsedWorkout] = useState<any | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadWorkouts()
  }, [])

  async function loadWorkouts() {
    try {
      const response = await fetch('/api/workouts')
      const data = await response.json()
      if (data.success) {
        setWorkouts(data.data)
        localStorage.setItem('fitmate-workouts', JSON.stringify(data.data))
      }
    } catch (error) {
      console.error('Failed to load workouts:', error)
    }
  }

  async function analyzeWorkout() {
    if (!input.trim() || loading) return
    setLoading(true)
    try {
      const response = await fetch('/api/ai/analyze-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input }),
      })
      const data = await response.json()
      if (data.success) {
        setParsedWorkout(data.data)
        setShowConfirm(true)
      } else {
        alert('Не удалось распознать тренировку 😅')
      }
    } catch (error) {
      console.error('Analyze error:', error)
      alert('Ошибка соединения')
    } finally {
      setLoading(false)
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

  async function saveWorkout() {
    if (!parsedWorkout) return

    try {
      const workoutData = {
        workout_type: parsedWorkout.workout_type,
        workout_date: new Date().toISOString(),
        duration_minutes: parsedWorkout.duration_minutes,
        calories_burned: parsedWorkout.calories_burned,
        distance_km: parsedWorkout.distance_km,
        exercises: parsedWorkout.exercises,
        ai_analysis: parsedWorkout.ai_analysis,
        ai_tips: parsedWorkout.ai_tips,
        notes: input,
        photo_url: selectedPhoto,
      }

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      })
      const data = await response.json()
      if (data.success) {
        loadWorkouts()
        setInput('')
        setParsedWorkout(null)
        setShowConfirm(false)
        setSelectedPhoto(null)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Не удалось сохранить тренировку')
    }
  }

  async function deleteWorkout(id: string) {
    if (!confirm('Удалить эту тренировку?')) return
    try {
      await fetch(`/api/workouts?id=${id}`, { method: 'DELETE' })
      loadWorkouts()
    } catch (error) {
      console.error('Delete error:', error)
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

  const totalWorkouts = workouts.length
  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">💪 Тренировки</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] text-center`}>
            <Activity className={`w-6 h-6 ${themeConfig.colors.primaryText} mx-auto mb-2`} />
            <div className={`text-2xl font-bold ${themeConfig.colors.primaryText}`}>{totalWorkouts}</div>
            <div className="text-xs text-[hsl(var(--text-secondary))]">тренировок</div>
          </div>
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-500">{Math.round(totalCalories)}</div>
            <div className="text-xs text-[hsl(var(--text-secondary))]">ккал</div>
          </div>
          <div className="bg-[hsl(var(--card))] rounded-2xl p-4 shadow-md border border-[hsl(var(--border))] text-center">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-500">{Math.round(totalMinutes / 60)}</div>
            <div className="text-xs text-[hsl(var(--text-secondary))]">часов</div>
          </div>
        </div>

        {/* Добавление тренировки */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">✨ Добавить тренировку</h2>
          <div className="space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Например: Занимались йогой 45 минут, делали приветствие солнцу 3 круга, потом растяжка..."
              className="w-full resize-none bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
              rows={3}
            />
            
            {/* Загрузка фото */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="workout-photo"
              />
              <label
                htmlFor="workout-photo"
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] rounded-xl cursor-pointer hover:bg-[hsl(var(--muted))]/80 transition-colors"
              >
                <ImageIcon className={`w-5 h-5 ${themeConfig.colors.primaryText}`} />
                <span className="text-sm text-[hsl(var(--text-primary))]">
                  {selectedPhoto ? 'Фото выбрано' : 'Добавить фото'}
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
            
            {/* Превью фото */}
            {selectedPhoto && (
              <div className="relative">
                <img src={selectedPhoto} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
              </div>
            )}
            
            <button
              onClick={analyzeWorkout}
              disabled={loading || !input.trim()}
              className={`w-full py-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium`}
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Анализирую...</>
              ) : (
                <><Send className="w-5 h-5" />Распознать</>
              )}
            </button>
          </div>
        </div>

        {/* Подтверждение */}
        {showConfirm && parsedWorkout && (
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))] mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">✅ Подтверди тренировку</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-[hsl(var(--muted))] rounded-xl">
                <span className="text-2xl">
                  {parsedWorkout.workout_type && WORKOUT_TYPES[parsedWorkout.workout_type]?.emoji}
                </span>
                <div>
                  <p className="font-medium text-[hsl(var(--text-primary))]">
                    {parsedWorkout.workout_type && WORKOUT_TYPES[parsedWorkout.workout_type]?.label}
                  </p>
                  <p className="text-xs text-[hsl(var(--text-secondary))]">
                    {Math.round(parsedWorkout.duration_minutes || 0)} мин • {Math.round(parsedWorkout.calories_burned || 0)} ккал
                  </p>
                </div>
              </div>
              
              {parsedWorkout.ai_analysis && (
                <div className="p-3 bg-gradient-to-r from-[hsl(var(--primary))]/10 to-pink-500/10 rounded-xl">
                  <p className="text-sm text-[hsl(var(--text-primary))]">{parsedWorkout.ai_analysis}</p>
                </div>
              )}
              
              {parsedWorkout.ai_tips && parsedWorkout.ai_tips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[hsl(var(--text-secondary))]">💡 Советы:</p>
                  {parsedWorkout.ai_tips.map((tip: string, i: number) => (
                    <p key={i} className="text-xs text-[hsl(var(--text-secondary))] bg-[hsl(var(--muted))] p-2 rounded-lg">
                      {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setParsedWorkout(null); setInput(''); setSelectedPhoto(null); }}
                className="flex-1 py-3 bg-[hsl(var(--muted))] text-[hsl(var(--text-primary))] rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                onClick={saveWorkout}
                className={`flex-1 py-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 transition-colors font-medium flex items-center justify-center gap-2`}
              >
                <Plus className="w-5 h-5" />Добавить
              </button>
            </div>
          </div>
        )}

        {/* Список тренировок */}
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))]">📅 История</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  view === 'list'
                    ? `${themeConfig.colors.primaryBg} text-white`
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                Список
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  view === 'calendar'
                    ? `${themeConfig.colors.primaryBg} text-white`
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                Календарь
              </button>
            </div>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-[hsl(var(--muted))] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {WORKOUT_TYPES[workout.workout_type]?.emoji || '⭐'}
                      </span>
                      <div>
                        <p className="font-medium text-[hsl(var(--text-primary))]">
                          {WORKOUT_TYPES[workout.workout_type]?.label || workout.workout_type}
                        </p>
                        <p className="text-xs text-[hsl(var(--text-secondary))]">
                          {getDisplayDate(workout.workout_date)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteWorkout(workout.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  
                  <div className="flex gap-4 text-xs text-[hsl(var(--text-secondary))]">
                    {workout.duration_minutes && (
                      <span>⏱️ {Math.round(workout.duration_minutes)} мин</span>
                    )}
                    {workout.calories_burned && (
                      <span>🔥 {Math.round(workout.calories_burned)} ккал</span>
                    )}
                    {workout.distance_km && (
                      <span>📍 {workout.distance_km.toFixed(1)} км</span>
                    )}
                  </div>
                  
                  {workout.ai_analysis && (
                    <p className="text-xs text-[hsl(var(--text-secondary))] mt-2 italic">
                      {workout.ai_analysis}
                    </p>
                  )}
                  
                  {workout.photo_url && (
                    <img 
                      src={workout.photo_url} 
                      alt="Workout" 
                      className="mt-3 w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[hsl(var(--text-secondary))] text-sm py-8">
              Пока нет тренировок 🍃 Начни с добавления первой!
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
