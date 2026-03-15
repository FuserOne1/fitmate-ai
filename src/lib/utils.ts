import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Расчёт BMR (Mifflin-St Jeor)
export function calculateBMR(params: {
  weight: number // кг
  height: number // см
  age: number
  gender: 'female' | 'male'
}): number {
  const { weight, height, age, gender } = params
  const baseBMR = 10 * weight + 6.25 * height - 5 * age

  return gender === 'female' ? baseBMR - 161 : baseBMR + 5
}

// Расчёт суточной нормы калорий
export function calculateTDEE(params: {
  bmr: number
  activityLevel: number // 1.2 - 1.9
  goal: 'lose' | 'maintain' | 'gain'
}): number {
  const { bmr, activityLevel, goal } = params

  const tdee = bmr * activityLevel

  switch (goal) {
    case 'lose':
      return Math.round(tdee - 500) // Дефицит 500 ккал
    case 'gain':
      return Math.round(tdee + 300) // Профицит 300 ккал
    default:
      return Math.round(tdee)
  }
}

// Расчёт ИМТ
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

// Оценка ИМТ
export function getBMICategory(bmi: number): {
  category: string
  color: string
} {
  if (bmi < 18.5) return { category: 'Недостаточный вес', color: 'text-blue-500' }
  if (bmi < 25) return { category: 'Норма', color: 'text-green-500' }
  if (bmi < 30) return { category: 'Избыточный вес', color: 'text-yellow-500' }
  return { category: 'Ожирение', color: 'text-red-500' }
}

// Конвертация base64 в blob URL
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1])
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

// Сжатие изображения
export async function compressImage(
  file: File,
  maxWidth: number = 1024,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      reader.onerror = (error) => reject(error)
    }
  })
}
