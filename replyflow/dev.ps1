# ============================================================
# ReplyFlow - Script de execucao local (PC + Mobile)
# Uso: .\dev.ps1   ou   clique duplo em dev.bat
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$PORT = 3000

function Write-Step { param([string]$msg); Write-Host "" }
function Write-OK   { param([string]$msg); Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg); Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$msg); Write-Host "  [X]  $msg" -ForegroundColor Red }
function Write-Info { param([string]$msg); Write-Host "       $msg" -ForegroundColor Cyan }

Clear-Host
Write-Host ""
Write-Host "  =============================================" -ForegroundColor Magenta
Write-Host "   ReplyFlow  -  Ambiente de Desenvolvimento   " -ForegroundColor Magenta
Write-Host "  =============================================" -ForegroundColor Magenta

# ----------------------------------------------------------
# 1. Verificar Node.js
# ----------------------------------------------------------
Write-Host "`n  Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = (node --version 2>&1).ToString().Trim()
    if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
    Write-OK "Node.js $nodeVersion"
} catch {
    Write-Err "Node.js nao encontrado. Instale em https://nodejs.org (v20+)"
    Read-Host "`n  Pressione ENTER para sair"
    exit 1
}

# ----------------------------------------------------------
# 2. Verificar .env.local
# ----------------------------------------------------------
Write-Host "`n  Verificando variaveis de ambiente..." -ForegroundColor Cyan
$envFile    = Join-Path $ROOT ".env.local"
$envExample = Join-Path $ROOT ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Warn ".env.local criado a partir do .env.example"
        Write-Warn "Preencha as variaveis em .env.local antes de continuar."
        Write-Host ""
        Write-Host "  Abrir .env.local agora? (S/N) " -NoNewline -ForegroundColor Yellow
        $r = Read-Host
        if ($r -match "^[Ss]$") { Start-Process notepad $envFile }
        Write-Host "  Pressione ENTER quando .env.local estiver preenchido..." -ForegroundColor Yellow
        Read-Host | Out-Null
    } else {
        Write-Err ".env.example nao encontrado."
        Read-Host "`n  Pressione ENTER para sair"
        exit 1
    }
} else {
    $envContent = Get-Content $envFile -Raw
    $vars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "OPENAI_API_KEY",
        "STRIPE_SECRET_KEY"
    )
    $missing = $vars | Where-Object { $envContent -notmatch ($_ + "=\S") }

    if ($missing.Count -gt 0) {
        Write-Warn "Variaveis nao preenchidas no .env.local:"
        $missing | ForEach-Object { Write-Host "       - $_" -ForegroundColor Yellow }
    } else {
        Write-OK ".env.local configurado"
    }
}

# ----------------------------------------------------------
# 3. Instalar dependencias
# ----------------------------------------------------------
Write-Host "`n  Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $ROOT "node_modules"))) {
    Write-Warn "node_modules ausente. Instalando (aguarde alguns minutos)..."
    Push-Location $ROOT
    npm install
    $exitCode = $LASTEXITCODE
    Pop-Location
    if ($exitCode -ne 0) {
        Write-Err "Falha no npm install. Veja os erros acima."
        Read-Host "`n  Pressione ENTER para sair"
        exit 1
    }
    Write-OK "Dependencias instaladas"
} else {
    Write-OK "node_modules encontrado"
}

# ----------------------------------------------------------
# 4. Liberar porta
# ----------------------------------------------------------
Write-Host "`n  Verificando porta $PORT..." -ForegroundColor Cyan
$portInUse = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Warn "Porta $PORT ja esta em uso."
    Write-Host "  Encerrar o processo? (S/N) " -NoNewline -ForegroundColor Yellow
    if ((Read-Host) -match "^[Ss]$") {
        $portInUse | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-OK "Processo encerrado"
    }
} else {
    Write-OK "Porta $PORT disponivel"
}

# ----------------------------------------------------------
# 5. Detectar IP local (acesso mobile)
# ----------------------------------------------------------
$localIP = $null
try {
    $iface = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notmatch "^127\." -and
            $_.IPAddress -notmatch "^169\.254\." -and
            ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual") -and
            $_.InterfaceAlias -notmatch "WSL|Loopback|vEthernet"
        } |
        Select-Object -First 1
    if ($iface) { $localIP = $iface.IPAddress }
} catch { }

# ----------------------------------------------------------
# 6. Exibir URLs
# ----------------------------------------------------------
Write-Host ""
Write-Host "  =============================================" -ForegroundColor DarkCyan
Write-Host "   LINKS DE ACESSO" -ForegroundColor DarkCyan
Write-Host "  =============================================" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "   PC  (este computador)" -ForegroundColor DarkGray
Write-Host "   http://localhost:$PORT" -ForegroundColor White
Write-Host "   http://localhost:$PORT/dashboard" -ForegroundColor White
Write-Host ""

if ($localIP) {
    Write-Host "   Mobile  (mesma rede Wi-Fi)" -ForegroundColor DarkGray
    Write-Host "   http://${localIP}:${PORT}" -ForegroundColor Green
    Write-Host "   http://${localIP}:${PORT}/dashboard" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Aponte a camera do celular:" -ForegroundColor Yellow
    Write-Host ""
    $qrScript = Join-Path $ROOT "scripts\qr.js"
    if (Test-Path $qrScript) {
        node $qrScript "http://${localIP}:${PORT}"
    }
    Write-Host ""
} else {
    Write-Warn "IP da rede nao detectado (sem Wi-Fi?)."
    Write-Host ""
}

Write-Host "  =============================================" -ForegroundColor DarkGray
Write-Host "   Pressione Ctrl+C para parar o servidor" -ForegroundColor DarkGray
Write-Host "  =============================================" -ForegroundColor DarkGray
Write-Host ""

# Abre navegador apos o servidor subir
$job = Start-Job -ScriptBlock {
    param($p)
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:$p"
} -ArgumentList $PORT

# Inicia Next.js em 0.0.0.0 para aceitar conexoes da rede
Push-Location $ROOT
try {
    npx next dev --hostname 0.0.0.0 --port $PORT
} finally {
    Pop-Location
    Stop-Job  $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "  Servidor encerrado." -ForegroundColor DarkGray
    Write-Host ""
}
