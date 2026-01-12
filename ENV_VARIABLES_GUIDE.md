# 🔑 Быстрая шпаргалка: Где получить API ключи

## ✅ Готовые значения

```bash
NEXTAUTH_SECRET=3ivwX0knmak41v6l7asbqmkHkkpXUZkdWOOL92CO0HQ=
```

---

## 🌐 NEXTAUTH_URL

**Что это:** URL вашего приложения на Vercel

**Как получить:**
1. Сначала используйте временный: `https://your-app.vercel.app`
2. После первого деплоя Vercel покажет реальный URL
3. Обновите переменную на реальный URL

**Пример:**
```bash
NEXTAUTH_URL=https://ailesson-platform-abc123.vercel.app
```

---

## 🗄️ DATABASE_URL

### Вариант 1: Vercel Postgres (Проще) ⭐

**Ссылка:** https://vercel.com/dashboard

**Шаги:**
1. Откройте ваш проект в Vercel
2. Storage → Create Database → Postgres
3. Vercel автоматически добавит `DATABASE_URL`

### Вариант 2: Supabase (Бесплатный)

**Ссылка:** https://supabase.com

**Шаги:**
1. Создайте аккаунт
2. New Project → придумайте пароль
3. Settings → Database → Connection string (URI)
4. Скопируйте и замените `[YOUR-PASSWORD]` на ваш пароль

**Формат:**
```bash
DATABASE_URL=postgresql://postgres:ваш-пароль@db.xxx.supabase.co:5432/postgres
```

---

## 🚀 GROQ_API_KEY

**Ссылка:** https://console.groq.com

**Для чего:** Генерация уроков и квизов (AI)

**Шаги:**
1. Sign Up (бесплатно)
2. Подтвердите email
3. API Keys → Create API Key
4. Скопируйте ключ

**Формат:**
```bash
GROQ_API_KEY=gsk_ваш-ключ-здесь
```

---

## 🤖 OPENROUTER_API_KEY

**Ссылка:** https://openrouter.ai

**Для чего:** Генерация AI-экспертов

**Шаги:**
1. Sign In → зарегистрируйтесь
2. Keys → Create Key
3. Скопируйте ключ

**Формат:**
```bash
OPENROUTER_API_KEY=sk-or-v1-ваш-ключ-здесь
```

---

## 📋 Итоговый .env файл

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://ваш-url.vercel.app
NEXTAUTH_SECRET=3ivwX0knmak41v6l7asbqmkHkkpXUZkdWOOL92CO0HQ=

# Database
DATABASE_URL=postgresql://...

# AI Services
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## ⚡ Быстрый старт

1. **Получите ключи** (5-10 минут):
   - Groq: https://console.groq.com
   - OpenRouter: https://openrouter.ai

2. **Разверните на Vercel** (5 минут):
   - https://vercel.com → Import Git Repository
   - Root Directory: `ailesson-platform`
   - Добавьте переменные окружения

3. **Настройте базу данных** (2 минуты):
   - Vercel Storage → Create Postgres
   - Или Supabase: https://supabase.com

4. **Обновите NEXTAUTH_URL** (1 минута):
   - Скопируйте реальный URL из Vercel
   - Settings → Environment Variables → Edit

5. **Запустите миграции** (2 минуты):
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## 💡 Полезные ссылки

- **Подробная инструкция:** `VERCEL_DEPLOYMENT_RU.md`
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Groq Console:** https://console.groq.com
- **OpenRouter:** https://openrouter.ai
- **Supabase:** https://supabase.com
- **Vercel Postgres:** https://vercel.com/docs/storage/vercel-postgres
