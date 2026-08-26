Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Keys {
  [DllImport("user32.dll")]
  public static extern short GetAsyncKeyState(int key);
}
"@

$wasDown = New-Object bool[] 256
$leftWasDown = $false
while ($true) {
  $leftDown = ([Keys]::GetAsyncKeyState(1) -band 0x8000) -ne 0
  if ($leftWasDown -and -not $leftDown) {
    [Console]::Out.WriteLine("mouse-up")
    [Console]::Out.Flush()
  }
  $leftWasDown = $leftDown
  $activity = $false
  for ($keyCode = 8; $keyCode -le 254; $keyCode++) {
    $down = ([Keys]::GetAsyncKeyState($keyCode) -band 0x8000) -ne 0
    if ($down -and -not $wasDown[$keyCode]) { $activity = $true }
    $wasDown[$keyCode] = $down
  }
  if ($activity) { [Console]::Out.WriteLine("activity"); [Console]::Out.Flush() }
  Start-Sleep -Milliseconds 45
}
