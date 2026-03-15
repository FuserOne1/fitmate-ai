'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
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

  return null
}
