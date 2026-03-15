import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Создаём Supabase клиент для проверки сессии
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Игнорируем в middleware
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Публичные страницы
  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.includes(pathname)
  
  if (!user && !isPublicPath) {
    // Не авторизован → redirect на login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (user && isPublicPath) {
    // Авторизован → redirect на dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (PWA icons)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons).*)',
  ],
}
