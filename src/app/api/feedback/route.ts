import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is missing!')
    return NextResponse.json(
      { error: 'Server configuration error', message: 'RESEND_API_KEY is missing' },
      { status: 500 }
    )
  }

  const resend = new Resend(apiKey)

  try {
    const body = await request.json()
    const { name, email, message, rating } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'regunov2004@gmail.com',
      subject: `🌟 Новый отзыв от ${name || 'Анонима'}${rating ? ` (${rating}/5 ⭐)` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f43f5e;">Новый отзыв для FitMate AI 🌸</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
            ${rating ? `
              <p style="margin: 0 0 15px 0; font-size: 18px;">
                <strong>Оценка:</strong> ${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)
              </p>
            ` : ''}
            
            ${name ? `
              <p style="margin: 0 0 10px 0;">
                <strong>Имя:</strong> ${name}
              </p>
            ` : ''}
            
            ${email ? `
              <p style="margin: 0 0 10px 0;">
                <strong>Email:</strong> ${email}
              </p>
            ` : ''}
            
            <p style="margin: 15px 0 0 0;">
              <strong>Сообщение:</strong>
            </p>
            <p style="margin: 10px 0; line-height: 1.6; color: #374151;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Отправлено из приложения FitMate AI
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { id: data.id } })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
