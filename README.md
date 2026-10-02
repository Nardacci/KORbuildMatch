# KORbuild Match — Protótipo de validação

Telas iniciais do KORbuild Match com **dados fictícios**, para validação com empresas e profissionais. Não há back-end, banco de dados nem autenticação: qualquer e-mail e senha entram.

## Telas

| Arquivo | Tela |
| --- | --- |
| `demo.html` | Demonstração: escolha de jornada, atalhos, instalar no celular e recomeçar (use nos testes com usuários) |
| `index.html` | Entrar (escolha entre profissional e empresa) |
| `cadastro.html` | Criar conta (profissional ou empresa, com a verificação da empresa) |
| `registrar-contratacao.html?empresa=ID` | Profissional: registrar uma contratação para a empresa confirmar |
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
| `mensagens.html?como=empresa\|profissional` | As duas jornadas: lista de conversas, com o filtro "Sem resposta" (`&filtro=sem-resposta`) para responder ali mesmo |
| `conversa.html?id=ID&como=empresa\|profissional` | As duas jornadas: chat de uma conversa |
| `vagas.html` | Empresa: minhas vagas por estado (Abertas, Pausadas, Rascunhos, Encerradas) |
| `minha-empresa.html` | Empresa: dados da empresa, plano Essencial, reputação e vagas preenchidas |
| `perfil.html` | Profissional: meu perfil (ver, editar e privacidade) |
| `planos.html` | Empresa: plano Essencial, opções avulsas e simulação do fim do período grátis |
| `notificacoes.html?como=empresa\|profissional` | As duas jornadas: notificações e preferências de canal |
| `buscar.html?como=empresa\|profissional` | Busca com filtros de localização opcionais (empresa busca profissionais; profissional busca vagas) |

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

Localização (documento v0.2, seções 6, 7, 10 e 10.1):

- **Indicações só nos arredores:** em vagas presenciais e híbridas, a empresa só recebe indicados que estão dentro do raio da vaga **e** dentro da distância máxima que a própria pessoa aceita. Quem fica de fora é só contado ("2 fora do raio da vaga · 1 mora além da distância que aceita"), sem nomes. A mesma regra filtra as vagas indicadas ao profissional.
- **Raio padrão:** 25 milhas nos Estados Unidos e 40 km nos demais países. Em `publicar-vaga.html`, o campo "Raio de busca" já vem com o padrão do país escolhido (e muda de unidade junto com ele).
- **Aviso para ampliar o raio:** com menos de 3 indicados, a empresa vê "Poucos profissionais nos arredores" com o menor raio que traria mais gente ("Com 60 km, entra mais 1 profissional"). Na Recepcionista, isso acontece logo de início: ampliar para 60 km traz a Renata Campos (Jundiaí). Se ampliar não ajudaria (quem ficou de fora mora além da distância que aceita), o aviso diz isso e não oferece o botão. O raio ampliado fica guardado na sessão.
- **Vagas remotas:** não usam distância. Entra quem aceita trabalho remoto e, se a empresa definir o fuso da equipe, quem está a até 3 h dele.
- **Distância aproximada, sem endereço:** as telas mostram só a cidade e a distância arredondada ("≈ 15 km da vaga"). Cada perfil, empresa e vaga guarda apenas o centro aproximado do bairro ou da cidade.
- **Linha reta no MVP:** a distância é calculada em linha reta (fórmula de haversine), sem rota.
- **Perfil do profissional (seção 6):** distância máxima que aceita, se aceita se mudar, modelos de trabalho aceitos e fuso horário, na seção "Localização e preferências" de `perfil-profissional.html`. O João Silva pode mudar a distância máxima dele em "Vagas indicadas para você" (tela inicial): com 60 km, a vaga de Recepcionista de hotel em Santos passa a aparecer.
- **Busca (seções 10 e 10.1):** a localização é um filtro opcional, desligado por padrão e controlado por quem pesquisa: distância (a partir da sede da empresa ou da região do profissional), país, estado, cidade, modelo de trabalho, disposto a se mudar (só na busca da empresa) e fuso horário. Na busca de vagas, as remotas aparecem com qualquer distância.
- **Cidades conhecidas:** `mock-data.js` traz uma lista de cidades com o ponto aproximado (em `localizacao.cidades`). Ao publicar uma vaga numa cidade fora da lista, ela é publicada normalmente, mas as indicações não são filtradas por distância (a tela avisa).

