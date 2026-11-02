# KORbuild - configura um computador Windows novo para trabalhar no projeto (PowerShell, Git, Node, Python, pastas, testes).
#
# Uso, no PowerShell (nao precisa ser administrador):
#   powershell -ExecutionPolicy Bypass -File .\configurar-computador.ps1 -Nome "Seu Nome"
#   powershell -ExecutionPolicy Bypass -File .\configurar-computador.ps1 -SoVerificar     # so mostra o que falta, nao muda nada
#
# Opcoes: -Raiz 'C:\dev\korbuild'  -Email 'voce@exemplo.com'  -ComEntregas (clona tambem o KORbuildMatch com as entregas)
#         -ComVSCode  -SemClaudeCode
#
# Pode rodar de novo quantas vezes quiser: o que ja esta pronto e pulado.
# Nada aqui grava token, chave ou senha. Os segredos entram depois, pelo comando kor-segredos (entrada oculta).

[CmdletBinding()]
param(
  [string] $Raiz = 'C:\dev\korbuild',
  [string] $Nome = '',
  [string] $Email = 'nardaccicoach@gmail.com',
  [switch] $SoVerificar,
  [switch] $ComEntregas,
  [switch] $ComVSCode,
  [switch] $SemClaudeCode
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$UrlApp = 'https://github.com/Nardacci/korbuildtech.git'
$UrlEntregas = 'https://github.com/Nardacci/KORbuildMatch.git'
$RamoEntregas = 'claude/serene-fermi-7c9esl'
$App = Join-Path $Raiz 'korbuildtech'
$Entregas = Join-Path $Raiz 'KORbuildMatch'
$pendencias = New-Object System.Collections.Generic.List[string]

function Passo($t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }
function Ok($t) { Write-Host "  ok     $t" -ForegroundColor Green }
function Falta($t) { Write-Host "  falta  $t" -ForegroundColor Yellow; $script:pendencias.Add($t) }
function Erro($t) { Write-Host "  ERRO   $t" -ForegroundColor Red; $script:pendencias.Add("ERRO: $t") }
function Tem($comando) { return [bool](Get-Command $comando -ErrorAction SilentlyContinue) }
function Atualizar-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

# ---------- 1. Requisitos do Windows ----------
Passo 'Requisitos do Windows'
Atualizar-Path
if (-not (Tem 'winget')) {
  Erro 'winget nao encontrado. Atualize o "Instalador de Aplicativo" na Microsoft Store e rode de novo.'
  exit 2
}
Ok 'winget disponivel'
$politica = Get-ExecutionPolicy -Scope CurrentUser
if ($politica -in @('Restricted', 'Undefined', 'AllSigned')) {
  if ($SoVerificar) { Falta "politica de scripts do usuario esta '$politica' (o certo: RemoteSigned)" }
  else { Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force; Ok 'politica de scripts do usuario: RemoteSigned' }
} else { Ok "politica de scripts do usuario: $politica" }
if ($env:OneDrive -and $Raiz.StartsWith($env:OneDrive, [StringComparison]::OrdinalIgnoreCase)) {
  Write-Host '  aviso  a pasta esta dentro do OneDrive: o OneDrive sincroniza node_modules e atrapalha. Prefira C:\dev\korbuild.' -ForegroundColor Yellow
}

# ---------- 2. Programas ----------
Passo 'Programas (winget)'
function Instalar($id, $rotulo, $comando) {
  Atualizar-Path
  if (Tem $comando) { Ok "$rotulo ja instalado"; return }
  if ($SoVerificar) { Falta "$rotulo (winget install --id $id -e)"; return }
  Write-Host "  instalando $rotulo ..." -ForegroundColor Gray
  & winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements
  Atualizar-Path
  if (Tem $comando) { Ok "$rotulo instalado" } else { Erro "$rotulo instalado, mas ainda nao aparece no PATH: feche e abra o PowerShell e rode este script de novo" }
}
Instalar 'Git.Git' 'Git for Windows' 'git'
Instalar 'OpenJS.NodeJS.LTS' 'Node.js LTS' 'node'
Instalar 'Python.Python.3.12' 'Python 3 (servidor local dos testes)' 'py'
Instalar 'Microsoft.PowerShell' 'PowerShell 7' 'pwsh'
if ($ComVSCode) { Instalar 'Microsoft.VisualStudioCode' 'Visual Studio Code' 'code' }
if (Tem 'node') {
  $maior = [int]((& node -v) -replace '^v', '').Split('.')[0]
  if ($maior -ge 20) { Ok "Node $maior (o projeto pede 20 ou mais novo)" } else { Erro "Node $maior e antigo demais: rode 'winget upgrade --id OpenJS.NodeJS.LTS'" }
}

# ---------- 3. Git ----------
Passo 'Git (identidade e ajustes)'
function Cfg-Git($chave, $valor) {
  $atual = ''
  try { $atual = [string](& git config --global --get $chave) } catch { $atual = '' }
  if ($atual -eq $valor) { Ok "git $chave = $valor"; return }
  if ($SoVerificar) { Falta "git $chave (agora: '$atual'; esperado: '$valor')"; return }
  & git config --global $chave $valor
  Ok "git $chave = $valor"
}
if (Tem 'git') {
  if (-not $Nome) { try { $Nome = [string](& git config --global --get user.name) } catch { $Nome = '' } }
  if (-not $Nome -and -not $SoVerificar) { $Nome = Read-Host 'Seu nome para assinar os commits' }
  if ($Nome) { Cfg-Git 'user.name' $Nome } else { Falta 'git user.name (rode com -Nome "Seu Nome")' }
  Cfg-Git 'user.email' $Email
  Cfg-Git 'init.defaultBranch' 'main'
  Cfg-Git 'pull.rebase' 'false'          # o projeto nao reescreve historico: git pull faz merge
  Cfg-Git 'core.longpaths' 'true'        # o Windows limita caminhos longos; node_modules e relatorios passam disso
  Cfg-Git 'core.quotepath' 'false'       # nomes de arquivo com acento aparecem normais
} else { Falta 'Git ainda nao esta no PATH: feche e abra o PowerShell e rode de novo' }

# ---------- 4. Pastas e repositorios ----------
Passo "Pastas e repositorios em $Raiz"
if (-not (Test-Path $Raiz)) {
  if ($SoVerificar) { Falta "criar a pasta $Raiz" } else { New-Item -ItemType Directory -Force -Path $Raiz | Out-Null; Ok "pasta $Raiz criada" }
} else { Ok "pasta $Raiz existe" }
function Clonar($url, $destino, $ramo) {
  if (Test-Path (Join-Path $destino '.git')) {
    $sujo = [string](& git -C $destino status --porcelain)
    Ok "$destino ja e um repositorio"
    if ($sujo.Trim()) { Write-Host '         tem alteracoes locais: nao vou atualizar' -ForegroundColor Yellow; return }
    if (-not $SoVerificar) {
      & git -C $destino pull --no-rebase origin $(if ($ramo) { $ramo } else { 'main' })
      if ($LASTEXITCODE -eq 0) { Ok '         atualizado (pull)' } else { Erro "pull falhou em $destino" }
    }
    return
  }
  if ($SoVerificar) { Falta "clonar $url em $destino"; return }
  if (-not (Tem 'git')) { Erro "sem Git, nao da para clonar $url"; return }
  Write-Host "  clonando $url ... (na primeira vez abre o navegador para entrar no GitHub)" -ForegroundColor Gray
  $a = @('clone')
  if ($ramo) { $a += @('--branch', $ramo) }
  $a += @($url, $destino)
  & git @a
  if ($LASTEXITCODE -eq 0) { Ok "clonado em $destino" } else { Erro "clone falhou: $url (confira o login no GitHub)" }
}
Clonar $UrlApp $App ''
if ($ComEntregas) { Clonar $UrlEntregas $Entregas $RamoEntregas }

# ---------- 5. Dependencias de teste ----------
Passo 'Dependencias de teste (Playwright)'
if ((Test-Path $App) -and (Tem 'node')) {
  Push-Location $App
  try {
    & node -e "import('playwright').then(()=>process.exit(0),()=>process.exit(1))" 2>$null
    if ($LASTEXITCODE -eq 0) { Ok 'Playwright instalado nesta pasta' }
    elseif ($SoVerificar) { Falta 'Playwright (npm install --no-save playwright@1.56.1 ; npx playwright install chromium)' }
    else {
      & npm install --no-save playwright@1.56.1
      & npx --yes playwright install chromium
      & node -e "import('playwright').then(()=>process.exit(0),()=>process.exit(1))" 2>$null
      if ($LASTEXITCODE -eq 0) { Ok 'Playwright e o Chromium instalados' } else { Erro 'Playwright nao ficou utilizavel; veja a saida acima' }
    }
  } finally { Pop-Location }
} else { Falta 'Playwright: depende da pasta do projeto e do Node' }

# ---------- 6. Claude Code ----------
if (-not $SemClaudeCode) {
  Passo 'Claude Code'
  if (Tem 'claude') { Ok 'claude ja instalado' }
  elseif ($SoVerificar) { Falta 'Claude Code (npm install -g @anthropic-ai/claude-code)' }
  elseif (Tem 'npm') {
    & npm install -g @anthropic-ai/claude-code
    Atualizar-Path
    if (Tem 'claude') { Ok 'claude instalado (rode "claude" dentro da pasta do projeto e entre com a sua conta)' } else { Erro 'claude nao apareceu no PATH: feche e abra o PowerShell' }
  } else { Falta 'Claude Code: depende do Node/npm' }
}

# ---------- 7. Perfil do PowerShell ----------
Passo 'Perfil do PowerShell (atalhos kor, kor-servir, kor-segredos)'
$bloco = @'
# >>> KORbuild >>>
$env:KOR_HOME = '__RAIZ__'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
function kor { Set-Location (Join-Path $env:KOR_HOME 'korbuildtech'); git status -sb }
function kor-entregas { Set-Location (Join-Path $env:KOR_HOME 'KORbuildMatch'); git status -sb }
function kor-servir {
  param([int] $Porta = 8123)
  $py = @('py', 'python3', 'python') | Where-Object { Get-Command $_ -ErrorAction SilentlyContinue } | Select-Object -First 1
  Set-Location (Join-Path $env:KOR_HOME 'korbuildtech')
  Write-Host "http://localhost:$Porta/   (Ctrl+C para parar)"
  & $py -m http.server $Porta
}
# Pede o token do Supabase e a senha da massa com entrada oculta. Nunca imprime o valor: so "definida / nao definida".
# Sem -Persistir, valem so nesta janela. Com -Persistir, ficam nas variaveis de ambiente do seu usuario do Windows.
function kor-segredos {
  param([switch] $Persistir)
  foreach ($n in @('SUPABASE_ACCESS_TOKEN', 'KOR_DEMO_SENHA')) {
    $s = Read-Host "$n (Enter mantem o atual)" -AsSecureString
    $p = [Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode($s)
    try { $v = [Runtime.InteropServices.Marshal]::PtrToStringUni($p) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeGlobalAllocUnicode($p) }
    if ($v) {
      Set-Item -Path "Env:$n" -Value $v
      if ($Persistir) { [Environment]::SetEnvironmentVariable($n, $v, 'User') }
    }
    $v = $null
  }
  foreach ($n in @('SUPABASE_ACCESS_TOKEN', 'KOR_DEMO_SENHA')) { Write-Host ($n + ': ' + $(if (Test-Path "Env:$n") { 'definida' } else { 'nao definida' })) }
}
# <<< KORbuild <<<
'@
$bloco = $bloco.Replace('__RAIZ__', $Raiz)
$docs = [Environment]::GetFolderPath('MyDocuments')
$perfis = @((Join-Path $docs 'PowerShell\Microsoft.PowerShell_profile.ps1'), (Join-Path $docs 'WindowsPowerShell\Microsoft.PowerShell_profile.ps1'))
foreach ($perfil in $perfis) {
  $existe = (Test-Path $perfil) -and (Select-String -Path $perfil -Pattern '>>> KORbuild >>>' -Quiet)
  if ($SoVerificar) { if ($existe) { Ok "atalhos em $perfil" } else { Falta "atalhos no perfil $perfil" }; continue }
  $dir = Split-Path -Parent $perfil
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $atual = if (Test-Path $perfil) { [string](Get-Content -Raw -Encoding UTF8 $perfil) } else { '' }
  $sem = [regex]::Replace($atual, '(?s)# >>> KORbuild >>>.*?# <<< KORbuild <<<\r?\n?', '')
  Set-Content -Encoding UTF8 -Path $perfil -Value ($sem.TrimEnd() + "`r`n`r`n" + $bloco + "`r`n")
  Ok "atalhos gravados em $perfil"
}

# ---------- 8. Conferencia ----------
Passo 'Conferencia'
function Versao($rotulo, $comando, $args1) {
  if (Tem $comando) { $v = (& $comando $args1 2>&1 | Select-Object -First 1); Write-Host ("  {0,-12} {1}" -f $rotulo, $v) -ForegroundColor Gray }
  else { Write-Host ("  {0,-12} nao encontrado" -f $rotulo) -ForegroundColor Yellow }
}
Versao 'git' 'git' '--version'
Versao 'node' 'node' '-v'
Versao 'npm' 'npm' '-v'
Versao 'python' 'py' '--version'
Versao 'pwsh' 'pwsh' '--version'
if (Test-Path (Join-Path $App '.git')) {
  Write-Host ('  projeto      ' + [string](& git -C $App log -1 --format='%h %s' 2>$null)) -ForegroundColor Gray
  Write-Host ('  ramo         ' + [string](& git -C $App branch --show-current 2>$null)) -ForegroundColor Gray
}
foreach ($n in @('SUPABASE_ACCESS_TOKEN', 'KOR_DEMO_SENHA')) {
  $estado = if ([Environment]::GetEnvironmentVariable($n, 'User') -or (Test-Path "Env:$n")) { 'definida' } else { 'nao definida' }
  Write-Host ("  {0,-22} {1}" -f $n, $estado) -ForegroundColor Gray
}
if ((-not $SoVerificar) -and (Test-Path $App) -and (Tem 'node')) {
  Push-Location $App
  try {
    Write-Host '  teste rapido (sem navegador):' -ForegroundColor Gray
    & node tests/imperial.test.mjs 2>&1 | Select-Object -Last 1 | ForEach-Object { Write-Host "    imperial   $_" -ForegroundColor Gray }
    & node tests/formulas.test.mjs 2>&1 | Select-Object -Last 1 | ForEach-Object { Write-Host "    formulas   $_" -ForegroundColor Gray }
  } finally { Pop-Location }
}

Write-Host ''
if ($pendencias.Count) {
  Write-Host "$($pendencias.Count) ponto(s) pendente(s):" -ForegroundColor Yellow
  $pendencias | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
} else { Write-Host 'Tudo pronto.' -ForegroundColor Green }
Write-Host ''
Write-Host 'Falta so o que e seu:' -ForegroundColor Cyan
Write-Host '  1. Feche e abra o PowerShell (carrega o PATH e os atalhos).'
Write-Host '  2. Digite kor-segredos e informe o token do Supabase e a senha da massa (entrada oculta).'
Write-Host '  3. Digite kor e depois .\tools\testar.ps1 -Parte prototipo para a primeira rodada de testes.'
exit $(if ($pendencias.Count) { 1 } else { 0 })
