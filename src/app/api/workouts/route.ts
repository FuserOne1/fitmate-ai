import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Получаем параметры
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    
    let query = supabase
      .from('workouts')
      .select('*')
      .order('workout_date', { ascending: false })
    
    if (startDate && endDate) {
      query = query.gte('workout_date', startDate).lte('workout_date', endDate)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Workouts GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      workout_type,
      workout_date,
      duration_minutes,
      calories_burned,
      distance_km,
      exercises,
      ai_analysis,
      ai_tips,
      mood_before,
      mood_after,
      notes,
      is_planned,
      plan_id,
    } = body
    
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        workout_type,
        workout_date: workout_date || new Date().toISOString(),
        duration_minutes,
        calories_burned,
        distance_km,
        exercises,
        ai_analysis,
        ai_tips,
        mood_before,
        mood_after,
        notes,
        is_planned: is_planned || false,
        plan_id,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Workouts POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workout' },
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
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Workouts PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workout' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workouts DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