Abas que faltavam (seções 6, 7 e 16):

- **Minhas vagas** (`vagas.html`): vagas agrupadas por estado — Abertas, Pausadas, Rascunhos e Encerradas (Preenchida, Cancelada, Expirada). Ações: pausar, reabrir, cancelar (a tela diz quantos candidatos em aberto recebem o aviso), editar e excluir rascunho. A vaga "Operador de caixa" vem expirada no mock.
- **Editar vaga e rascunho**: `publicar-vaga.html?editar=ID` abre o formulário já preenchido; "Salvar rascunho" guarda a vaga só com o título, e ela só aparece para profissionais depois de publicada.
- **Minha empresa** (`minha-empresa.html`): nome, setor, porte, site, descrição, várias localizações e canal comercial (editáveis), reputação com a taxa de resposta, vagas preenchidas pela plataforma e o **plano Essencial**: grátis por 3 meses a partir da primeira vaga, cartão só no fim, uso de vagas ativas (até 3) e convites do mês (até 30). No perfil público da empresa, as vagas preenchidas aparecem sem o nome de quem foi contratado.
- **Meu perfil** (`perfil.html`): o João vê e edita título, apresentação, disponibilidade, tipo de contratação, modelos de trabalho, cidade, distância máxima, se aceita se mudar, contato preferido, competências e certificações. A **privacidade** define, para apresentação, disponibilidade, experiência declarada e certificações, se a parte é pública, só para empresas ou privada; a visão da empresa respeita isso. A reputação verificada não é editável.

Resposta garantida (seção 7.1):

- **Prazo de 7 dias vencido**: a empresa vê "Prazo vencido" no candidato e um lembrete no topo da tela inicial; o profissional vê "Sem resposta no prazo · a empresa recebeu um lembrete" (a candidatura "Atendente de caixa", no Café Aurora, já vem assim).
- **Retirar candidatura**: o profissional retira (com confirmação) qualquer candidatura em andamento; a empresa vê "Retirou a candidatura".
- **Marcar vários como não selecionados**: em Candidatos, "Selecionar vários" e uma mensagem padrão respeitosa, editável antes de enviar. O João recebe a mensagem na candidatura dele.
- **Vaga encerrada**: quando a vaga é preenchida, cancelada ou expira, quem ainda estava em aberto recebe o aviso automaticamente. Vaga pausada ou encerrada some da busca e das indicações do profissional e não recebe candidaturas.
- **Taxa de resposta** da empresa ("Responde 97% das candidaturas em até 7 dias") no perfil da empresa e no detalhe da vaga.

Conexões (seção 9):

- **Convite visível**: "A empresa X convidou você" aparece na tela inicial do profissional (com "Agora não") e em destaque na vaga. O convite do Grupo Horizonte vem no mock; um convite feito pela Empresa Exemplo na sessão também chega ao João.
- **Salvar profissional**: botão "Salvar" nos indicados, na busca e no perfil; a lista fica em "Talentos da empresa" (tela inicial) e na busca há o filtro "Só talentos salvos".
- **Recontratação**: "Vocês já trabalharam juntos · Chamar de novo" (empresa, no perfil da Ana Souza) e "Você já trabalhou aqui · Falar com a empresa de novo" (profissional, no perfil da Loja Central), abrindo a conversa com uma mensagem pronta.

Reputação (seção 8):

- **Responder a uma avaliação**: quem foi avaliado publica uma resposta ao lado da avaliação — a empresa em "Minha empresa", o profissional em "Meu perfil". A resposta aparece no perfil público.
- **Denunciar uma avaliação**: qualquer pessoa denuncia com um motivo (ofensa, dados pessoais, informação falsa ou outro). A avaliação vai para moderação; a plataforma não altera notas, só remove o que viola as regras.
- **Privacidade por vínculo**: em "Meu perfil", cada trabalho verificado pode mostrar ou ocultar o nome da empresa. Oculto, a empresa vê "Empresa não divulgada", mas o vínculo continua contando na reputação.
- **Resposta à contestação do combinado**: quando o João contesta, a empresa toca em "Combinado contestado" e escolhe **corrigir o combinado** (formulário já preenchido) ou **manter e responder**. Nos dois casos o João recebe o pedido de confirmação de novo, com o aviso do que a empresa fez. O combinado só muda com o aceite dos dois lados.

