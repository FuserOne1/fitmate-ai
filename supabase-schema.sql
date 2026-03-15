-- FitMate AI Database Schema for Supabase
-- Выполните этот SQL в Supabase SQL Editor
-- Если политики уже существуют - скрипт пропустит их создание

-- ============================================
-- ТАБЛИЦЫ
-- ============================================

-- Профили пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Параметры тела
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  age INTEGER,
  gender TEXT CHECK (gender IN ('female', 'male')),
  
  -- Активность (1.2 - 1.9)
  activity_level DECIMAL(3,2) DEFAULT 1.2,
  
  -- Цель
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')) DEFAULT 'lose',
  
  -- Расчётные значения
  bmr INTEGER,
  tdee INTEGER,
  target_weight_kg DECIMAL(5,2),
  
  -- Настройки
  theme TEXT DEFAULT 'rose',
  notifications_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Дневные логи
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  
  -- Калории
  calories_target INTEGER,
  calories_consumed INTEGER DEFAULT 0,
  
  -- БЖУ
  protein_target INTEGER,
  protein_consumed INTEGER DEFAULT 0,
  fat_target INTEGER,
  fat_consumed INTEGER DEFAULT 0,
  carbs_target INTEGER,
  carbs_consumed INTEGER DEFAULT 0,
  
  -- Вода (мл)
  water_intake INTEGER DEFAULT 0,
  water_target INTEGER DEFAULT 2000,
  
  -- Вес утром (кг)
  morning_weight DECIMAL(5,2),
  
  -- Заметки
  notes TEXT,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Приёмы пищи
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  
  -- Данные о еде
  food_name TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  weight_g INTEGER,
  
  -- Фото еды
  photo_url TEXT,
  ai_analyzed BOOLEAN DEFAULT false,
  ai_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Взвешивания
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  weight_kg DECIMAL(5,2) NOT NULL,
  body_fat_percent DECIMAL(5,2),
  muscle_percent DECIMAL(5,2),
  water_percent DECIMAL(5,2),
  bmi DECIMAL(5,2),
  
  -- AI анализ
  ai_comment TEXT,
  trend TEXT,
  
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Фото тела
CREATE TABLE IF NOT EXISTS body_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('front', 'side', 'back', 'comparison')),
  
  -- AI анализ
  ai_comment TEXT,
  week_number INTEGER,
  
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Скриншоты весов
CREATE TABLE IF NOT EXISTS scale_screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  screenshot_url TEXT NOT NULL,
  
  -- Распарсенные данные
  parsed_data JSONB,
  weight_kg DECIMAL(5,2),
  body_fat_percent DECIMAL(5,2),
  muscle_percent DECIMAL(5,2),
  water_percent DECIMAL(5,2),
  
  ai_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Чат с AI
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Напоминания
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  reminder_type TEXT CHECK (reminder_type IN ('meal', 'water', 'weigh_in', 'log_food')) NOT NULL,
  title TEXT NOT NULL,
  
  time TIME NOT NULL,
  days_of_week INTEGER[], -- [0, 1, 2, 3, 4, 5, 6] - дни недели (0 = воскресенье)
  
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scale_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Политики для profiles (с проверкой на существование)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свой профиль') THEN
    CREATE POLICY "Пользователи видят свой профиль"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи обновляют свой профиль') THEN
    CREATE POLICY "Пользователи обновляют свой профиль"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи создают свой профиль') THEN
    CREATE POLICY "Пользователи создают свой профиль"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Политики для daily_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свои логи') THEN
    CREATE POLICY "Пользователи видят свои логи"
      ON daily_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи создают свои логи') THEN
    CREATE POLICY "Пользователи создают свои логи"
      ON daily_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи обновляют свои логи') THEN
    CREATE POLICY "Пользователи обновляют свои логи"
      ON daily_logs FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Политики для food_entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свои записи о еде') THEN
    CREATE POLICY "Пользователи видят свои записи о еде"
      ON food_entries FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи создают свои записи о еде') THEN
    CREATE POLICY "Пользователи создают свои записи о еде"
      ON food_entries FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи обновляют свои записи о еде') THEN
    CREATE POLICY "Пользователи обновляют свои записи о еде"
      ON food_entries FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи удаляют свои записи о еде') THEN
    CREATE POLICY "Пользователи удаляют свои записи о еде"
      ON food_entries FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Политики для weight_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свои взвешивания') THEN
    CREATE POLICY "Пользователи видят свои взвешивания"
      ON weight_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи создают свои взвешивания') THEN
    CREATE POLICY "Пользователи создают свои взвешивания"
      ON weight_logs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Политики для body_photos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свои фото') THEN
    CREATE POLICY "Пользователи видят свои фото"
      ON body_photos FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи загружают свои фото') THEN
    CREATE POLICY "Пользователи загружают свои фото"
      ON body_photos FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Политики для scale_screenshots
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свои скриншоты') THEN
    CREATE POLICY "Пользователи видят свои скриншоты"
      ON scale_screenshots FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи загружают свои скриншоты') THEN
    CREATE POLICY "Пользователи загружают свои скриншоты"
      ON scale_screenshots FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Политики для ai_chats
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свой чат') THEN
    CREATE POLICY "Пользователи видят свой чат"
      ON ai_chats FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи пишут в чат') THEN
    CREATE POLICY "Пользователи пишут в чат"
      ON ai_chats FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Политики для reminders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи видят свои напоминания') THEN
    CREATE POLICY "Пользователи видят свои напоминания"
      ON reminders FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи управляют своими напоминаниями') THEN
    CREATE POLICY "Пользователи управляют своими напоминаниями"
      ON reminders FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- ФУНКЦИИ
-- ============================================

-- Автоматическое создание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на создание профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Автоматическое обновление updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Создать бакеты (игнорируем ошибки если уже существуют)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'food-photos') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('food-photos', 'food-photos', true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'body-photos') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('body-photos', 'body-photos', true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'scale-screenshots') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('scale-screenshots', 'scale-screenshots', true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;
END $$;

-- Политики для storage (с проверкой)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи могут загружать фото еды') THEN
    CREATE POLICY "Пользователи могут загружать фото еды"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи могут загружать фото тела') THEN
    CREATE POLICY "Пользователи могут загружать фото тела"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи могут загружать скриншоты весов') THEN
    CREATE POLICY "Пользователи могут загружать скриншоты весов"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'scale-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи могут загружать аватарки') THEN
    CREATE POLICY "Пользователи могут загружать аватарки"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи могут видеть свои файлы') THEN
    CREATE POLICY "Пользователи могут видеть свои файлы"
      ON storage.objects FOR SELECT
      USING (auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Пользователи могут удалять свои файлы') THEN
    CREATE POLICY "Пользователи могут удалять свои файлы"
      ON storage.objects FOR DELETE
      USING (auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- ============================================
-- ИНДЕКСЫ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_food_entries_user ON food_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_daily_log ON food_entries(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_body_photos_user ON body_photos(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_scale_screenshots_user ON scale_screenshots(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_chats(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
