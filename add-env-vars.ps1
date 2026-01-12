# Скрипт для добавления переменных окружения в Vercel (PowerShell)
# Использование: .\add-env-vars.ps1

Write-Host "🚀 Добавление переменных окружения в Vercel..." -ForegroundColor Green
Write-Host ""

# Проверка, что Vercel CLI установлен
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI не установлен!" -ForegroundColor Red
    Write-Host "Установите: npm i -g vercel"
    exit 1
}

# Войти в Vercel
Write-Host "📝 Войдите в Vercel..." -ForegroundColor Cyan
vercel login

# Подключиться к проекту
Write-Host "🔗 Подключение к проекту..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
vercel link

Write-Host ""
Write-Host "Теперь добавим переменные окружения..." -ForegroundColor Yellow
Write-Host ""

# Функция для добавления переменной
function Add-EnvVar {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Environment
    )
    
    Write-Host "Добавление $Name для $Environment..." -ForegroundColor Gray
    $Value | vercel env add $Name $Environment
}

# DATABASE_URL
Write-Host "📦 DATABASE_URL" -ForegroundColor Cyan
Write-Host "Ваш DATABASE_URL:"
Write-Host "postgresql://neondb_owner:npg_HJRrKyFOTA49@ep-polished-field-ahl1ze06-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Yellow
$DATABASE_URL = Read-Host "Нажмите Enter для использования или вставьте другой"
if ([string]::IsNullOrWhiteSpace($DATABASE_URL)) {
    $DATABASE_URL = "postgresql://neondb_owner:npg_HJRrKyFOTA49@ep-polished-field-ahl1ze06-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
}
Add-EnvVar -Name "DATABASE_URL" -Value $DATABASE_URL -Environment "production"
Add-EnvVar -Name "DATABASE_URL" -Value $DATABASE_URL -Environment "preview"
Add-EnvVar -Name "DATABASE_URL" -Value $DATABASE_URL -Environment "development"

# NEXTAUTH_SECRET
Write-Host ""
Write-Host "🔐 NEXTAUTH_SECRET" -ForegroundColor Cyan
$NEXTAUTH_SECRET = "3ivwX0knmak41v6l7asbqmkHkkpXUZkdWOOL92CO0HQ="
Write-Host "Используется: $NEXTAUTH_SECRET" -ForegroundColor Yellow
Add-EnvVar -Name "NEXTAUTH_SECRET" -Value $NEXTAUTH_SECRET -Environment "production"
Add-EnvVar -Name "NEXTAUTH_SECRET" -Value $NEXTAUTH_SECRET -Environment "preview"
Add-EnvVar -Name "NEXTAUTH_SECRET" -Value $NEXTAUTH_SECRET -Environment "development"

# NEXTAUTH_URL
Write-Host ""
Write-Host "🌐 NEXTAUTH_URL" -ForegroundColor Cyan
$NEXTAUTH_URL = Read-Host "Вставьте URL вашего приложения (например: https://your-app.vercel.app)"
Add-EnvVar -Name "NEXTAUTH_URL" -Value $NEXTAUTH_URL -Environment "production"

# GROQ_API_KEY
Write-Host ""
Write-Host "🚀 GROQ_API_KEY" -ForegroundColor Cyan
$GROQ_API_KEY = Read-Host "Вставьте ваш Groq API Key"
Add-EnvVar -Name "GROQ_API_KEY" -Value $GROQ_API_KEY -Environment "production"
Add-EnvVar -Name "GROQ_API_KEY" -Value $GROQ_API_KEY -Environment "preview"
Add-EnvVar -Name "GROQ_API_KEY" -Value $GROQ_API_KEY -Environment "development"

# OPENROUTER_API_KEY
Write-Host ""
Write-Host "🤖 OPENROUTER_API_KEY" -ForegroundColor Cyan
$OPENROUTER_API_KEY = Read-Host "Вставьте ваш OpenRouter API Key"
Add-EnvVar -Name "OPENROUTER_API_KEY" -Value $OPENROUTER_API_KEY -Environment "production"
Add-EnvVar -Name "OPENROUTER_API_KEY" -Value $OPENROUTER_API_KEY -Environment "preview"
Add-EnvVar -Name "OPENROUTER_API_KEY" -Value $OPENROUTER_API_KEY -Environment "development"

# Остальные переменные
Write-Host ""
Write-Host "⚙️ Добавление остальных переменных..." -ForegroundColor Cyan
Add-EnvVar -Name "CHAT_COST_PER_MESSAGE" -Value "5" -Environment "production"
Add-EnvVar -Name "MAX_FILE_SIZE_MB" -Value "50" -Environment "production"
Add-EnvVar -Name "ALLOWED_FILE_TYPES" -Value "pdf,png,jpg,jpeg,txt" -Environment "production"

Write-Host ""
Write-Host "✅ Все переменные добавлены!" -ForegroundColor Green
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Redeploy проекта в Vercel Dashboard"
Write-Host "2. Запустите миграции:"
Write-Host "   vercel env pull .env.production"
Write-Host "   npx prisma migrate deploy"
Write-Host "   npx prisma db seed"
Write-Host ""
Write-Host "🎉 Готово!" -ForegroundColor Green
