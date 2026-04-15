# Synkrypt CLI Installer for Windows
# Usage: irm https://synkrypt.abhilaksharora.com/install.ps1 | iex

$ErrorActionPreference = 'Stop'

Write-Host "  ____              _                      _   " -ForegroundColor Blue
Write-Host " / ___| _   _ _ __ | | ___ __ _   _ _ __  | |_ " -ForegroundColor Blue
Write-Host " \___ \| | | | '_ \| |/ / '__| | | | '_ \ | __|" -ForegroundColor Blue
Write-Host "  ___) | |_| | | | |   <| |  | |_| | |_) || |_ " -ForegroundColor Blue
Write-Host " |____/ \__, |_| |_|_|\_\_|   \__, | .__/  \__|" -ForegroundColor Blue
Write-Host "        |___/                 |___/|_|         " -ForegroundColor Blue
Write-Host "  The Zero-Trust Secrets Manager`n" -ForegroundColor Blue

# 1. Detection
$arch = $env:PROCESSOR_ARCHITECTURE.ToLower()
if ($arch -eq "amd64") {
    $archName = "x64"
} elseif ($arch -eq "arm64") {
    $archName = "arm64"
} else {
    Write-Error "Unsupported architecture: $arch"
}

$zipName = "synkrypt-windows-$archName.zip"
$downloadUrl = "https://github.com/abhilaksh-arora/synkrypt/releases/latest/download/$zipName"

# 2. Preparation
$installDir = Join-Path $HOME ".synkrypt"
$binDir = Join-Path $installDir "bin"
$tempZip = Join-Path $env:TEMP $zipName

if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Force -Path $binDir | Out-Null
}

Write-Host "Downloading Synkrypt for Windows ($archName)..."
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing
} catch {
    Write-Error "Failed to download $zipName from GitHub. The binary might not be released yet."
}

# 3. Extraction
Write-Host "Extracting to $binDir..."
Expand-Archive -Path $tempZip -DestinationPath $binDir -Force
Remove-Item $tempZip

# 4. PATH Configuration
Write-Host "Configuring PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$binDir*") {
    $newPath = "$currentPath;$binDir"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    $env:Path = "$env:Path;$binDir"
    Write-Host "Added $binDir to User PATH." -ForegroundColor Green
} else {
    Write-Host "$binDir is already in PATH." -ForegroundColor Gray
}

# 5. Finalize
Write-Host "`nSynkrypt CLI installed successfully!" -ForegroundColor Green
Write-Host "Restart your terminal or run 'refreshenv' (if using Chocolatey) to start using 'synkrypt'."
Write-Host "Try it out: synkrypt --help`n" -ForegroundColor Blue
