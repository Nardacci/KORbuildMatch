# Configurar o computador novo (Windows) para o KORbuild

Premissa: Windows 10 ou 11, com winget (vem no "Instalador de Aplicativo" da Microsoft Store) e a conta GitHub `Nardacci`. O script não precisa de administrador e pode rodar quantas vezes você quiser: o que já está pronto é pulado.

## Estrutura de pastas

```
C:\dev\korbuild\
  korbuildtech\      o app (branch main): código, testes, tools, docs, supabase\migrations
  KORbuildMatch\     opcional (-ComEntregas): as entregas das sessões em nuvem, para ler no computador
```

Evite criar dentro do OneDrive ou de Documentos: o OneDrive sincroniza `node_modules` e atrapalha. A pasta `korbuildtech\producao\` (o que sobe para a Hostinger) e `.testes\` (relatórios de teste) são geradas dentro do projeto e já estão no `.gitignore`.

## Passo a passo

1. **Trazer o script.** Abra `entregas/computador-novo/configurar-computador.ps1` no GitHub (repositório `KORbuildMatch`, branch `claude/serene-fermi-7c9esl`), clique em *Raw* e salve em `C:\dev\configurar-computador.ps1`. Se preferir, copie o texto e salve com esse nome.
2. **Rodar.** No PowerShell:
   ```powershell
   cd C:\dev
   powershell -ExecutionPolicy Bypass -File .\configurar-computador.ps1 -Nome "Seu Nome" -ComEntregas
   ```
   Para só ver o que falta, sem mudar nada, acrescente `-SoVerificar`.
3. **Entrar no GitHub.** No primeiro clone abre o navegador (Git Credential Manager). Entre e autorize. Não é preciso digitar token do GitHub.
4. **Fechar e abrir o PowerShell.** Carrega o PATH novo e os atalhos.
5. **Informar os segredos.** Digite `kor-segredos`. Ele pede, com entrada oculta, o `SUPABASE_ACCESS_TOKEN` e o `KOR_DEMO_SENHA` e só imprime "definida" ou "não definida". Sem opção, valem só naquela janela; com `kor-segredos -Persistir`, ficam nas variáveis do seu usuário do Windows.
6. **Primeira rodada de testes.** Digite `kor` e depois `.\tools\testar.ps1 -Parte prototipo`. Se o teste rápido do script (imperial e fórmulas) passou e o Chromium instalou, o ambiente está certo.

## O que o script faz

- Instala por winget: Git for Windows, Node.js LTS (o projeto pede 20 ou mais novo), Python 3 (só serve o site local para os testes), PowerShell 7. Opcionais: Visual Studio Code (`-ComVSCode`) e Claude Code por npm (pule com `-SemClaudeCode`).
- Ajusta o Git: nome e e-mail, `main` como padrão, `pull.rebase false` (o projeto não reescreve histórico, então `git pull` faz merge), caminhos longos e acentos.
- Cria as pastas, clona `korbuildtech` e, com `-ComEntregas`, o `KORbuildMatch`. Se a pasta já existe e está limpa, só atualiza com pull; se tem alteração local, não mexe.
- Instala o Playwright 1.56.1 dentro do projeto, sem gravar em `package.json`, e o Chromium. Para testar no Safari, rode depois `npx playwright install webkit`.
- Grava no perfil do PowerShell os atalhos `kor` (vai para o projeto e mostra o estado do git), `kor-entregas`, `kor-servir` (site em http://localhost:8123/) e `kor-segredos`.

O script nunca grava token, chave ou senha.

## Segredos

- **Token do Supabase:** gere um novo para este computador em Supabase › Account › Access Tokens, com um nome como `korbuild-notebook-novo`. Quando o computador antigo sair de uso, revogue o token dele lá. Nunca cole o token em chat, e-mail ou arquivo do projeto.
- **`KOR_DEMO_SENHA`:** a senha das contas de massa de teste, com 12 ou mais caracteres. É a mesma de antes.

## O que não precisa instalar

- **PostgreSQL local.** `tools/supabase-local.sh` e `tools/banco-local.sh` são em bash e servem ao ambiente em nuvem. No Windows, os testes de banco rodam contra o Supabase real pelo token: `.\tools\testar.ps1 -Parte banco`. Esses testes terminam em ROLLBACK ou criam e apagam usuários `kb-e2e-…`; migrações não são executadas por eles.
- **Bibliotecas Python.** Só se for gerar o portal ou o manual: `py -m pip install markdown mammoth`.

## Dia a dia

```powershell
kor                                   # vai para o projeto
git pull origin main                  # sempre antes de começar
.\tools\testar.ps1 -Parte prototipo   # navegador, sem banco
.\tools\testar.ps1 -Somente crew,obras
.\tools\testar.ps1 -Parte banco       # precisa do token
kor-servir                            # abre o site local para ver no navegador (?demo é o protótipo)
node tools/gerar-producao.mjs         # monta a pasta producao\ para subir na Hostinger (envio manual)
```

Regras do projeto: trabalhar e publicar na `main`; ao mudar arquivos do app, subir a versão do cache em `sw.js`; migrações só com autorização, aplicadas pela Management API, e o app só é publicado depois de a migração entrar.

## O que não vem junto

O repositório traz `CLAUDE.md`, `docs/` e os roteiros, que dão o contexto ao Claude Code no computador novo. O histórico das conversas das sessões não migra.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `winget` não encontrado | Atualizar o "Instalador de Aplicativo" na Microsoft Store |
| `git`, `node` ou `py` "não encontrado" logo após instalar | Fechar e abrir o PowerShell e rodar o script de novo |
| Script bloqueado | Rodar com `powershell -ExecutionPolicy Bypass -File …`; o script ajusta a política do usuário para RemoteSigned |
| Playwright diz que falta navegador | `npx playwright install chromium` dentro de `korbuildtech` |
| Porta 8123 ocupada | `kor-servir -Porta 8124` e `.\tools\testar.ps1 -Porta 8124` |
| Clone pede login e falha | Confirmar que o login no navegador foi com a conta `Nardacci` |
