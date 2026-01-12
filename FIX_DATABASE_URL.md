# 🔧 Исправление ошибки DATABASE_URL

## Проблема
```
Environment Variable "DATABASE_URL" references Secret "database-url", which does not exist.
```

## Причина
Vercel пытается использовать секрет вместо обычной переменной окружения.

## ✅ Решение

### Способ 1: Через Vercel Dashboard (Проще)

1. Откройте: https://vercel.com/dashboard
2. Выберите ваш проект
3. **Settings** → **Environment Variables**
4. Если `DATABASE_URL` уже существует:
   - Нажмите на три точки → **Remove**
   - Подтвердите удаление
5. Нажмите **Add New**
6. Заполните форму:
   ```
   Name: DATABASE_URL
   Value: postgresql://neondb_owner:npg_HJRrKyFOTA49@ep-polished-field-ahl1ze06-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
7. Выберите окружения:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
8. Нажмите **Save**

### Способ 2: Через Vercel CLI

```bash
# Войдите в Vercel (если еще не вошли)
vercel login

# Перейдите в папку проекта
cd ailesson-platform

# Подключитесь к проекту
vercel link

# Удалите старую переменную (если есть)
vercel env rm DATABASE_URL production
vercel env rm DATABASE_URL preview
vercel env rm DATABASE_URL development

# Добавьте новую переменную
vercel env add DATABASE_URL production
# Вставьте: postgresql://neondb_owner:npg_HJRrKyFOTA49@ep-polished-field-ahl1ze06-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

vercel env add DATABASE_URL preview
# Вставьте ту же строку

vercel env add DATABASE_URL development
# Вставьте ту же строку
```

## 🔄 После исправления

1. **Redeploy проекта:**
   - Vercel Dashboard → Deployments
   - Последний деплой → три точки → **Redeploy**
   - Или просто сделайте новый commit и push

2. **Проверьте переменные:**
   ```bash
   vercel env ls
   ```

3. **Запустите миграции:**
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   npx prisma db seed
   ```

## ✅ Проверка

После redeploy откройте ваше приложение и попробуйте:
- Зарегистрироваться
- Войти в систему
- Создать урок

Если всё работает - проблема решена! 🎉

## 📝 Важно

**НЕ** используйте Vercel Secrets для `DATABASE_URL` - это обычная переменная окружения.

Vercel Secrets используются для:
- Интеграций с другими сервисами
- Токенов доступа к API
- Но НЕ для database connection strings

## 🆘 Если проблема осталась

1. Проверьте, что переменная добавлена для всех окружений
2. Убедитесь, что нет опечаток в имени переменной (должно быть `DATABASE_URL`)
3. Проверьте, что connection string правильный
4. Попробуйте подключиться к БД локально:
   ```bash
   npx prisma db pull
   ```

## 🔗 Полезные ссылки

- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables
- Vercel CLI: https://vercel.com/docs/cli
