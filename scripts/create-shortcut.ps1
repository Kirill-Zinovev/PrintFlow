param([Parameter(Mandatory=$true)][string]$ProjectRoot)

$launcher=(Get-ChildItem -LiteralPath $ProjectRoot -Filter '*PrintFlow.bat' -File | Select-Object -First 1).FullName
if(-not $launcher){throw 'Launcher file was not found'}
$icon=Join-Path $ProjectRoot 'printflow.ico'
$desktop=[Environment]::GetFolderPath('Desktop')
$shortcutPath=Join-Path $desktop 'PrintFlow.lnk'
$shell=New-Object -ComObject WScript.Shell
$shortcut=$shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath=$launcher
$shortcut.WorkingDirectory=$ProjectRoot
$shortcut.IconLocation="$icon,0"
$shortcut.Description='Launch PrintFlow'
$shortcut.Save()
Write-Output "Ярлык PrintFlow создан: $shortcutPath"
