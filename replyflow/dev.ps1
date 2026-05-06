# ============================================================
# ReplyFlow — Script de execução local
# Uso: .\dev.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

function Write-Step([string]$msg) {
    Write-Host "`n⚡ $msg" -ForegroundColor Cyan
}
function Write-OK([string]$msg) {
    Write-Host "  ✓ $msg" -ForegroundColor Green
}
function Write-Warn([string]$msg) {
    Write-Host "  ⚠  $msg" -ForegroundColor Yellow
}
function Write-Err([string]$msg) {
    Write-Host "  ✗ $msg" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  ⚡ ReplyFlow — Ambiente de Desenvolvimento Local" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ----------------------------------------------------------
# 1. Verificar Node.js
# ----------------------------------------------------------
Write-Step "Verificando Node.js..."
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Node não encontrado" }
    Write-OK "Node.js $nodeVersion"
} catch {
    Write-Err "Node.js não encontrado. Instale em https://nodejs.org (v20+)"
    exit 1
}

# ----------------------------------------------------------
# 2. Verificar .env.local
# ----------------------------------------------------------
Write-Step "Verificando variáveis de ambiente..."
$envFile = Join-Path $ROOT ".env.local"
$envExample = Join-Path $ROOT ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Warn ".env.local criado a partir do .env.example"
        Write-Warn "IMPORTANTE: Preencha as variáveis em .env.local antes de continuar."
        Write-Host ""
        Write-Host "  Abrir .env.local para editar? (S/N) " -NoNewline -ForegroundColor Yellow
        $resposta = Read-Host
        if ($resposta -match "^[Ss]$") {
            Start-Process notepad $envFile
        }
        Write-Host ""
        Write-Host "  Pressione ENTER quando .env.local estiver preenchido..." -ForegroundColor Yellow
        Read-Host | Out-Null
    } else {
        Write-Err ".env.example não encontrado. Verifique a estrutura do projeto."
        exit 1
    }
} else {
    # Validar variáveis críticas
    $envContent = Get-Content $envFile -Raw
    $missing = @()

    @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "OPENAI_API_KEY",
        "STRIPE_SECRET_KEY"
    ) | ForEach-Object {
        if ($envContent -notmatch "$_=(?!your_|sk-\.\.\.|sk_test_\.\.\.|whsec_\.\.\.)") {
            # Chave existe mas pode estar com valor placeholder
        }
        if ($envContent -notmatch "$_=\S") {
            $missing += $_
        }
    }

    if ($missing.Count -gt 0) {
        Write-Warn "Variáveis não preenchidas em .env.local:"
        $missing | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
        Write-Warn "O app pode não funcionar corretamente."
    } else {
        Write-OK ".env.local encontrado e configurado"
    }
}

# ----------------------------------------------------------
# 3. Instalar dependências
# ----------------------------------------------------------
Write-Step "Verificando dependências..."
$nodeModules = Join-Path $ROOT "node_modules"

if (-not (Test-Path $nodeModules)) {
    Write-Warn "node_modules não encontrado. Instalando dependências (isso pode levar alguns minutos)..."
    Push-Location $ROOT
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Falha ao instalar dependências. Verifique os erros acima."
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-OK "Dependências instaladas com sucesso"
} else {
    Write-OK "node_modules já existe (pular instalação)"
}

# ----------------------------------------------------------
# 4. Verificar porta 3000
# ----------------------------------------------------------
Write-Step "Verificando porta 3000..."
$portInUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Warn "Porta 3000 já está em uso."
    Write-Host "  Matar processo na porta 3000? (S/N) " -NoNewline -ForegroundColor Yellow
    $kill = Read-Host
    if ($kill -match "^[Ss]$") {
        $portInUse | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-OK "Processo encerrado"
    }
} else {
    Write-OK "Porta 3000 disponível"
}

# ----------------------------------------------------------
# 5. Iniciar servidor de desenvolvimento
# ----------------------------------------------------------
Write-Step "Iniciando servidor Next.js..."
Write-Host ""
Write-Host "  URL local:  http://localhost:3000" -ForegroundColor White
Write-Host "  Dashboard:  http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "  Login:      http://localhost:3000/login" -ForegroundColor White
Write-Host ""
Write-Host "  Pressione Ctrl+C para parar o servidor." -ForegroundColor DarkGray
Write-Host ""

# Abrir navegador após 4 segundos (tempo para o servidor subir)
$job = Start-Job -ScriptBlock {
    Start-Sleep -Seconds 4
    Start-Process "http://localhost:3000"
}

Push-Location $ROOT
try {
    npm run dev
} finally {
    Pop-Location
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
}
