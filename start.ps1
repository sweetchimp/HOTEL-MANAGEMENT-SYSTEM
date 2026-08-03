# ============================================================
# ALTONSHOTEL one-command launcher (Windows PowerShell)
# Usage:  .\start.ps1
# Starts: Docker Oracle container -> API (:8889) + frontend (:5173)
# Data persists in the Docker Oracle database across restarts.
# ============================================================

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$dbg = $false

function Test-Port($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

# --- 1. Docker + Oracle container ---------------------------------
$dockerOk = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
if (-not $dockerOk) {
  Write-Host "Docker not found. Please start Docker Desktop, wait for it to be ready, then rerun this script." -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

$container = docker ps -a --filter "name=^oracle-xe$" --format "{{.Names}}"
if (-not $container) {
  Write-Host "The 'oracle-xe' container does not exist." -ForegroundColor Red
  Write-Host "Ask the developer to create it (image: container-registry.oracle.com/database/express:latest, XEPDB1)."
  Read-Host "Press Enter to exit"
  exit 1
}

$status = docker ps --filter "name=^oracle-xe$" --format "{{.Status}}"
if (-not $status) {
  Write-Host "Starting Oracle container (this can take 1-2 minutes)..." -ForegroundColor Yellow
  docker start oracle-xe | Out-Null
  $deadline = (Get-Date).AddMinutes(3)
  do {
    Start-Sleep -Seconds 5
    $status = docker ps --filter "name=^oracle-xe$" --format "{{.Status}}"
  } while (-not ($status -match 'healthy') -and (Get-Date) -lt $deadline)
  if (-not ($status -match 'healthy')) {
    Write-Host "Oracle container did not become healthy. Check Docker Desktop." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
  }
  Write-Host "Oracle container is ready." -ForegroundColor Green
} else {
  Write-Host "Oracle container already running: $status" -ForegroundColor Green
}

# --- 2. Skip if already running ------------------------------------
if ((Test-Port 8889) -and (Test-Port 5173)) {
  Write-Host "The system is ALREADY running:" -ForegroundColor Green
  Write-Host "  Frontend: http://localhost:5173"
  Write-Host "  API:      http://localhost:8889/api"
  Read-Host "Press Enter to exit"
  exit 0
}

# --- 3. Launch API + frontend --------------------------------------
Write-Host "Starting API (:8889) and frontend (:5173)..." -ForegroundColor Yellow
npm run dev
