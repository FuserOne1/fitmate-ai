# FitMate AI 🌸

**Умный помощник для похудения с AI-анализом**

PWA-приложение для трекинга питания, воды, веса с интеграцией AI (Gemini 2.5 Flash через OpenRouter).

---

## ✨ Функции

### 🍽️ Дневник питания
- Фото еды → AI распознаёт и считает калории/БЖУ
- Ручной ввод продуктов
- Приёмы пищи: завтрак, обед, ужин, перекусы

### 💧 Трекер воды
- Отслеживание потребления воды
- Напоминания пить воду

### ⚖️ Взвешивания
- Запись веса с AI-анализом тренда
- Учёт % жира, мышц, воды (с умных весов)
- График прогресса

### 📸 Анализ фото
- **Еда** → калории и БЖУ
- **Скриншоты весов** → парсинг данных
- **Фото тела** → оценка прогресса

### 💬 AI Чат
- Вопросы о питании
- Генерация меню
- Мотивация и поддержка

### 🔔 Напоминания
- О приёмах пищи
- О воде
- О взвешивании

### 🎨 Темы оформления
- 🌸 Rose (розовая)
- 🌙 Lavender (лавандовая)
- 🍑 Peach (персиковая)
- 🌿 Sage (шалфей)
- 🖤 Dark (тёмная)

---

## 🛠️ Технологический стек

- **Frontend:** Next.js 14 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **PWA:** next-pwa (manifest, service worker)
- **БД:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** OpenRouter API (Gemini 2.5 Flash)

---

## 🚀 Быстрый старт

### 1. Клонирование

```bash
git clone https://github.com/FuserOne1/fitmate-ai.git
cd fitmate-ai
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка .env.local

Файл `.env.local` уже создан с твоими ключами:

```env
NEXT_PUBLIC_SUPABASE_URL=https://munugfwyqhzyjwbvolaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_sw-01xoWwv3MqGTRKONN4w__5VuqD_A
OPENROUTER_API_KEY=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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Настройка БД (Supabase)

1. Зайди в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выбери проект
3. Открой **SQL Editor**
4. Скопируй содержимое файла `supabase-schema.sql`
5. Выполни SQL скрипт

Это создаст:
- Все таблицы
- RLS политики
- Триггеры
- Storage бакеты

### 5. Запуск разработки

```bash
npm run dev
```

Приложение откроется на [http://localhost:3000](http://localhost:3000)

---

## 📁 Структура проекта

```
fitmate-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Страницы авторизации
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── auth/callback/
│   │   ├── (dashboard)/      # Основной интерфейс
│   │   │   ├── page.tsx      # Главная
│   │   │   ├── diary/        # Дневник питания
│   │   │   ├── water/        # Трекер воды
│   │   │   ├── weight/       # Взвешивания
│   │   │   ├── body/         # Фото тела
│   │   │   ├── chat/         # AI чат
│   │   │   ├── stats/        # Статистика
│   │   │   └── settings/     # Настройки
│   │   ├── api/
│   │   │   └── ai/           # AI endpoints
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/               # UI компоненты
│   │   └── shared/           # Общие компоненты
│   ├── lib/
│   │   ├── supabase/         # Supabase клиенты
│   │   ├── ai/               # AI интеграция
│   │   └── utils.ts          # Утилиты
│   └── hooks/
├── public/
│   ├── manifest.json         # PWA manifest
│   └── icons/                # PWA иконки
├── supabase-schema.sql       # Схема БД
├── package.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🔑 API Keys

### OpenRouter

Модель: `google/gemini-2.5-flash-preview`

- Анализ фото: ~$0.075 / 1000 запросов
- Чат: ~$0.03 / 1000 запросов

[Получить ключ](https://openrouter.ai/)

### Supabase

- БД: PostgreSQL
- Auth: Email + Google OAuth
- Storage: Фото пользователей

[Создать проект](https://supabase.com/)

---

## 📱 PWA

### Установка на телефон

**iOS:**
1. Открыть в Safari
2. Share → Add to Home Screen

**Android:**
1. Открыть в Chrome
2. Меню → Install App

### Offline режим

- Кэширование статических данных
- Просмотр прошлых записей без сети
- Синхронизация при подключении

---

## 🎨 Темы

Темы хранятся в `tailwind.config.ts` и переключаются через CSS переменные.

**Как добавить тему:**

1. Добавить цвета в `tailwind.config.ts`
2. Создать CSS переменные в `globals.css`
3. Сохранить выбор в `profiles.theme`

---

## 📊 База данных

### Таблицы

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей |
| `daily_logs` | Дневные логи (калории, вода, вес) |
| `food_entries` | Приёмы пищи |
| `weight_logs` | Взвешивания |
| `body_photos` | Фото тела |
| `scale_screenshots` | Скриншоты весов |
| `ai_chats` | История чата |
| `reminders` | Напоминания |

---

## 🚀 Деплой на Vercel

### 1. Push в GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/FuserOne1/fitmate-ai.git
git push -u origin main
```

### 2. Подключить Vercel

1. Зайти на [vercel.com](https://vercel.com)
2. Import GitHub репозиторий
3. Настроить Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENROUTER_API_KEY`
4. Deploy

### 3. Настроить Supabase Auth

В Supabase Dashboard:
- Authentication → URL Configuration
- Add Site URL: `https://your-app.vercel.app`
- Add Redirect URL: `https://your-app.vercel.app/auth/callback`

---

## 🧪 Разработка

### Команды

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Production сборка
npm run start        # Запуск production
npm run lint         # ESLint
```

### Добавление страниц

1. Создать папку в `src/app/(dashboard)/`
2. Добавить `page.tsx`
3. Добавить ссылку в навигацию

---

## 📝 Roadmap

- [ ] Дневник питания + фото
- [ ] Трекер воды
- [ ] Взвешивания + график
- [ ] AI чат
- [ ] Фото тела
- [ ] Напоминания (push)
- [ ] Темы оформления
- [ ] Статистика
- [ ] Экспорт данных

---

## 🤝 Контрибьюторы

- [FuserOne1](https://github.com/FuserOne1)

---

## 📄 Лицензия

MIT

---

## 💕 Сделано с любовью

FitMate AI — твой дружелюбный помощник на пути к здоровью!
