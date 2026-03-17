import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    
    let query = supabase
      .from('daily_steps')
      .select('*')
      .order('date', { ascending: false })
    
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Steps GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch steps' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      date,
      steps,
      distance_km,
      calories_burned,
      source,
      screenshot_url,
      ai_parsed,
      ai_data,
    } = body
    
    // Проверяем есть ли уже запись за эту дату
    const { data: existing } = await supabase
      .from('daily_steps')
      .select('id')
      .eq('date', date || new Date().toISOString().split('T')[0])
      .single()
    
    let data, error
    
    if (existing) {
      // Обновляем
      const updateData: any = { steps, distance_km, calories_burned, source, screenshot_url, ai_parsed, ai_data }
      const result = await supabase
        .from('daily_steps')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Создаём
      const result = await supabase
        .from('daily_steps')
        .insert({
          date: date || new Date().toISOString().split('T')[0],
          steps: steps || 0,
          distance_km,
          calories_burned,
          source: source || 'manual',
          screenshot_url,
          ai_parsed: ai_parsed || false,
          ai_data,
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Steps POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save steps' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { id, ...updates } = body
    
    const { data, error } = await supabase
      .from('daily_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Steps PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update steps' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
