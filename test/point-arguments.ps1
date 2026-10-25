# Test actual argument dispatch without UIA, clipboard or physical input.
$ErrorActionPreference = 'Stop'
$tokens = $null; $errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot '../scripts/windows-uia.ps1'), [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw 'Backend source did not parse.' }
foreach ($name in @('Get-Prop', 'Get-PointFromArgs')) {
  $fn = $ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name}, $true)
  if ($null -eq $fn) { throw "Missing function: $name" }
  Invoke-Expression $fn.Extent.Text
}
$script:Resolved = @()
function Resolve-Element {
  param($ElementId, $InputObject)
  $script:Resolved += $ElementId
  if ($ElementId -eq 'stale') { throw 'STALE_ELEMENT' }
  return @{Current = @{BoundingRectangle = @{centerX = 31; centerY = 47}}}
}
function Invoke-Safe { param([scriptblock]$Body, $Fallback) try { & $Body } catch { $Fallback } }
function Convert-Rect { param($Rect) return $Rect }
function Expect-Error { param([scriptblock]$Body, [string]$Message)
  try { & $Body } catch { if ($_.Exception.Message -ne $Message) { throw }; return }
  throw "Expected error: $Message"
}
foreach ($argsObject in @(@{x=0;y=-12}, @{elementId=$null;x=0;y=-12}, @{elementId='';x=0;y=-12}, @{elementId=" `t`r`n";x=0;y=-12})) {
  $point = Get-PointFromArgs $argsObject
  if ($point.x -ne 0 -or $point.y -ne -12 -or $null -ne $point.elementId) { throw 'Coordinate dispatch changed.' }
}
if ($script:Resolved.Count -ne 0) { throw 'Blank ID attempted UIA resolution.' }
foreach ($argsObject in @(@{}, @{elementId=''}, @{elementId=' ';x=1}, @{y=2})) {
  Expect-Error { Get-PointFromArgs $argsObject } 'Provide either elementId or x and y.'
}
$point = Get-PointFromArgs @{elementId='valid';x=999;y=999}
if ($point.x -ne 31 -or $point.y -ne 47 -or $point.elementId -ne 'valid') { throw 'Nonblank element ID must take precedence.' }
Expect-Error { Get-PointFromArgs @{elementId='stale';x=1;y=2} } 'STALE_ELEMENT'
Write-Output 'PASS omitted/null/empty/whitespace IDs, zero/negative coordinates, missing coordinates, ID precedence and stale-ID safety; no physical input'
