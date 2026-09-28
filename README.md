# KORbuild Match — Protótipo de validação

Telas iniciais do KORbuild Match com **dados fictícios**, para validação com empresas e profissionais. Não há back-end, banco de dados nem autenticação: qualquer e-mail e senha entram.

## Telas

| Arquivo | Tela |
| --- | --- |
| `index.html` | Entrar (escolha entre profissional e empresa) |
| `empresa.html` | Início da empresa logada |
| `profissional.html` | Início do profissional logado |

Interações simuladas:

- No login, a escolha "Profissional" ou "Empresa" leva à tela correspondente.
- Na tela da empresa, os profissionais indicados mudam conforme a vaga escolhida.
- Na tela do profissional, "Confirmar" e "Não fui contratado" simulam a confirmação de contratação.
- Tocar no avatar volta para o login.
- Botões de telas que ainda não existem mostram um aviso.

## Como alterar os dados

Todos os nomes, números e vagas estão em `assets/js/mock-data.js`. Edite esse arquivo e publique de novo; não é preciso mexer no restante do código.

## Estrutura

```
index.html
empresa.html
profissional.html
assets/css/styles.css     estilos (mobile first)
assets/js/mock-data.js    dados fictícios
assets/js/app.js          renderização das telas e interações
CNAME                     domínio korbuildmatch.com (GitHub Pages)
robots.txt                bloqueia buscadores durante a validação
```

## Publicar no GitHub Pages com korbuildmatch.com

1. Envie estes arquivos para a raiz do repositório `KORbuildMatch`, na branch `main`.
2. No GitHub, abra **Settings → Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
3. Em **Custom domain**, confirme `korbuildmatch.com` (o arquivo `CNAME` já traz esse valor).
4. No painel do registrador do domínio, crie os registros DNS:
   - Quatro registros **A** para `@` apontando para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`.
   - Um registro **CNAME** para `www` apontando para `SEU-USUARIO.github.io` (o usuário ou organização dona do repositório).
5. Depois que o DNS propagar (de minutos a algumas horas), marque **Enforce HTTPS** na página de Pages.

Observação: no plano gratuito do GitHub, o Pages só funciona com repositório **público**. Para repositório privado, é preciso um plano pago.

## Privacidade durante a validação

As páginas têm `noindex` e o `robots.txt` bloqueia buscadores, para que o protótipo não apareça no Google. Remova esses bloqueios só no lançamento real.

## Versão do cache

Os arquivos de `assets/` são chamados com `?v=AAAAMMDD-N` nos três HTML (por exemplo, `styles.css?v=20260928-2`). A cada publicação que mude CSS ou JS, troque esse valor nos três arquivos; assim o navegador baixa a versão nova em vez de usar a antiga do cache.
