# ⚡ Быстрое исправление ошибки DATABASE_URL

## ❌ Ошибка
```
Environment Variable "DATABASE_URL" references Secret "database-url", which does not exist.
```

## ✅ Решение за 2 минуты

### Шаг 1: Откройте Vercel Dashboard
🔗 https://vercel.com/dashboard

### Шаг 2: Перейдите в настройки
1. Выберите ваш проект
2. **Settings** → **Environment Variables**

### Шаг 3: Удалите старую переменную (если есть)
1. Найдите `DATABASE_URL`
2. Три точки → **Remove**
3. Подтвердите

### Шаг 4: Добавьте новую переменную
1. Нажмите **Add New**
2. Заполните:
   - **Name:** `DATABASE_URL`
   - **Value:** 
     ```
     postgresql://neondb_owner:npg_HJRrKyFOTA49@ep-polished-field-ahl1ze06-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
3. **Save**

### Шаг 5: Redeploy
1. **Deployments** → последний деплой
2. Три точки → **Redeploy**
3. Дождитесь завершения

## 🎉 Готово!

Ошибка исправлена. Теперь можете продолжить развертывание.

---

## 🔧 Альтернатива: Через CLI

Если предпочитаете командную строку:

```bash
# Войдите в Vercel
vercel login

# Перейдите в папку проекта
cd ailesson-platform

# Подключитесь к проекту
vercel link

# Удалите старую переменную
vercel env rm DATABASE_URL production

# Добавьте новую
vercel env add DATABASE_URL production
# Вставьте: postgresql://neondb_owner:npg_HJRrKyFOTA49@ep-polished-field-ahl1ze06-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Повторите для preview и development
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

---

## 📝 Важно

- **НЕ** используйте Vercel Secrets для DATABASE_URL
- Это должна быть обычная Environment Variable
- Убедитесь, что нет опечаток в имени переменной

---

## 🆘 Если не помогло

1. Проверьте, что переменная добавлена для всех окружений
2. Убедитесь, что connection string правильный
3. Попробуйте подключиться к БД локально:
   ```bash
   DATABASE_URL="postgresql://neondb_owner:npg_HJRrKyFOTA49@ep-polished-field-ahl1ze06-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" npx prisma db pull
   ```

---

## 📚 Дополнительно

- Полная инструкция: `FIX_DATABASE_URL.md`
- Автоматический скрипт: `add-env-vars.ps1` (Windows) или `add-env-vars.sh` (Mac/Linux)
