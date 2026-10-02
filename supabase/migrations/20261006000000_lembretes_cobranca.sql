-- =============================================================================
-- KORbuild Match — etapa 6, parte 2: lembretes, e-mails de aviso e cobrança (Mercado Pago)
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema.
-- O agendamento (pg_cron) fica em supabase/agendamentos.sql, porque leva um segredo seu.
-- =============================================================================

-- Nova categoria de aviso: plano.
alter table public.notificacoes drop constraint if exists notificacoes_categoria_check;
alter table public.notificacoes add constraint notificacoes_categoria_check
  check (categoria in ('mensagens', 'candidaturas', 'vagas', 'contratacao', 'avaliacoes', 'convites', 'plano'));
alter table public.notificacao_prefs drop constraint if exists notificacao_prefs_categoria_check;
alter table public.notificacao_prefs add constraint notificacao_prefs_categoria_check
  check (categoria in ('mensagens', 'candidaturas', 'vagas', 'contratacao', 'avaliacoes', 'convites', 'plano'));

-- Marcas para não repetir lembretes.
alter table public.candidaturas add column if not exists lembrete_em timestamptz;
alter table public.contratacoes add column if not exists lembrete_avaliacao_em timestamptz;

-- Assinatura no Mercado Pago (quem altera é só o servidor, com a chave service_role).
alter table public.assinaturas add column if not exists mp_preapproval_id text;
alter table public.assinaturas add column if not exists mp_status text;
alter table public.assinaturas add column if not exists proximo_pagamento timestamptz;

-- Planos à venda. O preço fica aqui (Table Editor → planos) para mudar sem mexer no código.
-- O Mercado Pago de uma conta brasileira cobra em reais.
create table if not exists public.planos (
  id         text primary key,
  nome       text not null,
  preco      numeric(10, 2) check (preco > 0),
  moeda      text not null default 'BRL' check (moeda in ('BRL', 'ARS', 'MXN', 'CLP', 'COP', 'PEN', 'UYU')),
  ativo      boolean not null default true
);
alter table public.planos enable row level security;
drop policy if exists planos_ler on public.planos;
create policy planos_ler on public.planos for select to anon, authenticated using (ativo);
insert into public.planos (id, nome, preco, moeda) values ('essencial', 'Essencial', null, 'BRL') on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Lembretes diários (agendar com pg_cron: ver supabase/agendamentos.sql)
-- -----------------------------------------------------------------------------
create or replace function public.lembretes_diarios()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  antes text := coalesce(current_setting('kor.sistema', true), '');
  r record;
  n_cand integer := 0; n_aval integer := 0; n_plano integer := 0;
  dias integer;
