# ============================================================
# ReplyFlow — Script de execução local (PC + Mobile)
# Uso: .\dev.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$PORT = 3000

function Write-Step([string]$msg) {
    Write-Host "`n  $msg" -ForegroundColor Cyan
}
function Write-OK([string]$msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}
function Write-Warn([string]$msg) {
    Write-Host "  [!]  $msg" -ForegroundColor Yellow
}
function Write-Err([string]$msg) {
    Write-Host "  [X]  $msg" -ForegroundColor Red
}

Clear-Host
Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Magenta
Write-Host "   *** ReplyFlow  ***  Ambiente de Desenvolvimento Local" -ForegroundColor Magenta
Write-Host "  ============================================================" -ForegroundColor Magenta

# ----------------------------------------------------------
# 1. Verificar Node.js
# ----------------------------------------------------------
Write-Step "Verificando Node.js..."
try {
    $nodeVersion = (node --version 2>&1).ToString().Trim()
    if ($LASTEXITCODE -ne 0) { throw }
    Write-OK "Node.js $nodeVersion"
} catch {
    Write-Err "Node.js nao encontrado. Instale em https://nodejs.org (v20+)"
    exit 1
}

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
        Write-Warn "IMPORTANTE: Preencha as variaveis em .env.local antes de continuar."
        Write-Host ""
        Write-Host "  Abrir .env.local para editar? (S/N) " -NoNewline -ForegroundColor Yellow
        $r = Read-Host
        if ($r -match "^[Ss]$") { Start-Process notepad $envFile }
        Write-Host "  Pressione ENTER quando .env.local estiver preenchido..." -ForegroundColor Yellow
        Read-Host | Out-Null
    } else {
        Write-Err ".env.example nao encontrado."
        exit 1
    }
} else {
    $envContent = Get-Content $envFile -Raw
    $missing = @("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY",
                 "SUPABASE_SERVICE_ROLE_KEY","OPENAI_API_KEY","STRIPE_SECRET_KEY") |
               Where-Object { $envContent -notmatch "$_=\S" }

    if ($missing.Count -gt 0) {
        Write-Warn "Variaveis nao preenchidas:"
        $missing | ForEach-Object { Write-Host "       - $_" -ForegroundColor Yellow }
    } else {
        Write-OK ".env.local configurado"
    }
}

# ----------------------------------------------------------
# 3. Instalar dependencias
# ----------------------------------------------------------
Write-Step "Verificando dependencias..."
if (-not (Test-Path (Join-Path $ROOT "node_modules"))) {
    Write-Warn "Instalando dependencias (aguarde)..."
    Push-Location $ROOT
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Err "Falha no npm install."; Pop-Location; exit 1 }
    Pop-Location
    Write-OK "Dependencias instaladas"
} else {
    Write-OK "node_modules ja existe"
}

# ----------------------------------------------------------
# 4. Liberar porta
# ----------------------------------------------------------
Write-Step "Verificando porta $PORT..."
$portInUse = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Warn "Porta $PORT em uso."
    Write-Host "  Matar processo? (S/N) " -NoNewline -ForegroundColor Yellow
    if ((Read-Host) -match "^[Ss]$") {
        $portInUse | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Write-OK "Processo encerrado"
    }
} else {
    Write-OK "Porta $PORT disponivel"
}

# ----------------------------------------------------------
# 5. Detectar IP da rede local (para acesso mobile)
# ----------------------------------------------------------
$localIP = $null
try {
    # Pega o IP da interface ativa conectada a uma rede (ignora loopback/VPN/WSL)
    $iface = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
             Where-Object {
                 $_.IPAddress -notmatch "^127\." -and
                 $_.IPAddress -notmatch "^169\.254\." -and
                 $_.PrefixOrigin -in @("Dhcp","Manual") -and
                 $_.InterfaceAlias -notmatch "WSL|Loopback|vEthernet"
             } |
             Sort-Object -Property { [int]($_.IPAddress -split '\.')[2] } |
             Select-Object -First 1

    if ($iface) { $localIP = $iface.IPAddress }
} catch { }

# ----------------------------------------------------------
# 6. Exibir URLs e iniciar servidor
# ----------------------------------------------------------
Write-Host ""
Write-Host "  ============================================================" -ForegroundColor DarkCyan
Write-Host "   SERVIDOR PRONTO — acesse nos links abaixo:" -ForegroundColor DarkCyan
Write-Host "  ============================================================" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "   PC (localhost)" -ForegroundColor DarkGray
Write-Host "   http://localhost:$PORT" -ForegroundColor White
Write-Host "   http://localhost:$PORT/dashboard" -ForegroundColor White
Write-Host ""

if ($localIP) {
    Write-Host "   Mobile / outros dispositivos na rede Wi-Fi" -ForegroundColor DarkGray
    Write-Host "   http://${localIP}:${PORT}" -ForegroundColor Green
    Write-Host "   http://${localIP}:${PORT}/dashboard" -ForegroundColor Green
    Write-Host ""
    Write-Host "   >>> Aponte a camera do celular para o QR Code abaixo <<<" -ForegroundColor Yellow
    Write-Host ""

    $mobileURL = "http://${localIP}:${PORT}"

    # Gera QR Code no terminal via qrcode-terminal (devDependency)
    $qrNode = @"
try {
  const qr = require('./node_modules/qrcode-terminal');
  qr.generate('$mobileURL', { small: true });
} catch(e) {
  process.stdout.write('\n  (instale qrcode-terminal para exibir o QR: npm i -D qrcode-terminal)\n');
}
"@
    node -e $qrNode
} else {
    Write-Warn "IP da rede nao detectado (Wi-Fi desconectado?)"
    Write-Warn "Conecte ao Wi-Fi e reinicie o script para ver o link mobile."
    Write-Host ""
}

Write-Host "  ============================================================" -ForegroundColor DarkGray
Write-Host "   Ctrl+C para parar o servidor" -ForegroundColor DarkGray
Write-Host "  ============================================================" -ForegroundColor DarkGray
Write-Host ""

# Abre navegador após o servidor subir
$job = Start-Job -ScriptBlock {
    param($port)
    Start-Sleep -Seconds 4
    Start-Process "http://localhost:$port"
} -ArgumentList $PORT

# Inicia Next.js com hostname 0.0.0.0 para aceitar conexoes da rede local
Push-Location $ROOT
try {
    npx next dev --hostname 0.0.0.0 --port $PORT
} finally {
    Pop-Location
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "  Servidor encerrado." -ForegroundColor DarkGray
    Write-Host ""
}
