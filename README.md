# KORbuild Match — Protótipo de validação

Telas iniciais do KORbuild Match com **dados fictícios**, para validação com empresas e profissionais. Não há back-end, banco de dados nem autenticação: qualquer e-mail e senha entram.

## Telas

| Arquivo | Tela |
| --- | --- |
| `index.html` | Entrar (escolha entre profissional e empresa) |
| `empresa.html` | Início da empresa logada |
| `profissional.html` | Início do profissional logado |
| `publicar-vaga.html` | Empresa: formulário para publicar uma vaga |
| `candidatos.html?vaga=ID` | Empresa: candidatos da vaga, com filtro por status |
| `perfil-profissional.html?id=ID` | Empresa: perfil do profissional (reputação, histórico, avaliações) |
| `preencher-vaga.html?vaga=ID` | Empresa: indicar quem preencheu a vaga |
| `avaliar-profissional.html?id=ID` | Empresa: avaliação cega do profissional |
| `vaga.html?id=ID` | Profissional: detalhe da vaga e candidatura |
| `candidaturas.html` | Profissional: minhas candidaturas, com linha do tempo |
| `perfil-empresa.html?id=ID` | Profissional: perfil da empresa (reputação, vagas, avaliações) |
| `avaliar-empresa.html?id=ID` | Profissional: avaliação cega da empresa |
| `mensagens.html?como=empresa\|profissional` | As duas jornadas: lista de conversas |
| `conversa.html?id=ID&como=empresa\|profissional` | As duas jornadas: chat de uma conversa |

Interações simuladas:

- No login, a escolha "Profissional" ou "Empresa" leva à tela correspondente.
- Na tela da empresa, os profissionais indicados mudam conforme a vaga escolhida.
- Na tela do profissional, o card de confirmação usa "Confirmar" e "Algo está diferente" (contestação).
- Tocar no avatar volta para o login.
- Botões de telas que ainda não existem mostram um aviso.

Jornada da empresa (simulada, sem back-end):

- **Continuidade entre telas:** o que a pessoa faz fica em `sessionStorage` (vaga publicada, candidato movido de status, vaga marcada como preenchida, avaliação enviada). Fechar a aba ou entrar de novo pelo login recomeça a demonstração.
- **Vaga publicada** aparece em "Minhas vagas" (início da empresa) e ganha profissionais indicados.
- **Vaga marcada como preenchida** passa por uma segunda etapa, "Registrar o combinado" (salário, data de início, jornada, função e tipo de contratação), antes de virar "Preenchida · aguardando confirmação".
- **Formulário de vaga** não tem campos de idade, gênero, raça, religião, estado civil, nacionalidade nem foto (proibidos por lei em muitos países).
- Os números "candidatos novos" e "candidatos" da tela inicial vêm da lista de candidatos em `mock-data.js`.

Jornada do profissional (simulada, sem back-end; o profissional logado é o João Silva):

- **Continuidade entre telas:** fica em `sessionStorage`, à parte do estado da empresa (candidatura enviada, confirmação de contratação, avaliação enviada, empresa seguida). O login zera as duas jornadas.
- **Candidatar-se** é um passo único: mostra o resumo do que será enviado (perfil já preenchido) antes de confirmar. Depois, a vaga já aparece em Minhas candidaturas e o botão na tela da vaga vira "Candidatura enviada · ver status".
- **Consistência entre as duas jornadas:** a contratação que o João confirma aqui é a mesma que a Empresa Exemplo administra na jornada dela (a vaga de Recepcionista). O que uma tela faz aparece na outra — por exemplo, `candidatos.html?vaga=recepcionista` já mostra João Silva como contratado assim que ele confirma o combinado pela tela do profissional.
- A reputação da Empresa Exemplo e da Loja Central usa os mesmos números nas duas jornadas (definidos uma vez em `mock-data.js`).

Candidatura e conversa (as duas jornadas):

- **Linha do tempo da candidatura:** Enviada → Visualizada → Em conversa → Contratado, com três saídas possíveis: Não selecionado, Retirada ou Vaga encerrada.
- **Prazo de 7 dias:** um candidato novo mostra "Responder até dd/mm" para a empresa; uma candidatura ainda não respondida mostra "A empresa responde até dd/mm" para o profissional.
- **Conversas** ficam em `sessionStorage` à parte (`kor.chat`), visível nas duas jornadas porque é a mesma aba do navegador. Iniciar uma conversa move a candidatura para "Em conversa". Só a Empresa Exemplo e o João Silva têm os dois lados navegáveis no protótipo; conversas com as demais pessoas e empresas recebem uma resposta automática simulada.
- **WhatsApp/SMS/e-mail:** a barra no topo do chat libera o contato só quando os dois lados compartilharem. O botão final usa o canal preferido da outra pessoa (Rafael Lima está configurado com SMS, para mostrar essa variação) e mostra a mensagem que seria enviada, sem abrir nada de verdade.
- **Combinado registrado:** o salário e as condições ficam disponíveis como referência nas perguntas de avaliação sobre pagamento e condições, por exemplo "O pagamento foi feito conforme combinado (R$ 1.800,00 por mês)?".
- **Card de confirmação do profissional:** aparece desde o primeiro acesso, com um combinado fictício já definido em `mock-data.js` — não é preciso passar pela jornada da empresa para vê-lo. Se a empresa registrar um combinado em `preencher-vaga.html` na mesma sessão, o card passa a mostrar os dados dela. Três ações: "Confirmar" (a contratação entra no histórico dos dois), "Algo está diferente" (contesta um ponto do combinado; a empresa vê "Combinado contestado" na vaga) e "Não fui contratado" (pede confirmação antes de enviar; a empresa vê "Contratação recusada por João Silva" e a vaga volta a "Aberta" para escolher outra pessoa — o vínculo não entra no histórico de ninguém).

