-- =============================================================================
-- KORbuild Match — esquema inicial do banco (Supabase / PostgreSQL)
--
-- Como aplicar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- (ou, com a CLI: supabase db push). Veja docs/supabase.md.
--
-- Princípios:
--   • Toda tabela tem RLS (Row Level Security) ligado: cada pessoa só lê e altera o
--     que é dela ou o que a regra de negócio permite. A chave "anon" do site pode
--     ficar pública; a "service_role" nunca vai para o navegador.
--   • As regras importantes (quem confirma uma contratação, avaliação cega, limite de
--     vagas ativas, liberação do contato) ficam no banco, não no navegador.
--   • Localização é sempre um ponto aproximado (centro do bairro ou da cidade),
--     nunca o endereço. Telefone e e-mail de contato ficam numa tabela à parte,
--     liberada só quando os dois lados de uma conversa compartilham.
--   • Nomes em português, sem acento, como no protótipo.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Funções de apoio
-- -----------------------------------------------------------------------------

-- Atualiza "atualizado_em" em toda alteração.
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

-- Ações feitas pelo próprio banco (gatilhos do sistema) ligam esta marca para
-- passar pelas travas que valem para as pessoas. Dura só até o fim da transação.
create or replace function public.eh_sistema()
returns boolean language sql stable as $$
  select coalesce(current_setting('kor.sistema', true), '') = 'on' or auth.uid() is null
$$;

create or replace function public.ligar_sistema(ligado boolean)
returns void language sql as $$
  select set_config('kor.sistema', case when ligado then 'on' else 'off' end, true)
$$;

-- Ninguém chama esta função pela API; só os gatilhos do próprio banco.
revoke execute on function public.ligar_sistema(boolean) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 1. Contas e perfis
-- -----------------------------------------------------------------------------

-- Toda conta é de empresa ou de profissional (seção 5). O tipo vem do cadastro.
create table public.perfis (
  id         uuid primary key references auth.users (id) on delete cascade,
  tipo       text not null check (tipo in ('empresa', 'profissional')),
  nome       text not null check (char_length(nome) between 2 and 120),
  criado_em  timestamptz not null default now()
);

