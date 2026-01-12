# ⚡ Быстрый старт: 5 шагов до деплоя

## 🎯 Что нужно сделать

### 1️⃣ Получите GROQ_API_KEY (2 минуты)
🔗 **https://console.groq.com**

1. Зарегистрируйтесь (бесплатно)
2. API Keys → Create API Key
3. Скопируйте ключ (формат: `gsk_...`)

---

### 2️⃣ Получите OPENROUTER_API_KEY (2 минуты)
🔗 **https://openrouter.ai**

1. Sign In → зарегистрируйтесь
2. Keys → Create Key
3. Скопируйте ключ (формат: `sk-or-v1-...`)

---

### 3️⃣ Разверните на Vercel (5 минут)
🔗 **https://vercel.com**

1. Add New → Project → Import Git Repository
2. Выберите: `surgik-gh/AILesson`
3. **Root Directory:** `ailesson-platform`
4. Добавьте переменные окружения:

```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=3ivwX0knmak41v6l7asbqmkHkkpXUZkdWOOL92CO0HQ=
GROQ_API_KEY=gsk_ваш-ключ-из-шага-1
OPENROUTER_API_KEY=sk-or-v1-ваш-ключ-из-шага-2
CHAT_COST_PER_MESSAGE=5
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,png,jpg,jpeg,txt
```

5. Нажмите **Deploy**
6. Скопируйте URL приложения

---

### 4️⃣ Создайте базу данных (2 минуты)

**Самый простой способ:**
- В Vercel: Storage → Create Database → Postgres
- Vercel автоматически добавит `DATABASE_URL` ✅

**Альтернатива (Supabase):**
- 🔗 **https://supabase.com**
- New Project → скопируйте Connection string
- Добавьте в Vercel как `DATABASE_URL`

---

### 5️⃣ Обновите NEXTAUTH_URL (1 минута)

1. Скопируйте реальный URL из Vercel
2. Settings → Environment Variables
3. Edit `NEXTAUTH_URL` → вставьте реальный URL
4. Deployments → Redeploy

---

## 🗄️ Инициализация базы данных

**На вашем компьютере:**

```bash
cd ailesson-platform

# Установите Vercel CLI
npm i -g vercel

# Войдите и подключитесь
vercel login
vercel link

# Загрузите переменные и запустите миграции
vercel env pull .env.production
npx prisma migrate deploy
npx prisma db seed
```

---

## ✅ Готово!

Откройте ваше приложение и проверьте работу!

---

## 📋 Итоговый список переменных

```bash
NEXTAUTH_URL=https://ваш-url.vercel.app
NEXTAUTH_SECRET=3ivwX0knmak41v6l7asbqmkHkkpXUZkdWOOL92CO0HQ=
DATABASE_URL=postgresql://... (автоматически из Vercel Postgres)
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
CHAT_COST_PER_MESSAGE=5
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,png,jpg,jpeg,txt
```

---

## 🔗 Полезные ссылки

| Сервис | Ссылка | Для чего |
|--------|--------|----------|
| **Vercel** | https://vercel.com | Хостинг приложения |
| **Groq** | https://console.groq.com | AI для уроков |
| **OpenRouter** | https://openrouter.ai | AI для экспертов |
| **Supabase** | https://supabase.com | База данных (опционально) |

---

## 📚 Подробные инструкции

- **Полное руководство:** `VERCEL_DEPLOYMENT_RU.md`
- **Чеклист:** `DEPLOYMENT_CHECKLIST_RU.md`
- **Шпаргалка по API:** `ENV_VARIABLES_GUIDE.md`
