#!/bin/bash

# Скрипт для добавления переменных окружения в Vercel
# Использование: bash add-env-vars.sh

echo "🚀 Добавление переменных окружения в Vercel..."
echo ""

# Проверка, что Vercel CLI установлен
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI не установлен!"
    echo "Установите: npm i -g vercel"
    exit 1
fi

# Войти в Vercel
echo "📝 Войдите в Vercel..."
vercel login

# Подключиться к проекту
echo "🔗 Подключение к проекту..."
cd "$(dirname "$0")"
vercel link

echo ""
echo "Теперь добавим переменные окружения..."
echo ""

# Функция для добавления переменной
add_env() {
    local name=$1
    local value=$2
    local env=$3
    
    echo "Добавление $name для $env..."
    echo "$value" | vercel env add "$name" "$env"
}

# DATABASE_URL
echo "📦 DATABASE_URL"
echo "Вставьте ваш DATABASE_URL:"
read -r DATABASE_URL
add_env "DATABASE_URL" "$DATABASE_URL" "production"
add_env "DATABASE_URL" "$DATABASE_URL" "preview"
add_env "DATABASE_URL" "$DATABASE_URL" "development"

# NEXTAUTH_SECRET
echo ""
echo "🔐 NEXTAUTH_SECRET"
NEXTAUTH_SECRET="3ivwX0knmak41v6l7asbqmkHkkpXUZkdWOOL92CO0HQ="
add_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "production"
add_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "preview"
add_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "development"

# NEXTAUTH_URL
echo ""
echo "🌐 NEXTAUTH_URL"
echo "Вставьте URL вашего приложения (например: https://your-app.vercel.app):"
read -r NEXTAUTH_URL
add_env "NEXTAUTH_URL" "$NEXTAUTH_URL" "production"

# GROQ_API_KEY
echo ""
echo "🚀 GROQ_API_KEY"
echo "Вставьте ваш Groq API Key:"
read -r GROQ_API_KEY
add_env "GROQ_API_KEY" "$GROQ_API_KEY" "production"
add_env "GROQ_API_KEY" "$GROQ_API_KEY" "preview"
add_env "GROQ_API_KEY" "$GROQ_API_KEY" "development"

# OPENROUTER_API_KEY
echo ""
echo "🤖 OPENROUTER_API_KEY"
echo "Вставьте ваш OpenRouter API Key:"
read -r OPENROUTER_API_KEY
add_env "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "production"
add_env "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "preview"
add_env "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "development"

# Остальные переменные
echo ""
echo "⚙️ Добавление остальных переменных..."
add_env "CHAT_COST_PER_MESSAGE" "5" "production"
add_env "MAX_FILE_SIZE_MB" "50" "production"
add_env "ALLOWED_FILE_TYPES" "pdf,png,jpg,jpeg,txt" "production"

echo ""
echo "✅ Все переменные добавлены!"
echo ""
echo "Следующие шаги:"
echo "1. Redeploy проекта в Vercel Dashboard"
echo "2. Запустите миграции:"
echo "   vercel env pull .env.production"
echo "   npx prisma migrate deploy"
echo "   npx prisma db seed"
echo ""
echo "🎉 Готово!"