create table public.empresas (
  id             uuid primary key default gen_random_uuid(),
  dono           uuid not null unique references auth.users (id) on delete cascade,
  nome           text not null check (char_length(nome) between 2 and 120),
  setor          text,
  porte          text check (porte in ('1 a 9 pessoas', '10 a 49 pessoas', '50 a 249 pessoas', '250 pessoas ou mais')),
  site           text,
  descricao      text check (char_length(descricao) <= 1000),
  -- Sede: ponto de partida da distância na busca de profissionais.
  cidade         text,
  estado         text,
  pais           text,
  lat            numeric(8, 5) check (lat between -90 and 90),
  lng            numeric(8, 5) check (lng between -180 and 180),
  verificada     boolean not null default false,  -- só a moderação muda
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- Outras unidades da empresa (perfil público).
create table public.empresa_locais (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  cidade      text not null,
  estado      text,
  pais        text not null,
  lat         numeric(8, 5) check (lat between -90 and 90),
  lng         numeric(8, 5) check (lng between -180 and 180)
);

create table public.profissionais (
  id                uuid primary key references auth.users (id) on delete cascade,
  nome              text not null check (char_length(nome) between 2 and 120),
  resumo            text check (char_length(resumo) <= 160),
  sobre             text check (char_length(sobre) <= 1000),
  cidade            text,
  estado            text,
  pais              text,
  lat               numeric(8, 5) check (lat between -90 and 90),
  lng               numeric(8, 5) check (lng between -180 and 180),
  disponibilidade   text,
  distancia_max_km  integer not null default 25 check (distancia_max_km between 1 and 500),
  aceita_mudar      boolean not null default false,
  modelos           text[] not null default '{presencial}' check (modelos <@ array['presencial', 'hibrido', 'remoto']),
  competencias      text[] not null default '{}' check (coalesce(array_length(competencias, 1), 0) <= 12),
  idiomas           jsonb not null default '[]',   -- [{ "idioma": "Inglês", "nivel": "Intermediário" }]
  formacao          text[] not null default '{}',
  verificado        boolean not null default false,  -- só a moderação muda
  visivel           boolean not null default true,   -- aparece em buscas e indicações
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

-- Contato privado (WhatsApp, SMS ou e-mail). Ninguém lê esta tabela diretamente,
-- só o dono. O outro lado recebe o contato por contato_da_conversa(), e só depois
-- que os dois compartilharem na conversa (seção 9).
create table public.contatos (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  canal     text not null default 'whatsapp' check (canal in ('whatsapp', 'sms', 'email')),
  telefone  text check (telefone ~ '^\+?[0-9 ()-]{8,20}$'),
  email     text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Experiências do profissional. As declaradas são escritas pela própria pessoa;
-- as verificadas nascem de uma contratação confirmada pelos dois lados e não podem
-- ser editadas (só dá para ocultar o nome da empresa).
create table public.experiencias (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null references public.profissionais (id) on delete cascade,
  cargo            text not null check (char_length(cargo) between 2 and 120),
  empresa_nome     text not null check (char_length(empresa_nome) between 2 and 120),
  inicio           date,
  fim              date check (fim is null or inicio is null or fim >= inicio),
  contratacao_id   uuid,  -- preenchido = experiência verificada (FK no fim do arquivo)
  mostrar_empresa  boolean not null default true,
  criado_em        timestamptz not null default now()
);

create trigger empresas_atualizado before update on public.empresas
  for each row execute function public.tocar_atualizado_em();
create trigger profissionais_atualizado before update on public.profissionais
  for each row execute function public.tocar_atualizado_em();


-- -----------------------------------------------------------------------------
-- 2. Plano da empresa (seção 16)
-- -----------------------------------------------------------------------------

-- Nasce na primeira vaga publicada, com 3 meses grátis. Só o servidor (service_role,
-- quando a cobrança existir) altera; a empresa só lê.
create table public.assinaturas (
  empresa_id           uuid primary key references public.empresas (id) on delete cascade,
  plano                text not null default 'essencial' check (plano in ('essencial')),
  status               text not null default 'gratis' check (status in ('gratis', 'ativa', 'encerrada')),
  gratis_desde         timestamptz not null default now(),
  gratis_ate           timestamptz not null default (now() + interval '3 months'),
  limite_vagas_ativas  integer not null default 3,
  limite_convites_mes  integer not null default 30,
  atualizado_em        timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- 3. Vagas (seção 7)
-- -----------------------------------------------------------------------------

create table public.vagas (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  titulo         text not null check (char_length(titulo) between 3 and 120),
  descricao      text check (char_length(descricao) <= 4000),
  status         text not null default 'rascunho'
                 check (status in ('rascunho', 'aberta', 'pausada', 'preenchida', 'cancelada', 'expirada')),
  modelo         text not null default 'presencial' check (modelo in ('presencial', 'hibrido', 'remoto')),
  tipo           text check (tipo in ('integral', 'meio_periodo', 'temporario', 'freelancer')),
  moeda          text check (moeda in ('BRL', 'USD', 'EUR', 'GBP')),
  salario_min    numeric(12, 2) check (salario_min >= 0),
  salario_max    numeric(12, 2) check (salario_max >= 0),
  periodo        text check (periodo in ('hora', 'mes', 'ano')),
  posicoes       integer not null default 1 check (posicoes between 1 and 100),
  -- Local (presencial e híbrido): ponto aproximado e raio de busca.
  cidade         text,
  estado         text,
  pais           text,
  lat            numeric(8, 5) check (lat between -90 and 90),
  lng            numeric(8, 5) check (lng between -180 and 180),
  raio_valor     integer check (raio_valor between 1 and 500),
  raio_unidade   text check (raio_unidade in ('km', 'mi')),
  -- Remoto: fuso de referência opcional (horas a partir do UTC).
  fuso           smallint check (fuso between -12 and 14),
  experiencia    text,
  requisitos     jsonb not null default '[]',  -- ["Atendimento ao público", ...]
  competencias   text[] not null default '{}' check (coalesce(array_length(competencias, 1), 0) <= 12),
  idiomas        jsonb not null default '[]',
  -- Até 3 perguntas de triagem, nenhuma eliminatória: [{ "texto": "...", "tipo": "sim_nao"|"opcoes", "opcoes": [...] }]
  triagem        jsonb not null default '[]' check (jsonb_typeof(triagem) = 'array' and jsonb_array_length(triagem) <= 3),
  publicada_em   timestamptz,
  expira_em      timestamptz,
  encerrada_em   timestamptz,
  destaque_ate   timestamptz,  -- vaga patrocinada (opção avulsa)
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  constraint vaga_salario_faixa check (salario_max is null or salario_min is null or salario_max >= salario_min),
  -- Rascunho pode ficar incompleto; para publicar, presencial/híbrida precisa de local e raio.
  constraint vaga_local_para_publicar check (
    status = 'rascunho' or modelo = 'remoto'
    or (cidade is not null and pais is not null and lat is not null and lng is not null and raio_valor is not null and raio_unidade is not null)
  )
);

create index vagas_empresa_idx on public.vagas (empresa_id);
create index vagas_abertas_idx on public.vagas (status, publicada_em desc) where status = 'aberta';

create trigger vagas_atualizado before update on public.vagas
  for each row execute function public.tocar_atualizado_em();


-- -----------------------------------------------------------------------------
-- 4. Candidaturas, convites, conexões
-- -----------------------------------------------------------------------------

create table public.candidaturas (
  id                 uuid primary key default gen_random_uuid(),
  vaga_id            uuid not null references public.vagas (id) on delete cascade,
  profissional_id    uuid not null references public.profissionais (id) on delete cascade,
  status             text not null default 'novo'
                     check (status in ('novo', 'conversa', 'nao', 'contratado', 'retirada', 'encerrada')),
  mensagem           text check (char_length(mensagem) <= 1000),
  respostas_triagem  jsonb not null default '{}',  -- { "0": "Sim", "1": "Avançado" }
  pretensao_valor    numeric(12, 2) check (pretensao_valor >= 0),
  pretensao_moeda    text check (pretensao_moeda in ('BRL', 'USD', 'EUR', 'GBP')),
  pretensao_periodo  text check (pretensao_periodo in ('hora', 'mes', 'ano')),
  curriculo_path     text,  -- caminho no bucket "curriculos" (Storage)
  criado_em          timestamptz not null default now(),
  status_em          timestamptz not null default now(),  -- última mudança de status (prazo de 7 dias)
  unique (vaga_id, profissional_id)
);

create index candidaturas_profissional_idx on public.candidaturas (profissional_id);

-- Convite direto da empresa (seção 7.1). Conta no limite mensal do plano.
create table public.convites (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas (id) on delete cascade,
  profissional_id  uuid not null references public.profissionais (id) on delete cascade,
  vaga_id          uuid references public.vagas (id) on delete set null,
  mensagem         text check (char_length(mensagem) <= 500),
  status           text not null default 'enviado' check (status in ('enviado', 'aceito', 'recusado')),
  criado_em        timestamptz not null default now()
);

create index convites_profissional_idx on public.convites (profissional_id);

-- Talentos salvos pela empresa (seção 9).
create table public.salvos (
  empresa_id       uuid not null references public.empresas (id) on delete cascade,
  profissional_id  uuid not null references public.profissionais (id) on delete cascade,
  criado_em        timestamptz not null default now(),
  primary key (empresa_id, profissional_id)
);

-- Empresas que o profissional segue (avisos de vaga nova).
create table public.seguindo (
  profissional_id  uuid not null references public.profissionais (id) on delete cascade,
  empresa_id       uuid not null references public.empresas (id) on delete cascade,
  criado_em        timestamptz not null default now(),
  primary key (profissional_id, empresa_id)
);


-- -----------------------------------------------------------------------------
-- 5. Conversas e mensagens (seção 9)
-- -----------------------------------------------------------------------------

-- Uma conversa por par empresa–profissional; a vaga é só o assunto mais recente.
create table public.conversas (
  id                         uuid primary key default gen_random_uuid(),
  empresa_id                 uuid not null references public.empresas (id) on delete cascade,
  profissional_id            uuid not null references public.profissionais (id) on delete cascade,
  vaga_id                    uuid references public.vagas (id) on delete set null,
  compartilhou_empresa       boolean not null default false,
  compartilhou_profissional  boolean not null default false,
  lido_empresa_em            timestamptz,
  lido_profissional_em       timestamptz,
  ultima_mensagem_em         timestamptz,
  ultima_mensagem_de         text check (ultima_mensagem_de in ('empresa', 'profissional')),  -- "sem resposta"
  deu_certo_empresa          text check (deu_certo_empresa in ('sim', 'nao')),
  deu_certo_profissional     text check (deu_certo_profissional in ('sim', 'nao')),
  criado_em                  timestamptz not null default now(),
  unique (empresa_id, profissional_id)
);

create table public.mensagens (
  id           bigint generated always as identity primary key,
  conversa_id  uuid not null references public.conversas (id) on delete cascade,
  autor        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  de           text not null check (de in ('empresa', 'profissional')),
  texto        text not null check (char_length(btrim(texto)) between 1 and 2000),
  criado_em    timestamptz not null default now()
);

create index mensagens_conversa_idx on public.mensagens (conversa_id, criado_em);


-- -----------------------------------------------------------------------------
-- 6. Contratações e o combinado (seções 7.2 e 7.3)
-- -----------------------------------------------------------------------------

-- Um lado registra a contratação com o combinado; o outro confirma, contesta ou recusa.
-- Só "confirmado" vira vínculo verificado (histórico + reputação).
create table public.contratacoes (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references public.empresas (id) on delete cascade,
  profissional_id     uuid not null references public.profissionais (id) on delete cascade,
  vaga_id             uuid references public.vagas (id) on delete set null,
  candidatura_id      uuid references public.candidaturas (id) on delete set null,
  registrada_por      text not null check (registrada_por in ('empresa', 'profissional')),
  -- O combinado
  funcao              text not null check (char_length(funcao) between 2 and 120),
  tipo                text check (tipo in ('integral', 'meio_periodo', 'temporario', 'freelancer')),
  moeda               text check (moeda in ('BRL', 'USD', 'EUR', 'GBP')),
  valor               numeric(12, 2) check (valor >= 0),
  periodo             text check (periodo in ('hora', 'mes', 'ano')),
  data_inicio         date,
  jornada             text check (char_length(jornada) <= 120),
  -- Andamento
  status              text not null default 'aguardando'
                      check (status in ('aguardando', 'confirmado', 'contestado', 'recusado')),
  contestacao_texto   text check (char_length(contestacao_texto) <= 500),
  resposta_texto      text check (char_length(resposta_texto) <= 500),  -- quem registrou responde à contestação
  recusa_contestada   boolean not null default false,  -- vai para a moderação
  confirmada_em       timestamptz,
  -- Fim do vínculo abre a avaliação (seção 8.2), que fica aberta até avaliar_ate.
  encerrada_em        date,
  avaliar_ate         timestamptz,
  criado_em           timestamptz not null default now()
);

create index contratacoes_empresa_idx on public.contratacoes (empresa_id);
create index contratacoes_profissional_idx on public.contratacoes (profissional_id);

alter table public.experiencias
  add constraint experiencias_contratacao_fk foreign key (contratacao_id)
  references public.contratacoes (id) on delete cascade;
create unique index experiencias_contratacao_unica on public.experiencias (contratacao_id) where contratacao_id is not null;


-- -----------------------------------------------------------------------------
-- 7. Avaliações cegas (seção 8)
-- -----------------------------------------------------------------------------

create table public.avaliacoes (
  id              uuid primary key default gen_random_uuid(),
  contratacao_id  uuid not null references public.contratacoes (id) on delete cascade,
  autor_tipo      text not null check (autor_tipo in ('empresa', 'profissional')),
  -- Respostas objetivas: "Sim" | "Não" | "Parcialmente".
  -- Empresa → profissional: entregou, horarios, comunicacao, novamente
  -- Profissional → empresa: pagamento, anuncio, condicoes, ambiente, novamente
  respostas       jsonb not null,
  nota            smallint not null check (nota between 1 and 5),
  comentario      text check (char_length(comentario) <= 300),
  resposta        text check (char_length(resposta) <= 300),  -- direito de resposta de quem foi avaliado
  removida        boolean not null default false,              -- moderação (seção 8.5)
  criado_em       timestamptz not null default now(),
  unique (contratacao_id, autor_tipo)
);


-- -----------------------------------------------------------------------------
-- 8. Denúncias, notificações, auditoria
-- -----------------------------------------------------------------------------

create table public.denuncias (
  id         uuid primary key default gen_random_uuid(),
  autor      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alvo_tipo  text not null check (alvo_tipo in ('vaga', 'empresa', 'profissional', 'conversa', 'avaliacao')),
  alvo_id    uuid not null,
  motivo     text not null check (char_length(motivo) between 2 and 80),
  detalhe    text check (char_length(detalhe) <= 500),
  status     text not null default 'em_analise' check (status in ('em_analise', 'procedente', 'improcedente')),
  criado_em  timestamptz not null default now()
);

-- Como receber cada tipo de aviso (seção 11): no app (push) e por e-mail.
create table public.notificacao_prefs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  categoria  text not null check (categoria in ('mensagens', 'candidaturas', 'vagas', 'contratacao', 'avaliacoes', 'convites')),
  push       boolean not null default true,
  email      boolean not null default true,
  primary key (user_id, categoria)
);

-- Registro de ações sensíveis (seção 15): mudanças em contratações e avaliações.
create table public.auditoria (
  id         bigint generated always as identity primary key,
  quem       uuid,
  tabela     text not null,
  registro   uuid not null,
  acao       text not null,
  antes      jsonb,
  depois     jsonb,
  criado_em  timestamptz not null default now()
);


-- =============================================================================
-- FUNÇÕES DE ACESSO (security definer: consultam sem cair em recursão de RLS)
-- =============================================================================

create or replace function public.minha_empresa()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.empresas where dono = auth.uid()
$$;

create or replace function public.eh_dono_empresa(p_empresa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.empresas where id = p_empresa and dono = auth.uid())
$$;

create or replace function public.eh_dono_vaga(p_vaga uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vagas v join public.empresas e on e.id = v.empresa_id
                 where v.id = p_vaga and e.dono = auth.uid())
$$;

-- 'empresa', 'profissional' ou null: o papel de quem está logado numa empresa/profissional.
create or replace function public.meu_lado(p_empresa uuid, p_profissional uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.empresas where id = p_empresa and dono = auth.uid()) then 'empresa'
    when p_profissional = auth.uid() then 'profissional'
  end
$$;

-- O profissional se candidatou a alguma vaga da empresa logada? (para ela ver o perfil
-- mesmo que ele esteja oculto das buscas)
create or replace function public.candidatou_a_mim(p_profissional uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.candidaturas c join public.vagas v on v.id = c.vaga_id
                 join public.empresas e on e.id = v.empresa_id
                 where c.profissional_id = p_profissional and e.dono = auth.uid())
$$;


-- =============================================================================
-- GATILHOS DE REGRA DE NEGÓCIO
-- =============================================================================

-- Novo usuário do Supabase Auth → cria perfil e a linha de empresa ou profissional.
-- O cadastro envia { tipo, nome } em options.data (raw_user_meta_data).
create or replace function public.criar_conta()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tipo text := new.raw_user_meta_data ->> 'tipo';
  v_nome text := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1));
begin
  if v_tipo not in ('empresa', 'profissional') then
    return new;  -- conta sem tipo (ex.: criada no painel): o app pede o tipo depois
  end if;
  insert into public.perfis (id, tipo, nome) values (new.id, v_tipo, v_nome);
  if v_tipo = 'empresa' then
    insert into public.empresas (dono, nome) values (new.id, v_nome);
  else
    insert into public.profissionais (id, nome) values (new.id, v_nome);
  end if;
  insert into public.contatos (user_id, email) values (new.id, new.email);
  return new;
end $$;

create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_conta();

-- Empresa: verificada é só da moderação.
create or replace function public.guarda_empresa()
returns trigger language plpgsql as $$
begin
  if not public.eh_sistema() and (new.verificada is distinct from old.verificada or new.dono is distinct from old.dono) then
    raise exception 'Só a moderação altera a verificação da empresa.';
  end if;
  return new;
end $$;

create trigger empresas_guarda before update on public.empresas
  for each row execute function public.guarda_empresa();

create or replace function public.guarda_profissional()
returns trigger language plpgsql as $$
begin
  if not public.eh_sistema() and new.verificado is distinct from old.verificado then
    raise exception 'Só a moderação altera a verificação do perfil.';
  end if;
  return new;
end $$;

create trigger profissionais_guarda before update on public.profissionais
  for each row execute function public.guarda_profissional();

-- Experiência verificada não se edita (só dá para ocultar a empresa) e não se cria à mão.
create or replace function public.guarda_experiencia()
returns trigger language plpgsql as $$
begin
  if public.eh_sistema() then return coalesce(new, old); end if;
  if tg_op = 'INSERT' and new.contratacao_id is not null then
    raise exception 'Experiência verificada só nasce de uma contratação confirmada.';
  end if;
  if tg_op = 'UPDATE' and old.contratacao_id is not null and (
       new.cargo, new.empresa_nome, new.inicio, new.fim, new.contratacao_id, new.profissional_id)
       is distinct from (old.cargo, old.empresa_nome, old.inicio, old.fim, old.contratacao_id, old.profissional_id) then
    raise exception 'Experiência verificada não pode ser editada; só dá para ocultar o nome da empresa.';
  end if;
  if tg_op = 'UPDATE' and old.contratacao_id is null and new.contratacao_id is not null then
    raise exception 'Experiência declarada não vira verificada à mão.';
  end if;
  if tg_op = 'DELETE' and old.contratacao_id is not null then
    raise exception 'Experiência verificada não pode ser apagada; só dá para ocultar o nome da empresa.';
  end if;
  return coalesce(new, old);
end $$;

create trigger experiencias_guarda before insert or update or delete on public.experiencias
  for each row execute function public.guarda_experiencia();

-- Vagas: publicar exige plano válido e respeita o limite de vagas ativas.
create or replace function public.regras_vaga()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  a public.assinaturas;
  ativas integer;
begin
  if new.status = 'aberta' and (tg_op = 'INSERT' or old.status is distinct from 'aberta') then
    -- Primeira vaga publicada: começa o período grátis (3 meses).
    insert into public.assinaturas (empresa_id) values (new.empresa_id) on conflict do nothing;
    select * into a from public.assinaturas where empresa_id = new.empresa_id;
    if a.status = 'encerrada' or (a.status = 'gratis' and a.gratis_ate < now()) then
      raise exception 'O período grátis terminou. Escolha um plano para publicar ou reativar vagas.';
    end if;
    select count(*) into ativas from public.vagas
      where empresa_id = new.empresa_id and status = 'aberta' and id <> new.id;
    if ativas >= a.limite_vagas_ativas then
      raise exception 'Seu plano permite % vagas ativas. Pause ou encerre uma vaga para publicar outra.', a.limite_vagas_ativas;
    end if;
    new.publicada_em := coalesce(new.publicada_em, now());
  end if;
  if tg_op = 'UPDATE' then
    if new.empresa_id is distinct from old.empresa_id then
      raise exception 'A vaga não pode mudar de empresa.';
    end if;
    if old.status in ('preenchida', 'cancelada', 'expirada') and new.status is distinct from old.status then
      raise exception 'Vaga encerrada não volta a abrir. Publique uma nova vaga.';
    end if;
    if new.status in ('preenchida', 'cancelada', 'expirada') and old.status is distinct from new.status then
      new.encerrada_em := now();
    end if;
    if not public.eh_sistema() and new.destaque_ate is distinct from old.destaque_ate then
      raise exception 'O destaque é ativado pelo pagamento.';
    end if;
  end if;
  return new;
end $$;

create trigger vagas_regras before insert or update on public.vagas
  for each row execute function public.regras_vaga();

-- Vaga encerrada → quem ainda estava no processo é avisado (status "encerrada").
create or replace function public.encerrar_candidaturas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('preenchida', 'cancelada', 'expirada') and old.status is distinct from new.status then
    perform public.ligar_sistema(true);
    update public.candidaturas set status = 'encerrada', status_em = now()
      where vaga_id = new.id and status in ('novo', 'conversa');
    perform public.ligar_sistema(false);
  end if;
  return null;
end $$;

create trigger vagas_encerrar after update on public.vagas
  for each row execute function public.encerrar_candidaturas();

-- Candidaturas: só em vaga aberta; o profissional só retira; a empresa move entre
-- novo/conversa/não selecionado. "contratado" e "encerrada" vêm do sistema.
create or replace function public.regras_candidatura()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not public.eh_sistema() then
      if not exists (select 1 from public.vagas where id = new.vaga_id and status = 'aberta') then
        raise exception 'Esta vaga não está recebendo candidaturas.';
      end if;
      new.status := 'novo';
      new.criado_em := now();
      new.status_em := now();
    end if;
    return new;
  end if;

  if (new.vaga_id, new.profissional_id, new.criado_em) is distinct from (old.vaga_id, old.profissional_id, old.criado_em) then
    raise exception 'Vaga, profissional e data da candidatura não mudam.';
  end if;
  if new.status is distinct from old.status then
    new.status_em := now();
    if not public.eh_sistema() then
      if auth.uid() = old.profissional_id then
        if not (new.status = 'retirada' and old.status in ('novo', 'conversa')) then
          raise exception 'Você só pode retirar uma candidatura em andamento.';
        end if;
      elsif public.eh_dono_vaga(old.vaga_id) then
        if new.status not in ('novo', 'conversa', 'nao') or old.status in ('contratado', 'retirada', 'encerrada') then
          raise exception 'Mudança de status não permitida.';
        end if;
      else
        raise exception 'Sem permissão.';
      end if;
    end if;
  end if;
  -- O conteúdo enviado é do profissional; a empresa só muda o status.
  if not public.eh_sistema() and auth.uid() <> old.profissional_id and
     (new.mensagem, new.respostas_triagem, new.pretensao_valor, new.pretensao_moeda, new.pretensao_periodo, new.curriculo_path)
     is distinct from
     (old.mensagem, old.respostas_triagem, old.pretensao_valor, old.pretensao_moeda, old.pretensao_periodo, old.curriculo_path) then
    raise exception 'A empresa não altera o conteúdo da candidatura.';
  end if;
  return new;
end $$;

create trigger candidaturas_regras before insert or update on public.candidaturas
  for each row execute function public.regras_candidatura();

-- Convites: respeitam o limite mensal do plano; o profissional só aceita ou recusa.
create or replace function public.regras_convite()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  limite integer;
  usados integer;
begin
  if tg_op = 'INSERT' then
    select coalesce((select limite_convites_mes from public.assinaturas where empresa_id = new.empresa_id), 30) into limite;
    select count(*) into usados from public.convites
      where empresa_id = new.empresa_id and criado_em >= date_trunc('month', now());
    if usados >= limite then
      raise exception 'Você usou os % convites diretos deste mês.', limite;
    end if;
    new.status := 'enviado';
    new.criado_em := now();
    return new;
  end if;
  if not public.eh_sistema() then
    if auth.uid() <> old.profissional_id or new.status not in ('aceito', 'recusado') or
       (new.empresa_id, new.profissional_id, new.vaga_id, new.mensagem, new.criado_em)
       is distinct from (old.empresa_id, old.profissional_id, old.vaga_id, old.mensagem, old.criado_em) then
      raise exception 'Só quem recebeu o convite pode aceitá-lo ou recusá-lo.';
    end if;
  end if;
  return new;
end $$;

create trigger convites_regras before insert or update on public.convites
  for each row execute function public.regras_convite();

-- Conversas: cada lado só mexe nas próprias marcas; compartilhar não se desfaz.
create or replace function public.regras_conversa()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  lado text;
begin
  if public.eh_sistema() then return new; end if;
  lado := public.meu_lado(old.empresa_id, old.profissional_id);
  if (new.empresa_id, new.profissional_id, new.criado_em, new.ultima_mensagem_em, new.ultima_mensagem_de)
     is distinct from (old.empresa_id, old.profissional_id, old.criado_em, old.ultima_mensagem_em, old.ultima_mensagem_de) then
    raise exception 'Estes campos da conversa não mudam.';
  end if;
  if (old.compartilhou_empresa and not new.compartilhou_empresa) or (old.compartilhou_profissional and not new.compartilhou_profissional) then
    raise exception 'Contato compartilhado não pode ser retirado da conversa.';
  end if;
  if lado = 'empresa' and (new.compartilhou_profissional, new.lido_profissional_em, new.deu_certo_profissional)
     is distinct from (old.compartilhou_profissional, old.lido_profissional_em, old.deu_certo_profissional) then
    raise exception 'A empresa só altera as próprias marcas da conversa.';
  end if;
  if lado = 'profissional' and (new.compartilhou_empresa, new.lido_empresa_em, new.deu_certo_empresa, new.vaga_id)
     is distinct from (old.compartilhou_empresa, old.lido_empresa_em, old.deu_certo_empresa, old.vaga_id) then
    raise exception 'O profissional só altera as próprias marcas da conversa.';
  end if;
  return new;
end $$;

create trigger conversas_regras before update on public.conversas
  for each row execute function public.regras_conversa();

-- Mensagem: autor e lado vêm da sessão (não do navegador); atualiza a conversa.
create or replace function public.regras_mensagem()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c public.conversas;
begin
  select * into c from public.conversas where id = new.conversa_id;
  if not public.eh_sistema() then
    new.autor := auth.uid();
    new.de := public.meu_lado(c.empresa_id, c.profissional_id);
    if new.de is null then raise exception 'Você não participa desta conversa.'; end if;
    new.criado_em := now();
  end if;
  perform public.ligar_sistema(true);
  update public.conversas set
    ultima_mensagem_em = new.criado_em,
    ultima_mensagem_de = new.de,
    lido_empresa_em = case when new.de = 'empresa' then new.criado_em else lido_empresa_em end,
    lido_profissional_em = case when new.de = 'profissional' then new.criado_em else lido_profissional_em end
  where id = new.conversa_id;
  perform public.ligar_sistema(false);
  return new;
end $$;

create trigger mensagens_regras before insert on public.mensagens
  for each row execute function public.regras_mensagem();

-- Contratações: a confirmação é sempre do outro lado; o combinado só muda quando
-- foi contestado, e volta para "aguardando" (o outro lado confirma de novo).
create or replace function public.regras_contratacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  lado text;
  outro text;
begin
  if tg_op = 'INSERT' then
    if not public.eh_sistema() then
      lado := public.meu_lado(new.empresa_id, new.profissional_id);
      if lado is null or lado <> new.registrada_por then
        raise exception 'Você só registra contratações em seu próprio nome.';
      end if;
      if exists (select 1 from public.contratacoes where empresa_id = new.empresa_id and profissional_id = new.profissional_id
                 and status in ('aguardando', 'contestado')) then
        raise exception 'Já existe uma contratação aguardando resposta entre vocês.';
      end if;
      -- Só vira vínculo verificado o que começou na plataforma: candidatura, convite ou conversa.
      if not exists (select 1 from public.conversas where empresa_id = new.empresa_id and profissional_id = new.profissional_id)
         and not exists (select 1 from public.convites where empresa_id = new.empresa_id and profissional_id = new.profissional_id)
         and not exists (select 1 from public.candidaturas c join public.vagas v on v.id = c.vaga_id
                         where v.empresa_id = new.empresa_id and c.profissional_id = new.profissional_id) then
        raise exception 'Registre a contratação de alguém com quem você conversou ou que se candidatou pela plataforma.';
      end if;
      new.status := 'aguardando';
      new.confirmada_em := null;
      new.encerrada_em := null;
      new.avaliar_ate := null;
      new.recusa_contestada := false;
    end if;
    return new;
  end if;

  if public.eh_sistema() then return new; end if;
  lado := public.meu_lado(old.empresa_id, old.profissional_id);
  outro := case old.registrada_por when 'empresa' then 'profissional' else 'empresa' end;
  if lado is null then raise exception 'Sem permissão.'; end if;
  if (new.empresa_id, new.profissional_id, new.registrada_por, new.criado_em, new.vaga_id, new.candidatura_id)
     is distinct from (old.empresa_id, old.profissional_id, old.registrada_por, old.criado_em, old.vaga_id, old.candidatura_id) then
    raise exception 'Estes campos da contratação não mudam.';
  end if;
  if new.confirmada_em is distinct from old.confirmada_em or new.avaliar_ate is distinct from old.avaliar_ate then
    raise exception 'Datas de confirmação e de avaliação são do sistema.';
  end if;

  if new.status is distinct from old.status then
    if old.status = 'aguardando' and lado = outro and new.status in ('confirmado', 'contestado', 'recusado') then
      if new.status = 'contestado' and coalesce(btrim(new.contestacao_texto), '') = '' then
        raise exception 'Conte o que está diferente do combinado.';
      end if;
      if new.status = 'confirmado' then new.confirmada_em := now(); end if;
    elsif old.status = 'contestado' and lado = old.registrada_por and new.status = 'aguardando' then
      null;  -- corrigiu o combinado ou respondeu mantendo: volta para o outro lado confirmar
    else
      raise exception 'Mudança de status não permitida.';
    end if;
  end if;

  if (new.funcao, new.tipo, new.moeda, new.valor, new.periodo, new.data_inicio, new.jornada)
     is distinct from (old.funcao, old.tipo, old.moeda, old.valor, old.periodo, old.data_inicio, old.jornada)
     and not (old.status = 'contestado' and lado = old.registrada_por) then
    raise exception 'O combinado só muda quando foi contestado, e por quem o registrou.';
  end if;
  if new.contestacao_texto is distinct from old.contestacao_texto and not (lado = outro and new.status = 'contestado') then
    raise exception 'Só quem confirma pode contestar o combinado.';
  end if;
  if new.resposta_texto is distinct from old.resposta_texto and not (lado = old.registrada_por and old.status = 'contestado') then
    raise exception 'Só quem registrou responde à contestação.';
  end if;
  if new.recusa_contestada is distinct from old.recusa_contestada and
     not (old.status = 'recusado' and lado = old.registrada_por and new.recusa_contestada) then
    raise exception 'Só quem registrou pode contestar a recusa.';
  end if;
  if new.encerrada_em is distinct from old.encerrada_em then
    if old.status <> 'confirmado' or old.encerrada_em is not null then
      raise exception 'Só um vínculo confirmado e ainda ativo pode ser encerrado.';
    end if;
    if new.encerrada_em > current_date or new.encerrada_em < old.data_inicio then
      raise exception 'A data de fim precisa ser entre o início do vínculo e hoje.';
    end if;
    new.avaliar_ate := (new.encerrada_em + 7)::timestamptz + interval '1 day';  -- prazo de 7 dias, até o fim do dia
  end if;
  return new;
end $$;

create trigger contratacoes_regras before insert or update on public.contratacoes
  for each row execute function public.regras_contratacao();

-- Confirmada → candidatura "contratado", experiência verificada no perfil.
create or replace function public.efeitos_contratacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'confirmado' and old.status is distinct from 'confirmado' then
    perform public.ligar_sistema(true);
    if new.candidatura_id is not null then
      update public.candidaturas set status = 'contratado' where id = new.candidatura_id;
    end if;
    insert into public.experiencias (profissional_id, cargo, empresa_nome, inicio, contratacao_id)
      select new.profissional_id, new.funcao, e.nome, new.data_inicio, new.id
      from public.empresas e where e.id = new.empresa_id
      on conflict do nothing;
    perform public.ligar_sistema(false);
  end if;
  if new.encerrada_em is not null and old.encerrada_em is null then
    perform public.ligar_sistema(true);
    update public.experiencias set fim = new.encerrada_em where contratacao_id = new.id;
    perform public.ligar_sistema(false);
  end if;
  return null;
end $$;

create trigger contratacoes_efeitos after update on public.contratacoes
  for each row execute function public.efeitos_contratacao();

-- Avaliação: só de vínculo confirmado e encerrado, dentro do prazo, uma por lado.
-- Depois de enviada não muda; quem foi avaliado só escreve a resposta.
create or replace function public.regras_avaliacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  k public.contratacoes;
  lado text;
begin
  select * into k from public.contratacoes where id = coalesce(new.contratacao_id, old.contratacao_id);
  if public.eh_sistema() then return new; end if;
  lado := public.meu_lado(k.empresa_id, k.profissional_id);
  if tg_op = 'INSERT' then
    if lado is null or lado <> new.autor_tipo then raise exception 'Você só avalia em seu próprio nome.'; end if;
    if k.status <> 'confirmado' then raise exception 'Só existe avaliação de vínculo confirmado pelos dois lados.'; end if;
    if k.avaliar_ate is null or now() > k.avaliar_ate then raise exception 'A avaliação não está aberta para este vínculo.'; end if;
    new.resposta := null;
    new.removida := false;
    new.criado_em := now();
    return new;
  end if;
  if (new.contratacao_id, new.autor_tipo, new.respostas, new.nota, new.comentario, new.removida, new.criado_em)
     is distinct from (old.contratacao_id, old.autor_tipo, old.respostas, old.nota, old.comentario, old.removida, old.criado_em) then
    raise exception 'A avaliação enviada não pode ser alterada.';
  end if;
  if new.resposta is distinct from old.resposta and (lado is null or lado = old.autor_tipo) then
    raise exception 'Só quem foi avaliado pode responder.';
  end if;
  return new;
end $$;

create trigger avaliacoes_regras before insert or update on public.avaliacoes
  for each row execute function public.regras_avaliacao();

-- Auditoria de contratações e avaliações.
create or replace function public.auditar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.auditoria (quem, tabela, registro, acao, antes, depois)
  values (auth.uid(), tg_table_name, coalesce(new.id, old.id), lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return null;
end $$;

create trigger contratacoes_auditoria after insert or update or delete on public.contratacoes
  for each row execute function public.auditar();
create trigger avaliacoes_auditoria after insert or update or delete on public.avaliacoes
  for each row execute function public.auditar();


-- =============================================================================
-- RLS — QUEM LÊ E QUEM ESCREVE
-- =============================================================================

alter table public.perfis            enable row level security;
alter table public.empresas          enable row level security;
alter table public.empresa_locais    enable row level security;
alter table public.profissionais     enable row level security;
alter table public.contatos          enable row level security;
alter table public.experiencias      enable row level security;
alter table public.assinaturas       enable row level security;
alter table public.vagas             enable row level security;
alter table public.candidaturas      enable row level security;
alter table public.convites          enable row level security;
alter table public.salvos            enable row level security;
alter table public.seguindo          enable row level security;
alter table public.conversas         enable row level security;
alter table public.mensagens         enable row level security;
alter table public.contratacoes      enable row level security;
alter table public.avaliacoes        enable row level security;
alter table public.denuncias         enable row level security;
alter table public.notificacao_prefs enable row level security;
alter table public.auditoria         enable row level security;  -- sem políticas: só service_role

-- Perfis: cada um lê o próprio.
create policy perfis_ler on public.perfis for select to authenticated using (id = auth.uid());

-- Empresas: perfil público (inclusive para quem não entrou, como as vagas abertas).
create policy empresas_ler on public.empresas for select to anon, authenticated using (true);
create policy empresas_editar on public.empresas for update to authenticated
  using (dono = auth.uid()) with check (dono = auth.uid());

create policy empresa_locais_ler on public.empresa_locais for select to anon, authenticated using (true);
create policy empresa_locais_gerir on public.empresa_locais for all to authenticated
  using (public.eh_dono_empresa(empresa_id)) with check (public.eh_dono_empresa(empresa_id));

-- Profissionais: só quem entrou vê; perfis ocultos só aparecem para o dono e para
-- empresas a que a pessoa se candidatou.
create policy profissionais_ler on public.profissionais for select to authenticated
  using (visivel or id = auth.uid() or public.candidatou_a_mim(id));
create policy profissionais_editar on public.profissionais for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Contatos: só o dono (o outro lado usa contato_da_conversa).
create policy contatos_dono on public.contatos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Experiências: aparecem com o perfil; o dono gerencia as declaradas.
create policy experiencias_ler on public.experiencias for select to authenticated
  using (exists (select 1 from public.profissionais p where p.id = profissional_id));
create policy experiencias_inserir on public.experiencias for insert to authenticated
  with check (profissional_id = auth.uid());
create policy experiencias_editar on public.experiencias for update to authenticated
  using (profissional_id = auth.uid()) with check (profissional_id = auth.uid());
create policy experiencias_apagar on public.experiencias for delete to authenticated
  using (profissional_id = auth.uid());

-- Assinatura: a empresa só lê.
create policy assinaturas_ler on public.assinaturas for select to authenticated
  using (public.eh_dono_empresa(empresa_id));

-- Vagas: abertas são públicas; a empresa vê e gerencia todas as suas.
create policy vagas_ler on public.vagas for select to anon, authenticated
  using (status = 'aberta' or public.eh_dono_empresa(empresa_id)
         or exists (select 1 from public.candidaturas c where c.vaga_id = vagas.id and c.profissional_id = auth.uid()));
create policy vagas_inserir on public.vagas for insert to authenticated
  with check (public.eh_dono_empresa(empresa_id));
create policy vagas_editar on public.vagas for update to authenticated
  using (public.eh_dono_empresa(empresa_id)) with check (public.eh_dono_empresa(empresa_id));
create policy vagas_apagar_rascunho on public.vagas for delete to authenticated
  using (public.eh_dono_empresa(empresa_id) and status = 'rascunho');

-- Candidaturas: o profissional e a empresa da vaga.
create policy candidaturas_ler on public.candidaturas for select to authenticated
  using (profissional_id = auth.uid() or public.eh_dono_vaga(vaga_id));
create policy candidaturas_inserir on public.candidaturas for insert to authenticated
  with check (profissional_id = auth.uid());
create policy candidaturas_editar on public.candidaturas for update to authenticated
  using (profissional_id = auth.uid() or public.eh_dono_vaga(vaga_id))
  with check (profissional_id = auth.uid() or public.eh_dono_vaga(vaga_id));

-- Convites
create policy convites_ler on public.convites for select to authenticated
  using (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id));
create policy convites_inserir on public.convites for insert to authenticated
  with check (public.eh_dono_empresa(empresa_id));
create policy convites_responder on public.convites for update to authenticated
  using (profissional_id = auth.uid()) with check (profissional_id = auth.uid());

-- Salvos (empresa) e seguindo (profissional): privados.
create policy salvos_dono on public.salvos for all to authenticated
  using (public.eh_dono_empresa(empresa_id)) with check (public.eh_dono_empresa(empresa_id));
create policy seguindo_dono on public.seguindo for all to authenticated
  using (profissional_id = auth.uid()) with check (profissional_id = auth.uid());

-- Conversas e mensagens: só os dois participantes.
create policy conversas_ler on public.conversas for select to authenticated
  using (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id));
