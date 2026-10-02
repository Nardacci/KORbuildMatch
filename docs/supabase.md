# KORbuild Match — banco de dados no Supabase

Este guia leva o protótipo para um banco de dados real, em etapas. A primeira etapa (este
arquivo + `supabase/migrations/`) cria o banco com todas as regras de acesso. O site ainda
não usa o banco: isso começa na etapa 2.

## Etapas

| Etapa | O que entra | Situação |
| --- | --- | --- |
| 1. Esquema | Tabelas, regras de acesso (RLS), regras de negócio, currículos, mensagens em tempo real | **Pronto** e aplicado |
| 2. Contas | Cadastro, confirmação de e-mail, entrar, sair, recuperar senha, perfil da empresa e do profissional | **Pronto**: `app/` |
| 3. Vagas e candidaturas | Publicar vaga, buscar, candidatar-se, funil de candidatos | **Pronto** (convites e salvos ficam para depois) |
| 4. Mensagens | Conversas em tempo real, "Sem resposta", liberação do contato | **Pronto** (aplicar `20261003000000_conversas.sql`) |
| 5. Contratação e reputação | Combinado, confirmação, contestação, avaliação cega, reputação | Próxima |
| 6. Avisos e plano | E-mails e notificações, lembrete de 7 dias, cobrança do plano | |

Enquanto isso, o protótipo com dados fictícios continua no ar como demonstração, na raiz do site.
A versão real fica em `app/` (ex.: `korbuildmatch.com/app/entrar.html`).

## Versão real (`app/`)

| Arquivo | O que faz |
| --- | --- |
| `app/config.js` | Endereço do projeto e chave publicável. Só a publicável: a secreta nunca vai para o site. |
| `app/dados.js` | Listas dos formulários (países, portes, disponibilidade, distâncias). |
| `app/cidades/` | Cidades do mundo, um arquivo por país (GeoNames, CC BY 4.0), baixado só quando o país é escolhido. Gerado por `scripts/gerar-cidades.js`. |
| `app/app.js` | As telas: `entrar`, `cadastro`, `recuperar`, `nova-senha`, `inicio`, `perfil`. |
| `assets/vendor/supabase-js-2.117.2.js` | Biblioteca oficial do Supabase, guardada no site (sem depender de CDN). |

- **Cadastro**: envia `tipo`, `nome` e o que a pessoa digitou (país e setor, ou cidade e "o que você faz"). O banco cria o perfil; no primeiro acesso, o site completa o perfil com esses dados.
- **Confirmação de e-mail**: o link do e-mail abre `app/inicio.html` já com a sessão. Se o link vencer, a pessoa entra com e-mail e senha ou pede outro link.
- **Recuperar senha**: o link abre `app/nova-senha.html`. A resposta é a mesma exista ou não a conta, para não revelar quem está cadastrado.
- **Início**: enquanto o perfil está incompleto, mostra o que falta (progresso) e leva para editar. Com o perfil completo, vira a página principal do protótipo: busca, "Vagas para você" (profissional) ou "Publique sua primeira vaga" (empresa) e o resumo do perfil. Vagas, busca e candidaturas ganham dados reais na etapa 3.
- **Perfil**: empresa (setor, porte, sede, site, sobre) ou profissional (o que faz, cidade, disponibilidade, distância, modelos, competências, aparecer nas buscas), mais o contato e a troca de senha.
- **País e cidade**: primeiro o país (todos os países, com Brasil, Estados Unidos e Portugal no topo; o padrão vem do idioma do navegador), depois a cidade com busca: digitando "laco" aparece "Laconia, NH". Aceita nome sem acento e "cidade, estado". São cerca de 170 mil cidades (mais de 1.000 habitantes ou sedes de município); quem mora numa cidade menor escolhe a mais próxima. O banco guarda o código do país (BR, US…), a cidade, o estado (sigla quando existe) e o ponto aproximado. Nos EUA, as distâncias aparecem em milhas.

Teste automatizado: `docs/tests/contas-supabase-simulado.js` roda as telas num navegador contra um Supabase simulado (63 verificações).

### Etapa 3: vagas e candidaturas

