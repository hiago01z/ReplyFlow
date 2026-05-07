# ============================================================
# ReplyFlow - Script de execucao local (PC + Mobile)
# Uso: .\dev.ps1   ou   clique duplo em dev.bat
# ============================================================

# Continue (nao Stop) para que o finally rode limpo no Ctrl+C
$ErrorActionPreference = "Continue"
$ROOT = $PSScriptRoot
$PORT = 3000

function Write-Step { param([string]$msg); Write-Host "`n  $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg); Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg); Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$msg); Write-Host "  [X]  $msg" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  =============================================" -ForegroundColor Magenta
Write-Host "   ReplyFlow  -  Ambiente de Desenvolvimento  " -ForegroundColor Magenta
Write-Host "  =============================================" -ForegroundColor Magenta

# ----------------------------------------------------------
# 1. Verificar Node.js
# ----------------------------------------------------------
Write-Step "Verificando Node.js..."
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Node.js nao encontrado. Instale em https://nodejs.org (v20+)"
    Read-Host "`n  Pressione ENTER para sair"
    exit 1
}
Write-OK "Node.js $($nodeVersion.ToString().Trim())"

# ----------------------------------------------------------
# 2. Verificar .env.local
# ----------------------------------------------------------
Write-Step "Verificando variaveis de ambiente..."
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
Write-Step "Verificando dependencias..."
$nextBin = Join-Path $ROOT "node_modules\next\dist\bin\next"
if (-not (Test-Path $nextBin)) {
    Write-Warn "Dependencias ausentes. Instalando (aguarde)..."
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
    Write-OK "Dependencias OK"
}

# ----------------------------------------------------------
# 4. Liberar porta
# ----------------------------------------------------------
Write-Step "Verificando porta $PORT..."

$portInUse = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Warn "Porta $PORT ja esta em uso."
    Write-Host "  Encerrar o processo? (S/N) " -NoNewline -ForegroundColor Yellow
    if ((Read-Host) -match "^[Ss]$") {
        $portInUse | ForEach-Object {
            $null = taskkill /F /T /PID $_.OwningProcess 2>$null
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Milliseconds 500
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
# 6. Exibir URLs + QR Code
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
    } else {
        Write-Warn "scripts\qr.js nao encontrado - rode: npm install qrcode-terminal --save-dev"
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

# ----------------------------------------------------------
# 7. Job paralelo: detecta PID do Next.js apos porta subir
# ----------------------------------------------------------
$pidDetectorJob = Start-Job -ScriptBlock {
    param([int]$port)
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conn) { return $conn[0].OwningProcess }
    }
    return $null
} -ArgumentList $PORT

# ----------------------------------------------------------
# 8. Job paralelo: abre navegador apos 5s
# ----------------------------------------------------------
$browserJob = Start-Job -ScriptBlock {
    param([int]$p)
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:$p"
} -ArgumentList $PORT

# ----------------------------------------------------------
# 9. Iniciar Next.js
#    Usa next.cmd (wrapper Windows do npm) em vez do script bash sem extensao
# ----------------------------------------------------------
Push-Location $ROOT
try {
    $nextCmd = Join-Path $ROOT "node_modules\.bin\next.cmd"
    & $nextCmd dev --hostname 0.0.0.0 --port $PORT

} finally {
    # Recuperar PID detectado pelo job paralelo
    $detectedPID = Receive-Job $pidDetectorJob -ErrorAction SilentlyContinue
    Stop-Job  $pidDetectorJob -ErrorAction SilentlyContinue
    Remove-Job $pidDetectorJob -ErrorAction SilentlyContinue

    # Matar arvore de processos do Next.js pelo PID registrado
    if ($detectedPID) {
        $null = taskkill /F /T /PID $detectedPID 2>$null
    }

    # Garantia extra: matar qualquer processo ainda na porta
    $leftOver = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
    if ($leftOver) {
        $leftOver | ForEach-Object {
            $null = taskkill /F /T /PID $_.OwningProcess 2>$null
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  Processos residuais na porta $PORT encerrados." -ForegroundColor DarkGray
    }

    # Limpar job do navegador
    Stop-Job  $browserJob -ErrorAction SilentlyContinue
    Remove-Job $browserJob -ErrorAction SilentlyContinue

    Pop-Location

    Write-Host ""
    Write-Host "  Servidor encerrado. Porta $PORT liberada." -ForegroundColor DarkGray
    Write-Host ""
}