create policy conversas_criar on public.conversas for insert to authenticated
  with check (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id));
create policy conversas_editar on public.conversas for update to authenticated
  using (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id))
  with check (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id));

create policy mensagens_ler on public.mensagens for select to authenticated
  using (exists (select 1 from public.conversas c where c.id = conversa_id));  -- herda o RLS de conversas
create policy mensagens_enviar on public.mensagens for insert to authenticated
  with check (exists (select 1 from public.conversas c where c.id = conversa_id));

-- Contratações: os dois lados.
create policy contratacoes_ler on public.contratacoes for select to authenticated
  using (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id));
create policy contratacoes_registrar on public.contratacoes for insert to authenticated
  with check (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id));
create policy contratacoes_editar on public.contratacoes for update to authenticated
  using (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id))
  with check (profissional_id = auth.uid() or public.eh_dono_empresa(empresa_id));

-- Avaliações cegas: o autor vê a sua; as demais só depois de publicadas
-- (os dois enviaram ou o prazo terminou), e nunca as removidas pela moderação.
create or replace function public.avaliacao_publicada(p_contratacao uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (select count(*) from public.avaliacoes where contratacao_id = p_contratacao) = 2
      or coalesce((select avaliar_ate < now() from public.contratacoes where id = p_contratacao), false)
$$;

create policy avaliacoes_ler on public.avaliacoes for select to anon, authenticated
  using (
    (not removida and public.avaliacao_publicada(contratacao_id))
    or exists (select 1 from public.contratacoes k where k.id = contratacao_id
               and public.meu_lado(k.empresa_id, k.profissional_id) = autor_tipo)
  );
create policy avaliacoes_enviar on public.avaliacoes for insert to authenticated
  with check (exists (select 1 from public.contratacoes k where k.id = contratacao_id));
create policy avaliacoes_responder on public.avaliacoes for update to authenticated
  using (public.avaliacao_publicada(contratacao_id) and exists (select 1 from public.contratacoes k where k.id = contratacao_id))
  with check (exists (select 1 from public.contratacoes k where k.id = contratacao_id));

-- Denúncias: quem denunciou vê as suas.
create policy denuncias_ler on public.denuncias for select to authenticated using (autor = auth.uid());
create policy denuncias_enviar on public.denuncias for insert to authenticated with check (autor = auth.uid());

create policy notificacao_prefs_dono on public.notificacao_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());