| Tela | Quem | O que faz |
| --- | --- | --- |
| `publicar-vaga.html` (`?id=` para editar) | Empresa | Cargo, tipo, descrição, posições; presencial/híbrida com país, cidade e raio (km ou mi) ou remota com fuso; salário opcional; experiência, requisitos e competências; até 3 perguntas de triagem (sim/não ou opções), sem temas proibidos. Publicar ou salvar rascunho. |
| `vagas.html` | Empresa | Minhas vagas por estado (abertas, pausadas, rascunhos, encerradas), com número de candidatos e ações: publicar, editar, pausar, reativar, cancelar (avisa os candidatos), apagar rascunho. |
| `candidatos.html?vaga=` | Empresa | Candidatos por etapa (novos, em conversa, não selecionados…), com distância até a vaga, competências em comum, prazo de 7 dias, mensagem, respostas da triagem e pretensão. Chamar para conversa ou não selecionar. |
| `ver-profissional.html?id=` | Empresa | Perfil do candidato: o que procura, competências (em comum com a vaga), sobre, experiências verificadas e declaradas. |
| `buscar.html` | Profissional | Vagas abertas, por texto e modelo, só dentro da distância dele (e remotas) ou todas, das mais próximas para as remotas. |
| `vaga.html?id=` | Todos | Detalhe da vaga. O profissional se candidata (triagem, mensagem, pretensão); a empresa dona edita ou vê candidatos; quem não entrou vê a vaga e o convite para entrar. |
| `candidaturas.html` | Profissional | Em andamento e encerradas, com status, prazo de resposta e a opção de retirar. |

O início mostra os números reais: para a empresa, vagas abertas, candidatos novos e quem espera resposta há mais de 7 dias; para o profissional, as vagas perto dele e as candidaturas em andamento.

As regras continuam no banco: limite de 3 vagas ativas, período grátis a partir da primeira vaga, candidatura só em vaga aberta e uma por vaga, empresa só move entre novo/em conversa/não selecionado, cancelar a vaga encerra as candidaturas em andamento.

Teste: `docs/tests/vagas-supabase-local.js` roda as telas contra um "Supabase local" (PostgreSQL com o esquema e o RLS reais + PostgREST 12 + login simulado, em `supabase/tests/local/`): 42 verificações, da publicação à vaga cancelada.

### Etapa 4: mensagens

**Antes de publicar esta etapa, aplique no SQL Editor** o arquivo
[`supabase/migrations/20261003000000_conversas.sql`](../supabase/migrations/20261003000000_conversas.sql)
(pode rodar mais de uma vez). Ele permite que a empresa veja o perfil de quem conversa com ela e impede
que uma empresa abra conversa com um perfil oculto que não se candidatou às vagas dela.

| Tela | O que faz |
| --- | --- |
| `mensagens.html` | Conversas da conta, as não lidas em destaque, com a vaga e a última mensagem. Filtro **Sem resposta** (quem escreveu por último foi o outro lado), com respostas rápidas e resposta ali mesmo. |
| `conversa.html?id=` | Mensagens em tempo real (Supabase Realtime, com conferência a cada poucos segundos se a conexão cair), Enter para enviar, link para a vaga e para o perfil. **Troca de contato**: cada lado compartilha o seu; quando os dois compartilham, aparece o contato do outro (WhatsApp, SMS ou e-mail) com o botão para abrir. Denunciar conversa. |

Onde a conversa começa: **Chamar para conversa** na lista de candidatos (muda o status e abre a conversa com
uma mensagem sugerida), **Mensagem** para quem já está em conversa, e **Tirar dúvida com a empresa** na vaga.
É uma conversa por par empresa–profissional. A aba Mensagens mostra quantas conversas não foram lidas, e o
início mostra as mensagens sem resposta.

O lado de quem escreve e o autor vêm do login (gatilho do banco), e o contato só é entregue pela função
`contato_da_conversa` depois que os dois compartilham.

Teste: `docs/tests/mensagens-supabase-local.js` (24 verificações).

### Modelos de e-mail em português

Os dois e-mails da conta, com a identidade do Match, estão em `supabase/templates/`. Em
**Authentication → Emails → Templates**, abra cada modelo, troque o assunto e cole o arquivo
inteiro no campo de HTML:

| Modelo no Supabase | Assunto | Arquivo |
| --- | --- | --- |
| Confirm signup | Confirme sua conta no KORbuild Match | `supabase/templates/confirmar-cadastro.html` |
| Reset password | Crie uma nova senha no KORbuild Match | `supabase/templates/nova-senha.html` |

O e-mail de confirmação usa o nome e o tipo da conta enviados no cadastro: chama a pessoa pelo
nome e mostra "O que vem depois" diferente para empresa e para profissional.

## 1. Aplicar o esquema

1. No [painel do Supabase](https://supabase.com/dashboard), abra o projeto do KORbuild Match.
2. Menu **SQL Editor** → **New query**.
3. Copie todo o conteúdo de [`supabase/migrations/20261002000000_esquema_inicial.sql`](../supabase/migrations/20261002000000_esquema_inicial.sql), cole e clique em **Run**.
4. Deve aparecer "Success. No rows returned". Em **Table Editor** aparecem as tabelas
   (`empresas`, `profissionais`, `vagas`, `candidaturas`, `conversas`, `mensagens`,
   `contratacoes`, `avaliacoes` e as demais), cada uma com o cadeado de RLS ligado.

Rode o arquivo **uma vez só**, num projeto novo. Se der erro no meio, o Supabase desfaz tudo; me
mande a mensagem de erro.

Com a CLI do Supabase, o mesmo arquivo é aplicado com `supabase link` + `supabase db push`.

## 2. Configurar o login (Authentication)

Em **Authentication**:

- **Sign In / Providers → Email**: ligado, com **Confirm email** ligado (é a tela "Confirme seu e-mail" do protótipo).
- **URL Configuration**:
  - *Site URL*: `https://korbuildmatch.com`
  - *Redirect URLs*: `https://korbuildmatch.com/**` e `https://nardacci.github.io/KORbuildMatch/**`
- **Emails → Templates**: traduzir para português os modelos *Confirm signup* e *Reset password* (posso escrever os textos na etapa 2).
- Para produção, configure um SMTP próprio em **Emails → SMTP Settings**. O envio padrão do Supabase tem limite baixo por hora e é só para testes.

No cadastro, o site envia `{ tipo: 'empresa' | 'profissional', nome }`. O banco cria sozinho o
perfil e a linha da empresa ou do profissional.

## 3. O que me enviar para a etapa 2

Em **Project Settings → API** (ou **API Keys**):

- **Project URL** (`https://xxxx.supabase.co`)
- **anon / publishable key**

Essas duas podem ficar no código do site: quem protege os dados é o RLS.

**Nunca** envie nem coloque no site a chave **service_role / secret**. Ela ignora todas as regras de
acesso e só pode ser usada em servidor.

## Como o banco protege os dados

Tudo isto vale mesmo que alguém altere o JavaScript do site, porque as regras rodam no banco.

- **Cada um vê o que é seu.** Candidaturas: só o profissional e a empresa da vaga. Conversas e mensagens: só os dois participantes. Salvos, contatos, plano: só o dono.
- **Visitantes sem conta** veem vagas abertas, perfis de empresa e avaliações publicadas. Perfis de profissionais só para quem entrou. O perfil oculto só aparece para as empresas a que a pessoa se candidatou.
- **Contato (WhatsApp, SMS, e-mail)** fica numa tabela que só o dono lê. O outro lado recebe por `contato_da_conversa()`, e só depois que os dois compartilharam na conversa.
- **O lado de quem escreve** a mensagem vem do login, não do navegador. A conversa guarda quem escreveu por último, que é a base da tela "Sem resposta".
- **Candidaturas**: só em vaga aberta, uma por vaga, sempre entram como "Novo". O profissional só retira; a empresa move entre Novo, Em conversa e Não selecionado. "Contratado" e "Vaga encerrada" são do sistema. Encerrar a vaga avisa quem ainda estava no processo.
- **Vagas**: para publicar, presencial e híbrida precisam de local e raio. A primeira publicação começa os 3 meses grátis. O plano limita as vagas ativas (3) e os convites do mês (30). Com o período grátis vencido não se publica nem reativa vaga. Vaga encerrada não reabre. Destaque só com pagamento.
- **Contratação**: um lado registra o combinado e só o outro confirma, contesta (com explicação) ou recusa. O combinado só muda depois de uma contestação, por quem o registrou, e volta para confirmação. Só registra contratação quem tem candidatura, convite ou conversa com a outra parte. Confirmada, a candidatura vira "Contratado" e a experiência verificada entra no perfil. Ela não pode ser editada nem apagada, só dá para ocultar o nome da empresa.
- **Avaliação cega**: abre quando um dos lados registra o fim do vínculo e fica aberta por 7 dias. É uma por lado e não muda depois de enviada. Ninguém vê a do outro até os dois enviarem ou o prazo acabar. Quem foi avaliado pode responder.
- **Reputação** (`reputacao_profissionais`, `reputacao_empresas`): usa só avaliações publicadas de vínculos confirmados. Com menos de 3 avaliações, marca "em construção".
- **Moderação**: verificar empresa ou perfil e remover avaliação só pelo painel (service_role). Contratações e avaliações ficam registradas na tabela `auditoria`.
- **Currículos**: bucket privado `curriculos`, só PDF de até 5 MB, em `curriculos/<id do profissional>/arquivo.pdf`. A empresa só lê o currículo de uma candidatura às vagas dela.

## Testar o esquema

`supabase/tests/rls_regras.sql` simula duas empresas, dois profissionais e um visitante sem conta,
e confere as regras acima. São 113 verificações. **Rode só num projeto de teste**, porque o
arquivo cria usuários fictícios.

- No Supabase: crie um projeto de teste, aplique o esquema e rode o arquivo de testes no SQL Editor.
  A última consulta mostra "113 / 113 passaram".
- Localmente, com PostgreSQL 16, num banco vazio:
  ```
  psql -d kor -f supabase/tests/supabase_local_stub.sql   # imita os esquemas auth e storage do Supabase
  psql -d kor -f supabase/migrations/20261002000000_esquema_inicial.sql
  psql -d kor -f supabase/tests/rls_regras.sql
  ```

## Decisões ainda em aberto (documento de visão)

O esquema segue o que já está definido. Estes pontos usam um padrão provisório, fácil de mudar
depois:

- **Excluir conta**: hoje apaga tudo da pessoa, inclusive as avaliações (seção 15: apagar, anonimizar ou regra por país).
- **Faixas de reputação**: hoje a média é simples e "em construção" vale abaixo de 3 avaliações. Ainda não entram a média bayesiana nem o peso da recência (seção 8.6).
- **Avaliação em vínculo longo**: hoje só ao fim do vínculo. Faltam os marcos periódicos (seção 8.2).
- **Vaga e destaque avulsos**: as tabelas estão prontas, mas os preços ainda estão pendentes (seção 16).

## Problemas comuns no cadastro

A tela de cadastro mostra a explicação e, entre parênteses, o código técnico do erro.

| O que aparece | Causa | Como resolver |
| --- | --- | --- |
| "…modo de teste e só aceita endereços da equipe" (`email_address_not_authorized`) | Sem SMTP próprio, o Supabase só envia e-mail para membros da organização do projeto | Configure um SMTP em **Authentication → Emails → SMTP Settings** (ex.: o mesmo provedor usado no KORbuild Finances) |
| "Não conseguimos enviar o e-mail de confirmação" (`Error sending confirmation email`) | Falha no envio: SMTP com dados errados, remetente não verificado ou erro no modelo do e-mail | Confira o SMTP e o modelo em **Emails → Templates**; veja o motivo em **Logs → Auth** |
| "Muitas tentativas em pouco tempo" (`over_email_send_rate_limit`) | Limite de e-mails por hora (o envio padrão permite poucos) | Espere, ou configure SMTP próprio e aumente o limite em **Authentication → Rate Limits** |
| "Não conseguimos criar a conta agora" (`Database error saving new user`) | Erro no gatilho que cria o perfil no banco | Veja o motivo em **Logs → Postgres** e me envie a mensagem |