Mensagens sem resposta:

- Na home da empresa, a pendência **"N mensagens sem resposta"** conta as conversas em que o profissional escreveu por último (some quando chega a zero) e abre `mensagens.html?como=empresa&filtro=sem-resposta`.
- A tela mostra as mais antigas primeiro, com **há quanto tempo a pessoa espera**, a vaga e a última mensagem. Dá para **responder ali mesmo** (com respostas rápidas editáveis) ou abrir a conversa. Quem foi respondido sai da lista; o filtro **Todas / Sem resposta** fica no topo de Mensagens, nas duas jornadas.
- Dados de exemplo: Mariana Rocha (lida, sem resposta) e Rafael Lima (não lida) esperam a empresa; Paulo Andrade já foi respondido.

Notificações (seção 11):

- O **sino** mostra quantas notificações não foram lidas e abre `notificacoes.html`. Abrir a tela marca tudo como lido (as novas continuam destacadas até sair).
- As notificações vêm do que acontece na demonstração. Empresa: novas mensagens, candidatos novos, prazo de resposta vencido, candidatura retirada, confirmação, contestação ou recusa da contratação e avaliação pendente. Profissional: convites, pedido de confirmação (e a resposta da empresa à contestação), mudanças nas candidaturas, candidatura sem resposta, vagas compatíveis, empresas seguidas com vaga aberta, mensagens e prazo de avaliação.
- **Como receber**: para cada tipo de aviso, ligar ou desligar no app (push) e por e-mail. Nada é enviado de verdade.

Modelo de negócio (seção 16):

- **Planos** (`planos.html`, a partir de "Minha empresa"): status do período grátis, o Essencial (US$ 79,00/mês, o que inclui), as opções avulsas (vaga avulsa e destaque, com preço ainda em definição) e as regras que não mudam (contratar e avaliar são grátis, reputação não se compra, destaque não fura a regra de reputação, profissional nunca paga). Assinar é simulado: nada é cobrado.
- **Até 3 vagas ativas**: publicar ou reabrir uma 4ª vaga é bloqueado com o motivo; cada vaga avulsa libera mais uma.
- **Fim do período grátis** (simulado na tela de planos): o aviso de 7 dias antes, com o resumo do que a empresa conseguiu, e o fim do período, que pausa as vagas abertas sem apagá-las até a empresa assinar. As vagas pausadas somem para o profissional.
- **Destaque de vaga**: em "Minhas vagas", "Destacar" põe o selo "Patrocinada" por 30 dias; a vaga vem primeiro na busca e nas indicações do profissional.

Busca: mais filtros e ajuda da IA (seções 10 e 12):

- **Mais filtros** (opcionais): tipo de contratação, idioma e reputação mínima nas duas buscas; salário a partir de um valor (mesma moeda e período) e área na busca de vagas. Quem ainda não tem avaliações não entra quando a reputação mínima está ligada.
- **Redigir com ajuda da IA** (`publicar-vaga.html`): a partir de uma descrição curta, sugere título, descrição e competências, mostra o motivo de cada sugestão e ignora temas proibidos (por exemplo, "até 30 anos" vira "Ignoramos: idade"). Em "Meu perfil", "Sugerir com IA" escreve a apresentação a partir das experiências verificadas. **No protótipo, a IA é simulada** com regras simples; nada sai do navegador.

Fechando o ciclo do MVP (seções 7.1, 7.2, 8.1 e 8.8):