-- =============================================================================
-- CONSULTAS PRONTAS
-- =============================================================================

-- Contato do outro lado de uma conversa, só depois que os dois compartilharam.
create or replace function public.contato_da_conversa(p_conversa uuid)
returns table (canal text, telefone text, email text)
language plpgsql stable security definer set search_path = public as $$
declare
  c public.conversas;
  lado text;
  alvo uuid;
begin
  select * into c from public.conversas where id = p_conversa;
  lado := public.meu_lado(c.empresa_id, c.profissional_id);
  if lado is null then raise exception 'Você não participa desta conversa.'; end if;
  if not (c.compartilhou_empresa and c.compartilhou_profissional) then
    raise exception 'O contato é liberado quando os dois compartilham.';
  end if;
  alvo := case lado when 'empresa' then c.profissional_id else (select dono from public.empresas where id = c.empresa_id) end;
  return query select ct.canal, ct.telefone, ct.email from public.contatos ct where ct.user_id = alvo;
end $$;

-- Reputação pública (seção 8.6), calculada só com avaliações publicadas de vínculos
-- verificados. Com menos de 3 avaliações o app mostra "Em construção" (faixas: [Pendente]).
create or replace view public.reputacao_profissionais as
  select p.id as profissional_id,
         count(distinct k.id) filter (where k.status = 'confirmado') as trabalhos,
         count(a.id) as avaliacoes,
         round(avg(a.nota), 1) as nota,
         round(100.0 * count(a.id) filter (where a.respostas ->> 'novamente' = 'Sim') / nullif(count(a.id), 0)) as contratariam_de_novo_pct,
         count(a.id) < 3 as em_construcao
  from public.profissionais p
  left join public.contratacoes k on k.profissional_id = p.id
  left join public.avaliacoes a on a.contratacao_id = k.id and a.autor_tipo = 'empresa' and not a.removida
       and ((select count(*) from public.avaliacoes x where x.contratacao_id = k.id) = 2 or k.avaliar_ate < now())
  group by p.id;

