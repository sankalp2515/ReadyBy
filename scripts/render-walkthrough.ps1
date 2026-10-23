param([string]$MediaDirectory='docs/evidence/walkthrough',[string]$OutputName='readyby-local-walkthrough')
$ErrorActionPreference = 'Stop'
$readyRoot = Split-Path -Parent $PSScriptRoot
$readyMedia = Join-Path $readyRoot $MediaDirectory
$readyManifest = Get-Content -Raw -LiteralPath (Join-Path $readyMedia 'manifest.json') | ConvertFrom-Json
Add-Type -AssemblyName System.Speech
$readyNarrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
$readyNarrator.SelectVoice('Microsoft Zira Desktop')
$readyNarrator.Rate = 1
try {
  for ($readyIndex = 0; $readyIndex -lt $readyManifest.Count; $readyIndex++) {
    $readyClip = $readyManifest[$readyIndex]
    $readyAudio = Join-Path $readyMedia ('voice-{0:D2}.wav' -f $readyIndex)
    $readyNarrator.SetOutputToWaveFile($readyAudio)
    $readyNarrator.Speak($readyClip.narration)
    $readyNarrator.SetOutputToNull()
  }
} finally { $readyNarrator.Dispose() }
Push-Location $readyRoot
try { python scripts/render-walkthrough.py --media $MediaDirectory --output-name $OutputName } finally { Pop-Location }
