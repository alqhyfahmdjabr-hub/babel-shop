param(
  [string]$AvdName,
  [int]$AppiumPort = 4723,
  [string]$AppiumHost = "127.0.0.1"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path
}

function Get-AndroidSdkDir([string]$repoRoot) {
  $localProps = Join-Path $repoRoot "android\\local.properties"
  if (-not (Test-Path $localProps)) {
    throw "Android local.properties not found at: $localProps"
  }

  $match = Get-Content $localProps | Select-String -Pattern "^sdk\.dir=" | Select-Object -First 1
  if (-not $match) {
    throw "sdk.dir not found in: $localProps"
  }

  $raw = $match.Line -replace "^sdk\.dir=", ""

  # local.properties stores Windows paths with escaped backslashes and a '\:' after the drive letter.
  $sdkDir = $raw.Replace('\\', '\').Replace('\:', ':')
  return $sdkDir
}

function Get-ConnectedDeviceIds {
  $out = & adb devices
  return ($out | Select-String -Pattern "\\sdevice$") | ForEach-Object { ($_ -split "\\s+")[0] }
}

function Wait-ForBootCompleted([int]$timeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $boot = (& adb shell getprop sys.boot_completed 2>$null).Trim()
      if ($boot -eq "1") { return }
    } catch {
      # ignore transient adb issues while booting
    }
    Start-Sleep -Seconds 2
  }

  throw "Timed out waiting for Android to boot."
}

function Wait-ForPortOpen([string]$hostname, [int]$port, [int]$timeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $async = $client.BeginConnect($hostname, $port, $null, $null)
      if ($async.AsyncWaitHandle.WaitOne(500) -and $client.Connected) {
        $client.Close()
        return
      }
      $client.Close()
    } catch {
      # ignore until timeout
    }
    Start-Sleep -Milliseconds 300
  }

  throw "Timed out waiting for port $hostname`:$port to open."
}

$repoRoot = Get-RepoRoot
$sdkDir = Get-AndroidSdkDir -repoRoot $repoRoot

$env:ANDROID_SDK_ROOT = $sdkDir
$env:ANDROID_HOME = $sdkDir
$env:PATH = "$sdkDir\\platform-tools;$sdkDir\\emulator;$env:PATH"

Write-Host "Android SDK: $sdkDir"

# Ensure adb is usable.
& adb version | Out-Null

$devices = @(Get-ConnectedDeviceIds)
if ($devices.Count -eq 0) {
  if (-not $AvdName) {
    $avds = @(& emulator -list-avds)
    if ($avds.Count -ge 1) {
      $AvdName = $avds[0].Trim()
    }
  }

  if (-not $AvdName) {
    throw "No device connected and no AVD found. Create an emulator (AVD) in Android Studio, then re-run."
  }

  Write-Host "Starting emulator: $AvdName"
  $emulatorExe = Join-Path $sdkDir "emulator\\emulator.exe"
  Start-Process -FilePath $emulatorExe -ArgumentList @("-avd", $AvdName, "-no-snapshot-save") | Out-Null

  & adb wait-for-device | Out-Null
  Wait-ForBootCompleted -timeoutSeconds 300
}

Write-Host "Starting Appium server on $AppiumHost`:$AppiumPort"
$appium = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npx", "appium", "--port", $AppiumPort, "--base-path", "/") -WorkingDirectory $repoRoot -PassThru -WindowStyle Hidden

try {
  Wait-ForPortOpen -hostname $AppiumHost -port $AppiumPort -timeoutSeconds 30
  npm run e2e:android:smoke
} finally {
  if ($appium -and -not $appium.HasExited) {
    # Kill the spawned process tree (npx -> node -> appium).
    taskkill /PID $appium.Id /T /F | Out-Null
  }
}