create or replace view public.reputacao_empresas as
  select e.id as empresa_id,
         count(distinct k.id) filter (where k.status = 'confirmado') as contratacoes,
         count(a.id) as avaliacoes,
         round(avg(a.nota), 1) as nota,
         round(100.0 * count(a.id) filter (where a.respostas ->> 'pagamento' = 'Sim') / nullif(count(a.id), 0)) as pagou_conforme_pct,
         round(100.0 * count(a.id) filter (where a.respostas ->> 'anuncio' = 'Sim') / nullif(count(a.id), 0)) as correspondia_pct,
         round(100.0 * count(a.id) filter (where a.respostas ->> 'novamente' = 'Sim') / nullif(count(a.id), 0)) as trabalhariam_de_novo_pct,
         count(a.id) < 3 as em_construcao
  from public.empresas e
  left join public.contratacoes k on k.empresa_id = e.id
  left join public.avaliacoes a on a.contratacao_id = k.id and a.autor_tipo = 'profissional' and not a.removida
       and ((select count(*) from public.avaliacoes x where x.contratacao_id = k.id) = 2 or k.avaliar_ate < now())
  group by e.id;

grant select on public.reputacao_profissionais to authenticated;
grant select on public.reputacao_empresas to anon, authenticated;


-- =============================================================================
-- STORAGE: currículos (privados) e REALTIME: mensagens
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculos', 'curriculos', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- Caminho: curriculos/<id do profissional>/<arquivo>.pdf
create policy curriculos_dono on storage.objects for all to authenticated
  using (bucket_id = 'curriculos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'curriculos' and (storage.foldername(name))[1] = auth.uid()::text);

-- A empresa lê o currículo enviado numa candidatura a uma vaga dela.
create policy curriculos_empresa on storage.objects for select to authenticated
  using (bucket_id = 'curriculos' and exists (
    select 1 from public.candidaturas c
    where c.curriculo_path = name and public.eh_dono_vaga(c.vaga_id)));

alter publication supabase_realtime add table public.mensagens, public.conversas;