begin
  perform set_config('kor.sistema', 'on', true);

  -- 1. Resposta garantida (seção 7.1): candidatos "novos" há mais de 7 dias.
  for r in
    select v.id as vaga_id, v.titulo, e.dono, count(*) as n
    from public.candidaturas c join public.vagas v on v.id = c.vaga_id join public.empresas e on e.id = v.empresa_id
    where c.status = 'novo' and c.lembrete_em is null and c.criado_em < now() - interval '7 days'
    group by v.id, v.titulo, e.dono
  loop
    perform public.notificar(r.dono, 'candidaturas',
      r.n || case when r.n = 1 then ' candidato esperando' else ' candidatos esperando' end || ' resposta há mais de 7 dias',
      'Vaga ' || r.titulo || '. Chame para conversa ou marque como não selecionado: a resposta garantida conta na sua reputação.',
      'candidatos.html?vaga=' || r.vaga_id, true);
  end loop;
  for r in
    select c.id, c.profissional_id, v.titulo, e.nome as empresa
    from public.candidaturas c join public.vagas v on v.id = c.vaga_id join public.empresas e on e.id = v.empresa_id
    where c.status = 'novo' and c.lembrete_em is null and c.criado_em < now() - interval '7 days'
  loop
    perform public.notificar(r.profissional_id, 'candidaturas', 'Candidatura sem resposta',
      r.empresa || ' ainda não respondeu sobre ' || r.titulo || '. A empresa recebeu um lembrete.', 'candidaturas.html');
    update public.candidaturas set lembrete_em = now() where id = r.id;
    n_cand := n_cand + 1;
  end loop;

  -- 2. Avaliação perto do prazo (faltam 2 dias ou menos) para quem ainda não avaliou.
  for r in
    select k.*, e.dono, e.nome as empresa, p.nome as profissional
    from public.contratacoes k join public.empresas e on e.id = k.empresa_id join public.profissionais p on p.id = k.profissional_id
    where k.status = 'confirmado' and k.lembrete_avaliacao_em is null
      and k.avaliar_ate > now() and k.avaliar_ate <= now() + interval '2 days'
  loop
    if not exists (select 1 from public.avaliacoes where contratacao_id = r.id and autor_tipo = 'empresa') then
      perform public.notificar(r.dono, 'avaliacoes', 'Últimos dias para avaliar ' || r.profissional,
        'A avaliação fecha em ' || to_char(r.avaliar_ate - interval '1 second', 'DD/MM') || '.', 'avaliar.html?id=' || r.id);
    end if;
    if not exists (select 1 from public.avaliacoes where contratacao_id = r.id and autor_tipo = 'profissional') then
      perform public.notificar(r.profissional_id, 'avaliacoes', 'Últimos dias para avaliar ' || r.empresa,
        'A avaliação fecha em ' || to_char(r.avaliar_ate - interval '1 second', 'DD/MM') || '.', 'avaliar.html?id=' || r.id);
    end if;
    update public.contratacoes set lembrete_avaliacao_em = now() where id = r.id;
    n_aval := n_aval + 1;
  end loop;

  -- 3. Período grátis: aviso com 7 dias, 1 dia e no dia em que termina.
  for r in
    select a.*, e.dono from public.assinaturas a join public.empresas e on e.id = a.empresa_id where a.status = 'gratis'
  loop
    dias := (r.gratis_ate::date - current_date);
    if dias in (7, 1) then
      perform public.notificar(r.dono, 'plano', 'Faltam ' || dias || case when dias = 1 then ' dia' else ' dias' end || ' do período grátis',
        'Escolha o plano Essencial para continuar publicando vagas. Suas vagas não são apagadas.', 'plano.html', true);
      n_plano := n_plano + 1;
    elsif dias = 0 then
      perform public.notificar(r.dono, 'plano', 'O período grátis termina hoje',
        'Assine o Essencial para continuar publicando e reativando vagas.', 'plano.html', true);
      n_plano := n_plano + 1;
    end if;
  end loop;

  perform set_config('kor.sistema', antes, true);
  return jsonb_build_object('candidaturas', n_cand, 'avaliacoes', n_aval, 'plano', n_plano);
end $$;

revoke execute on function public.lembretes_diarios() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Fila dos e-mails de aviso (usada pela Edge Function "enviar-avisos", com a service_role)
-- -----------------------------------------------------------------------------
-- Avisos ainda não lidos no app e não enviados, mais antigos que alguns minutos (dá tempo de a
-- pessoa ver no app e de mensagens seguidas virarem um aviso só), agrupados por pessoa.
create or replace function public.avisos_pendentes_email(p_limite integer default 50, p_espera_min integer default 3)
returns table (user_id uuid, email text, nome text, avisos jsonb)
language sql stable security definer set search_path = public as $$
  select n.user_id, u.email::text, coalesce(pf.nome, split_part(u.email, '@', 1))::text,
         jsonb_agg(jsonb_build_object('id', n.id, 'categoria', n.categoria, 'titulo', n.titulo, 'texto', n.texto, 'link', n.link, 'criado_em', n.criado_em)
                   order by n.criado_em desc)
  from public.notificacoes n
  join auth.users u on u.id = n.user_id
  left join public.perfis pf on pf.id = n.user_id
  where n.email_em is null and n.lida_em is null
    and n.criado_em < now() - make_interval(mins => p_espera_min)
    and u.email is not null
    and not exists (select 1 from public.notificacao_prefs np where np.user_id = n.user_id and np.categoria = n.categoria and not np.email)
  group by n.user_id, u.email, pf.nome
  limit p_limite
$$;

create or replace function public.marcar_avisos_enviados(p_ids bigint[])
returns integer language plpgsql security definer set search_path = public as $$
declare
  antes text := coalesce(current_setting('kor.sistema', true), '');
  n integer;
begin
  perform set_config('kor.sistema', 'on', true);
  update public.notificacoes set email_em = now() where id = any(p_ids) and email_em is null;
  get diagnostics n = row_count;
  perform set_config('kor.sistema', antes, true);
  return n;
end $$;

revoke execute on function public.avisos_pendentes_email(integer, integer) from public, anon, authenticated;
revoke execute on function public.marcar_avisos_enviados(bigint[]) from public, anon, authenticated;
grant execute on function public.avisos_pendentes_email(integer, integer) to service_role;
grant execute on function public.marcar_avisos_enviados(bigint[]) to service_role;
grant execute on function public.lembretes_diarios() to service_role;
