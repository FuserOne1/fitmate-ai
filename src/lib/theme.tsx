'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'rose' | 'lavender' | 'peach' | 'sage' | 'dark'

type ThemeConfig = {
  name: string
  emoji: string
  colors: {
    primary: string
    primaryBg: string
    primaryText: string
    gradient: string
    bg: string
  }
}

const themes: Record<Theme, ThemeConfig> = {
  rose: {
    name: 'Розовая',
    emoji: '🌸',
    colors: {
      primary: '#f43f5e',
      primaryBg: 'bg-rose-500',
      primaryText: 'text-rose-500',
      gradient: 'from-rose-50 to-pink-100',
      bg: 'bg-gradient-to-br from-rose-50 to-pink-100',
    },
  },
  lavender: {
    name: 'Лаванда',
    emoji: '💜',
    colors: {
      primary: '#8b5cf6',
      primaryBg: 'bg-violet-500',
      primaryText: 'text-violet-500',
      gradient: 'from-violet-50 to-purple-100',
      bg: 'bg-gradient-to-br from-violet-50 to-purple-100',
    },
  },
  peach: {
    name: 'Персик',
    emoji: '🍑',
    colors: {
      primary: '#f97316',
      primaryBg: 'bg-orange-500',
      primaryText: 'text-orange-500',
      gradient: 'from-orange-50 to-amber-100',
      bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
    },
  },
  sage: {
    name: 'Шалфей',
    emoji: '🌿',
    colors: {
      primary: '#6a9b6a',
      primaryBg: 'bg-emerald-500',
      primaryText: 'text-emerald-500',
      gradient: 'from-emerald-50 to-green-100',
      bg: 'bg-gradient-to-br from-emerald-50 to-green-100',
    },
  },
  dark: {
    name: 'Тёмная',
    emoji: '🌙',
    colors: {
      primary: '#ec4899',
      primaryBg: 'bg-pink-500',
      primaryText: 'text-pink-400',
      gradient: 'from-gray-900 to-gray-800',
      bg: 'bg-[hsl(var(--bg-primary))]',
    },
  },
}

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  themeConfig: ThemeConfig
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('rose')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fitmate-theme') as Theme
    if (saved && themes[saved]) {
      setTheme(saved)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('fitmate-theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme, mounted])

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeConfig: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
