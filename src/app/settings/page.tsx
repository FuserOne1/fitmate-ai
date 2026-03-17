'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Bell, Palette, Database, MessageSquare, Star, X } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function SettingsPage() {
  const { themeConfig } = useTheme()
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submitFeedback() {
    if (!feedbackMessage.trim()) {
      alert('Пожалуйста, напишите отзыв 😊')
      return
    }
    
    setSending(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feedbackName,
          email: feedbackEmail,
          message: feedbackMessage,
          rating: feedbackRating,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setSent(true)
        setTimeout(() => {
          setShowFeedback(false)
          setSent(false)
          setFeedbackName('')
          setFeedbackEmail('')
          setFeedbackMessage('')
          setFeedbackRating(5)
        }, 2000)
      } else {
        alert('Ошибка отправки 😅 Попробуй позже')
      }
    } catch (error) {
      console.error('Feedback error:', error)
      alert('Ошибка соединения')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`min-h-screen ${themeConfig.colors.bg} transition-colors duration-300`}>
      <header className="sticky top-0 z-50 bg-[hsl(var(--bg-secondary))]/80 backdrop-blur-lg border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors">
            <ArrowLeft className={`w-6 h-6 ${themeConfig.colors.primaryText}`} />
          </Link>
          <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Настройки</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-[hsl(var(--card))] rounded-3xl p-6 shadow-lg border border-[hsl(var(--border))]">
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-4">⚙️ Настройки</h2>
          <div className="space-y-3">
            <Link href="/settings/profile" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <User className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Профиль</span>
            </Link>
            <Link href="/settings/reminders" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <Bell className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Напоминания</span>
            </Link>
            <Link href="/settings/theme" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <Palette className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Тема</span>
            </Link>
            <Link href="/settings/data" className="flex items-center p-4 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors">
              <Database className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className="font-medium text-[hsl(var(--text-primary))]">Данные и память</span>
            </Link>
            
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full flex items-center p-4 rounded-xl bg-gradient-to-r from-[hsl(var(--primary))]/10 to-pink-500/10 hover:from-[hsl(var(--primary))]/20 hover:to-pink-500/20 transition-colors"
            >
              <MessageSquare className={`w-6 h-6 ${themeConfig.colors.primaryText} mr-4`} />
              <span className={`font-medium ${themeConfig.colors.primaryText}`}>💌 Оставить отзыв</span>
            </button>
          </div>
        </div>
      </main>

      {/* Модальное окно отзыва */}
      {showFeedback && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--card))] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[hsl(var(--text-primary))]">💌 Оставить отзыв</h2>
              <button
                onClick={() => setShowFeedback(false)}
                className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[hsl(var(--text-secondary))]" />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <p className={`text-lg font-medium ${themeConfig.colors.primaryText}`}>Спасибо за отзыв!</p>
                <p className="text-sm text-[hsl(var(--text-secondary))] mt-2">Твоё сообщение отправлено ❤️</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Рейтинг */}
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--text-primary))] mb-2 block">
                    Оценка
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="text-3xl transition-transform hover:scale-110"
                      >
                        {star <= feedbackRating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Имя */}
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--text-primary))] mb-2 block">
                    Твоё имя (необязательно)
                  </label>
                  <input
                    type="text"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="Маша"
                    className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--text-primary))] mb-2 block">
                    Email для связи (необязательно)
                  </label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="masha@example.com"
                    className="w-full bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
                  />
                </div>

                {/* Сообщение */}
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--text-primary))] mb-2 block">
                    Сообщение *
                  </label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Расскажи, что тебе нравится или что можно улучшить..."
                    rows={4}
                    className="w-full resize-none bg-[hsl(var(--muted))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 text-[hsl(var(--text-primary))]"
                  />
                </div>

                {/* Кнопки */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="flex-1 py-3 bg-[hsl(var(--muted))] text-[hsl(var(--text-primary))] rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={submitFeedback}
                    disabled={sending || !feedbackMessage.trim()}
                    className={`flex-1 py-3 ${themeConfig.colors.primaryBg} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2`}
                  >
                    {sending ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Отправка...</>
                    ) : (
                      <><Star className="w-5 h-5" />Отправить</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
