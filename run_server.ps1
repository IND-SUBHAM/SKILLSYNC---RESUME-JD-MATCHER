# PowerShell launcher for SkillSync Server
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "          Starting SkillSync Server" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$pyCandidates = @(
    "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "python",
    "py"
)

$pyBin = $null
foreach ($candidate in $pyCandidates) {
    if (Test-Path $candidate) {
        $pyBin = $candidate
        break
    }
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        $pyBin = $candidate
        break
    }
}

if (-not $pyBin) {
    Write-Host "[ERROR] Could not find Python executable on this system." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[*] Python executable: $pyBin" -ForegroundColor Green
Write-Host "[*] Backend server running at http://127.0.0.1:5000" -ForegroundColor Green
Write-Host "[*] Launching browser..." -ForegroundColor Yellow

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://127.0.0.1:5000"
} | Out-Null

& $pyBin server.py

