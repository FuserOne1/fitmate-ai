import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '✅ Exists' : '❌ Missing',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Exists' : '❌ Missing',
  })
}

export const runtime = 'nodejs'