- **Cadastro de conta** (`cadastro.html`, em "Criar conta grátis"): profissional ou empresa, só com os dados necessários e o aceite dos termos. Depois de criar a conta, a tela **"Confirme seu e-mail"** mostra para onde o link foi, a dica de olhar o spam, "Reenviar e-mail" (liberado depois de 60 s) e "Corrigir o e-mail" (volta ao formulário preenchido); a prévia do e-mail aparece logo abaixo, com o botão "Confirmar minha conta". Confirmado o e-mail, a empresa passa pela **verificação** — pelo domínio do e-mail ou, com e-mail pessoal, pelo número de registro. Nenhuma conta é criada de verdade; a demonstração segue com o João Silva ou a Empresa Exemplo.
- **O profissional registra a contratação**: em "Minhas candidaturas", "Fui contratado" abre o registro do combinado; a empresa confirma ou não reconhece. Com a Empresa Exemplo, a confirmação aparece para a empresa (tela inicial → perfil do João); com as demais, a resposta da empresa é simulada no próprio card.
- **"Deu certo?"**: depois que o contato é liberado na conversa, os dois lados veem a pergunta. "Sim" leva ao registro da contratação (a empresa já com a pessoa marcada); "Ainda não" esconde.
- **Contestar vínculo recusado**: a empresa contesta quando o profissional diz que não foi contratado, e o profissional contesta quando a empresa não reconhece o registro. A moderação analisa; até lá, nada entra no histórico.
- **Candidatura**: aviso de baixa compatibilidade ("Você atende 3 de 5 requisitos… pode se candidatar mesmo assim") e perfil mínimo pedido na própria candidatura quando falta algo essencial.
- **Anotações internas** no perfil do profissional (só a empresa vê) e **denunciar conversa**.

Demonstração e app instalável (seção 14):

- **`demo.html`** (link "Sobre esta demonstração" no login): explica o protótipo, leva às duas jornadas e ao cadastro, tem atalhos para as telas principais, as instruções para instalar no celular e o botão **"Recomeçar a demonstração"** (apaga o que foi feito e volta aos dados de exemplo — use antes de cada sessão de teste).
- **App instalável (PWA)**: `manifest.webmanifest` (nome, cores, abre na tela de demonstração), ícones em `assets/icons/` e `sw.js`. O service worker busca sempre a versão nova na rede e guarda uma cópia para abrir sem internet, então o app instalado nunca fica preso a uma versão antiga. No Android, o botão "Instalar app" aparece na tela de demonstração; no iPhone, Safari → Compartilhar → "Adicionar à Tela de Início".

Identidade visual (modelo C · marca forte):

- Topo escuro (azul-marinho) em todas as telas, com o verde-limão como cor de destaque e botões principais em azul-marinho.
- Nas telas iniciais, a reputação é o número principal (4,7 da empresa, 4,8 do João), com três números logo abaixo e a busca sobreposta ao topo.
- A compatibilidade com a vaga aparece como um anel ("5/5") nos cards de profissionais e de vagas.
- Cores e raios ficam nas variáveis de `:root`, no início de `styles.css`; a camada do modelo C está no fim do arquivo.

## Testes

`docs/tests/journeys.html` é uma suíte de testes automatizados (85 passos, ~386 verificações) que roda os fluxos das duas jornadas dentro de um iframe de 390px e mostra PASS/FAIL de cada verificação. Para rodar: publique o protótipo (ou sirva a pasta localmente) e abra esse arquivo no navegador — ele carrega as páginas por caminho relativo (`../../`), então precisa estar na mesma hospedagem que o resto do protótipo. `?until=N` roda só os N primeiros passos; `?h=ALTURA` ajusta a altura do iframe.

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
buscar.html               busca com filtros de localização (as duas jornadas)
vagas.html, minha-empresa.html, perfil.html, notificacoes.html, planos.html
cadastro.html, registrar-contratacao.html, demo.html
manifest.webmanifest, sw.js, assets/icons/   app instalável (PWA)
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

Os arquivos de `assets/` são chamados com `?v=AAAAMMDD-N` em todos os HTML (por exemplo, `styles.css?v=20261002-1`). A cada publicação que mude CSS ou JS, troque esse valor em todos os arquivos; assim o navegador baixa a versão nova em vez de usar a antiga do cache.

## Banco de dados (Supabase)

O caminho para sair dos dados fictícios está em [`docs/supabase.md`](docs/supabase.md): o esquema completo do banco com as regras de acesso em `supabase/migrations/` e os testes das regras em `supabase/tests/` (115 verificações). O protótipo continua com os dados fictícios. A **versão real (beta)** fica em `app/` e entra por etapas: as etapas de contas (cadastro com confirmação de e-mail, entrar, sair, recuperar senha, perfil) , de vagas e candidaturas (publicar, buscar, candidatar-se, ver candidatos), de mensagens (conversas, "Sem resposta", troca de contato) e de contratação e reputação (combinado, confirmação, avaliação cega, reputação) estão prontas. Acesso: `app/entrar.html`, ou pela página de demonstração.
