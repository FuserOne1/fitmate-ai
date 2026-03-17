import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    
    let query = supabase
      .from('workout_plans')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (active !== null) {
      query = query.eq('active', active === 'true')
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Workout plans GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workout plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      title,
      description,
      start_date,
      end_date,
      workout_days,
      workout_type,
      duration_minutes,
      ai_generated,
      ai_prompt,
    } = body
    
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        title,
        description,
        start_date,
        end_date,
        workout_days,
        workout_type,
        duration_minutes,
        ai_generated: ai_generated || false,
        ai_prompt,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Workout plans POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workout plan' },
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
      .from('workout_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Workout plans PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workout plan' },
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
      .from('workout_plans')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workout plans DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete workout plan' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