A candidatura completa (perguntas de triagem, pretensão salarial e currículo):

- **Perguntas de triagem:** em `publicar-vaga.html`, a empresa pode criar até 3 perguntas (Sim/Não ou múltipla escolha, até 4 opções). Um aviso fixo lembra que perguntar sobre idade, gênero, raça, religião, estado civil, filhos, gravidez, nacionalidade ou origem não é permitido; se o texto da pergunta ou de uma opção citar um desses temas, a publicação fica bloqueada até a pergunta ser reescrita. Nenhuma resposta é eliminatória — a empresa só vê as respostas e decide. As vagas `recepcionista-exemplo` e `atendente-exemplo` já têm perguntas de exemplo no mock.
- **Candidatura rápida:** em `vaga.html`, ficam sempre visíveis o resumo do perfil que será enviado e as perguntas de triagem da vaga (obrigatórias quando existirem). Mensagem para a empresa, pretensão salarial e currículo ficam dentro de um accordion "Adicionar mais informações (opcional)", fechado por padrão; o cabeçalho mostra um resumo do que já foi preenchido (por exemplo "Mensagem · Pretensão · Currículo anexado"), mesmo fechado. O botão "Enviar candidatura" fica sempre visível — não é preciso abrir o accordion para enviar.
- **Pretensão salarial (opcional):** valor, moeda e período, já preenchidos com os da vaga. Não há campo de salário anterior ou histórico salarial. A empresa vê a pretensão junto com "Dentro da faixa", "Acima da faixa" ou "Abaixo da faixa" (só quando a moeda e o período coincidem com os da vaga).
- **Currículo em PDF (opcional):** só aceita PDF de até 5 MB, com nome e tamanho mostrados e opção de remover. O arquivo em si nunca é enviado nem salvo — nem no `sessionStorage` —, só o nome e o tamanho. Para a empresa, "Ver currículo" mostra o aviso de protótipo. Rafael Lima (candidato de Recepcionista) já vem com um currículo anexado no mock, para demonstrar.
- **O que a empresa recebe:** `candidatos.html` e `perfil-profissional.html` (quando aberto a partir de uma candidatura) mostram um bloco "Candidatura" com a mensagem do candidato, as respostas de triagem, a pretensão salarial (com a indicação de faixa) e o currículo, quando houver.

## Testes

`docs/tests/journeys.html` é uma suíte de testes automatizados (41 passos, ~165 verificações) que roda os fluxos das duas jornadas dentro de um iframe de 390px e mostra PASS/FAIL de cada verificação. Para rodar: publique o protótipo (ou sirva a pasta localmente) e abra esse arquivo no navegador — ele carrega as páginas por caminho relativo (`../../`), então precisa estar na mesma hospedagem que o resto do protótipo. `?until=N` roda só os N primeiros passos; `?h=ALTURA` ajusta a altura do iframe.

## Demonstração

Dois GIFs curtos em `docs/demo/`:

- `card-confirmacao-3-caminhos.gif` — os três caminhos do card de confirmação: Confirmar, Algo está diferente e Não fui contratado.
- `candidatura-triagem-pretensao-curriculo.gif` — uma candidatura completa, respondendo à pergunta de triagem, informando a pretensão salarial e anexando um currículo em PDF.

## Como alterar os dados

Todos os nomes, números e vagas estão em `assets/js/mock-data.js`. Edite esse arquivo e publique de novo; não é preciso mexer no restante do código.

## Estrutura

```
index.html
empresa.html
profissional.html
publicar-vaga.html, candidatos.html, perfil-profissional.html,
preencher-vaga.html, avaliar-profissional.html
vaga.html, candidaturas.html, perfil-empresa.html, avaliar-empresa.html
mensagens.html, conversa.html
assets/css/styles.css     estilos (mobile first)
assets/js/mock-data.js    dados fictícios
assets/js/app.js          renderização das telas e interações
docs/tests/journeys.html  testes automatizados das duas jornadas
docs/demo/                GIFs curtos de demonstração
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

Os arquivos de `assets/` são chamados com `?v=AAAAMMDD-N` em todos os HTML (por exemplo, `styles.css?v=20260928-8`). A cada publicação que mude CSS ou JS, troque esse valor em todos os arquivos; assim o navegador baixa a versão nova em vez de usar a antiga do cache.
