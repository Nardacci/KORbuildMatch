# KORbuild Match — banco de dados no Supabase

Este guia leva o protótipo para um banco de dados real, em etapas. A primeira etapa (este
arquivo + `supabase/migrations/`) cria o banco com todas as regras de acesso. O site ainda
não usa o banco: isso começa na etapa 2.

## Etapas

| Etapa | O que entra | Situação |
| --- | --- | --- |
| 1. Esquema | Tabelas, regras de acesso (RLS), regras de negócio, currículos, mensagens em tempo real | **Pronto** e aplicado |
| 2. Contas | Cadastro, confirmação de e-mail, entrar, sair, recuperar senha, perfil da empresa e do profissional | **Pronto**: `app/` |
| 3. Vagas e candidaturas | Publicar vaga, buscar, candidatar-se, funil de candidatos, convites, salvos | Próxima |
| 4. Mensagens | Conversas em tempo real, "Sem resposta", liberação do WhatsApp | |
| 5. Contratação e reputação | Combinado, confirmação, contestação, avaliação cega, reputação | |
| 6. Avisos e plano | E-mails e notificações, lembrete de 7 dias, cobrança do plano | |

Enquanto isso, o protótipo com dados fictícios continua no ar como demonstração, na raiz do site.
A versão real fica em `app/` (ex.: `korbuildmatch.com/app/entrar.html`).

## Versão real (`app/`)

| Arquivo | O que faz |
| --- | --- |
| `app/config.js` | Endereço do projeto e chave publicável. Só a publicável: a secreta nunca vai para o site. |
| `app/dados.js` | Listas dos formulários (países, cidades com ponto aproximado, portes, disponibilidade). |
| `app/app.js` | As telas: `entrar`, `cadastro`, `recuperar`, `nova-senha`, `inicio`, `perfil`. |
| `assets/vendor/supabase-js-2.117.2.js` | Biblioteca oficial do Supabase, guardada no site (sem depender de CDN). |

- **Cadastro**: envia `tipo`, `nome` e o que a pessoa digitou (país e setor, ou cidade e "o que você faz"). O banco cria o perfil; no primeiro acesso, o site completa o perfil com esses dados.
- **Confirmação de e-mail**: o link do e-mail abre `app/inicio.html` já com a sessão. Se o link vencer, a pessoa entra com e-mail e senha ou pede outro link.
- **Recuperar senha**: o link abre `app/nova-senha.html`. A resposta é a mesma exista ou não a conta, para não revelar quem está cadastrado.
- **Início**: mostra o que falta no perfil (progresso) e leva para editar.
- **Perfil**: empresa (setor, porte, sede, site, sobre) ou profissional (o que faz, cidade, disponibilidade, distância, modelos, competências, aparecer nas buscas), mais o contato e a troca de senha.
- **Cidades**: por enquanto, a mesma lista fixa do protótipo. Para aceitar qualquer cidade, a próxima evolução é um serviço de busca de endereços (geocodificação).

Teste automatizado: `docs/tests/contas-supabase-simulado.js` roda as telas num navegador contra um Supabase simulado (37 verificações).

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
e confere as regras acima. São 109 verificações. **Rode só num projeto de teste**, porque o
arquivo cria usuários fictícios.

- No Supabase: crie um projeto de teste, aplique o esquema e rode o arquivo de testes no SQL Editor.
  A última consulta mostra "109 / 109 passaram".
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
