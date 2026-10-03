$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$iconRoot = Join-Path $PSScriptRoot '..\android\app\src\main\res'
$logoPath = Join-Path $PSScriptRoot '..\public\mydesk-icon.png'
$logo = [System.Drawing.Image]::FromFile([System.IO.Path]::GetFullPath($logoPath))
try {
    $densities = @(@('mdpi',48,108),@('hdpi',72,162),@('xhdpi',96,216),@('xxhdpi',144,324),@('xxxhdpi',192,432))
    foreach ($density in $densities) {
        foreach ($name in @('ic_launcher','ic_launcher_round','ic_launcher_foreground')) {
            $size = if ($name -eq 'ic_launcher_foreground') { [int]$density[2] } else { [int]$density[1] }
            $bitmap = [System.Drawing.Bitmap]::new($size,$size)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.Clear([System.Drawing.Color]::FromArgb(248,247,243))
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $drawSize = if ($name -eq 'ic_launcher_foreground') { [int]($size * 0.66) } else { $size }
                $offset = [int](($size - $drawSize) / 2)
                $graphics.DrawImage($logo,$offset,$offset,$drawSize,$drawSize)
                $target = Join-Path $iconRoot ('mipmap-' + $density[0] + '\' + $name + '.png')
                $bitmap.Save([System.IO.Path]::GetFullPath($target),[System.Drawing.Imaging.ImageFormat]::Png)
            } finally { $graphics.Dispose(); $bitmap.Dispose() }
        }
    }
} finally { $logo.Dispose() }
Write-Output 'Prepared Android launcher assets from the supplied MyDesk logo.'
