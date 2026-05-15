$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 4173
$Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)

$ContentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".mjs" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg" = "image/svg+xml; charset=utf-8"
  ".md" = "text/markdown; charset=utf-8"
}

function Get-LocalIpAddress {
  try {
    $addresses = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName())
    foreach ($address in $addresses) {
      if ($address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and -not $address.ToString().StartsWith("127.")) {
        return $address.ToString()
      }
    }
  } catch {}
  return $null
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Status,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body
  )

  $Header = "HTTP/1.1 $Status $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

$Listener.Start()
$LocalIp = Get-LocalIpAddress
Write-Host ""
Write-Host "Training Log is running."
Write-Host "PC URL:     http://localhost:$Port"
if ($LocalIp) {
  Write-Host "Phone URL:  http://${LocalIp}:$Port"
}
Write-Host ""
Write-Host "Keep this window open while using the app."
Write-Host "Press Ctrl+C to stop."
Write-Host ""

while ($true) {
  $Client = $Listener.AcceptTcpClient()
  try {
    $Stream = $Client.GetStream()
    $Buffer = New-Object byte[] 8192
    $Read = $Stream.Read($Buffer, 0, $Buffer.Length)
    if ($Read -le 0) { continue }

    $RequestText = [System.Text.Encoding]::ASCII.GetString($Buffer, 0, $Read)
    $FirstLine = ($RequestText -split "`r`n")[0]
    $Parts = $FirstLine -split " "
    $Path = if ($Parts.Length -ge 2) { $Parts[1] } else { "/" }
    $Path = [System.Uri]::UnescapeDataString(($Path -split "\?")[0])
    if ($Path -eq "/") { $Path = "/index.html" }

    $RelativePath = $Path.TrimStart("/") -replace "/", [System.IO.Path]::DirectorySeparatorChar
    $FilePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $RelativePath))

    if (-not $FilePath.StartsWith($Root) -or -not [System.IO.File]::Exists($FilePath)) {
      $Body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      Send-Response $Stream 404 "Not Found" "text/plain; charset=utf-8" $Body
      continue
    }

    $Extension = [System.IO.Path]::GetExtension($FilePath)
    $ContentType = if ($ContentTypes.ContainsKey($Extension)) { $ContentTypes[$Extension] } else { "application/octet-stream" }
    $Body = [System.IO.File]::ReadAllBytes($FilePath)
    Send-Response $Stream 200 "OK" $ContentType $Body
  } catch {
    try {
      $Body = [System.Text.Encoding]::UTF8.GetBytes("Server error")
      Send-Response $Stream 500 "Internal Server Error" "text/plain; charset=utf-8" $Body
    } catch {}
  } finally {
    $Client.Close()
  }
}
