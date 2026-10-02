-- =============================================================================
-- KORbuild Match — etapa 6 (avisos): notificações no app
-- Como aplicar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema.
--
-- O próprio banco cria os avisos a cada evento (mensagem, candidatura, contratação, avaliação),
-- sempre para o OUTRO lado de quem agiu. A mesma tabela vai alimentar os e-mails depois.
-- =============================================================================

create table if not exists public.notificacoes (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  categoria  text not null check (categoria in ('mensagens', 'candidaturas', 'vagas', 'contratacao', 'avaliacoes', 'convites')),
  titulo     text not null,
  texto      text,
  link       text,
  lida_em    timestamptz,
  email_em   timestamptz,  -- quando o aviso foi enviado por e-mail (etapa dos e-mails)
  criado_em  timestamptz not null default now()
);

create index if not exists notificacoes_user_idx on public.notificacoes (user_id, criado_em desc);

alter table public.notificacoes enable row level security;

-- Cada um lê e marca como lidos os próprios avisos. Ninguém cria aviso direto: só os gatilhos.
drop policy if exists notificacoes_ler on public.notificacoes;
create policy notificacoes_ler on public.notificacoes for select to authenticated using (user_id = auth.uid());
drop policy if exists notificacoes_marcar on public.notificacoes;
create policy notificacoes_marcar on public.notificacoes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notificacoes_apagar on public.notificacoes;
create policy notificacoes_apagar on public.notificacoes for delete to authenticated using (user_id = auth.uid());

-- Pela tela, só dá para mudar "lida".
create or replace function public.guarda_notificacao()
returns trigger language plpgsql as $$
begin
  if not public.eh_sistema() and (new.user_id, new.categoria, new.titulo, new.texto, new.link, new.email_em, new.criado_em)
     is distinct from (old.user_id, old.categoria, old.titulo, old.texto, old.link, old.email_em, old.criado_em) then
    raise exception 'Só dá para marcar o aviso como lido.';
  end if;
  return new;
end $$;

drop trigger if exists notificacoes_guarda on public.notificacoes;
create trigger notificacoes_guarda before update on public.notificacoes
  for each row execute function public.guarda_notificacao();

-- Cria o aviso, respeitando a preferência "no app" da pessoa. Com "agrupar", um aviso ainda não lido
-- com o mesmo link é atualizado em vez de criar outro (ex.: várias mensagens da mesma conversa).
create or replace function public.notificar(p_user uuid, p_categoria text, p_titulo text, p_texto text, p_link text, p_agrupar boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare
  antes text := coalesce(current_setting('kor.sistema', true), '');  -- devolve como estava (pode rodar dentro de outra ação do sistema)
begin
  if p_user is null then return; end if;
  if exists (select 1 from public.notificacao_prefs where user_id = p_user and categoria = p_categoria and not push) then return; end if;
  perform set_config('kor.sistema', 'on', true);
  if p_agrupar then
    update public.notificacoes set titulo = p_titulo, texto = left(p_texto, 200), criado_em = now(), email_em = null
      where user_id = p_user and link = p_link and lida_em is null;
  end if;
  if not p_agrupar or not found then
    insert into public.notificacoes (user_id, categoria, titulo, texto, link) values (p_user, p_categoria, p_titulo, left(p_texto, 200), p_link);
  end if;
  perform set_config('kor.sistema', antes, true);
end $$;

revoke execute on function public.notificar(uuid, text, text, text, text, boolean) from public, anon, authenticated;

-- Mensagem nova → para o outro lado da conversa.
create or replace function public.notif_mensagem()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c public.conversas; e public.empresas; p public.profissionais;
begin
  select * into c from public.conversas where id = new.conversa_id;
  select * into e from public.empresas where id = c.empresa_id;
  select * into p from public.profissionais where id = c.profissional_id;
  if new.de = 'empresa' then
    perform public.notificar(c.profissional_id, 'mensagens', 'Nova mensagem de ' || e.nome, new.texto, 'conversa.html?id=' || c.id, true);
  else
    perform public.notificar(e.dono, 'mensagens', 'Nova mensagem de ' || p.nome, new.texto, 'conversa.html?id=' || c.id, true);
  end if;
  return null;
end $$;

drop trigger if exists mensagens_notificar on public.mensagens;
create trigger mensagens_notificar after insert on public.mensagens
  for each row execute function public.notif_mensagem();

-- Candidaturas: nova (para a empresa) e mudanças de status (para quem não mudou).
create or replace function public.notif_candidatura()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v public.vagas; e public.empresas; p public.profissionais;
begin
  select * into v from public.vagas where id = new.vaga_id;
  select * into e from public.empresas where id = v.empresa_id;
  select * into p from public.profissionais where id = new.profissional_id;
  if tg_op = 'INSERT' then
    perform public.notificar(e.dono, 'candidaturas', 'Nova candidatura: ' || v.titulo, p.nome || ' se candidatou. Responda em até 7 dias.', 'candidatos.html?vaga=' || v.id);
  elsif new.status is distinct from old.status then
    if new.status = 'conversa' then
      perform public.notificar(p.id, 'candidaturas', e.nome || ' quer conversar com você', 'Vaga ' || v.titulo || '. Veja a mensagem e responda.', 'candidaturas.html');
    elsif new.status = 'nao' then
      perform public.notificar(p.id, 'candidaturas', 'Retorno da candidatura', 'Desta vez ' || e.nome || ' seguiu com outro perfil para ' || v.titulo || '. Seu perfil continua visível para as próximas vagas.', 'candidaturas.html?aba=encerradas');
    elsif new.status = 'encerrada' then
      perform public.notificar(p.id, 'candidaturas', 'Vaga encerrada', v.titulo || ' foi encerrada por ' || e.nome || '.', 'candidaturas.html?aba=encerradas');
    elsif new.status = 'retirada' then
      perform public.notificar(e.dono, 'candidaturas', 'Candidatura retirada', p.nome || ' retirou a candidatura para ' || v.titulo || '.', 'candidatos.html?vaga=' || v.id);
    end if;
  end if;
  return null;
end $$;

drop trigger if exists candidaturas_notificar on public.candidaturas;
create trigger candidaturas_notificar after insert or update on public.candidaturas
  for each row execute function public.notif_candidatura();

-- Contratações: pedido de confirmação, resposta, contestação, recusa e fim do vínculo.
create or replace function public.notif_contratacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  e public.empresas; p public.profissionais;
  u_reg uuid; u_outro uuid; n_reg text; n_outro text;
begin
  select * into e from public.empresas where id = new.empresa_id;
  select * into p from public.profissionais where id = new.profissional_id;
  if new.registrada_por = 'empresa' then u_reg := e.dono; n_reg := e.nome; u_outro := p.id; n_outro := p.nome;
  else u_reg := p.id; n_reg := p.nome; u_outro := e.dono; n_outro := e.nome; end if;

  if tg_op = 'INSERT' then
    perform public.notificar(u_outro, 'contratacao', 'Confirme a contratação', n_reg || ' registrou a contratação: ' || new.funcao || '. Confira o combinado.', 'contratacoes.html');
    return null;
  end if;
  if new.status is distinct from old.status then
    if new.status = 'confirmado' then
      perform public.notificar(u_reg, 'contratacao', 'Contratação confirmada', n_outro || ' confirmou: ' || new.funcao || '. O vínculo entrou no histórico verificado.', 'contratacoes.html');
    elsif new.status = 'contestado' then
      perform public.notificar(u_reg, 'contratacao', 'Combinado contestado', n_outro || ': ' || coalesce(new.contestacao_texto, ''), 'contratacoes.html');
    elsif new.status = 'recusado' then
      perform public.notificar(u_reg, 'contratacao', 'Contratação recusada', n_outro || ' disse que a contratação não aconteceu. Se aconteceu, conteste.', 'contratacoes.html');
    elsif new.status = 'aguardando' and old.status = 'contestado' then
      perform public.notificar(u_outro, 'contratacao', 'Combinado revisto', n_reg || ' respondeu à sua contestação. Confira e confirme.', 'contratacoes.html');
    end if;
  end if;
  if new.encerrada_em is not null and old.encerrada_em is null then
    perform public.notificar(e.dono, 'avaliacoes', 'Avalie ' || p.nome, 'O vínculo terminou. A avaliação fica aberta até ' || to_char(new.avaliar_ate - interval '1 second', 'DD/MM') || '.', 'avaliar.html?id=' || new.id);
    perform public.notificar(p.id, 'avaliacoes', 'Avalie ' || e.nome, 'O vínculo terminou. A avaliação fica aberta até ' || to_char(new.avaliar_ate - interval '1 second', 'DD/MM') || '.', 'avaliar.html?id=' || new.id);
  end if;
  return null;
end $$;

drop trigger if exists contratacoes_notificar on public.contratacoes;
create trigger contratacoes_notificar after insert or update on public.contratacoes
  for each row execute function public.notif_contratacao();

-- Avaliações: o outro lado sabe que já avaliaram (sem ver o conteúdo); com as duas, os dois são avisados.
create or replace function public.notif_avaliacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  k public.contratacoes; e public.empresas; p public.profissionais; n integer;
begin
  select * into k from public.contratacoes where id = new.contratacao_id;
  select * into e from public.empresas where id = k.empresa_id;
  select * into p from public.profissionais where id = k.profissional_id;
  select count(*) into n from public.avaliacoes where contratacao_id = k.id;
  if n >= 2 then
    perform public.notificar(e.dono, 'avaliacoes', 'Avaliações publicadas', 'As avaliações de ' || k.funcao || ' com ' || p.nome || ' foram publicadas.', 'perfil.html#minha-reputacao');
    perform public.notificar(p.id, 'avaliacoes', 'Avaliações publicadas', 'As avaliações de ' || k.funcao || ' com ' || e.nome || ' foram publicadas.', 'perfil.html#minha-reputacao');
  elsif new.autor_tipo = 'empresa' then
    perform public.notificar(p.id, 'avaliacoes', e.nome || ' já avaliou', 'Envie a sua até ' || to_char(k.avaliar_ate - interval '1 second', 'DD/MM') || '. As duas são publicadas juntas.', 'avaliar.html?id=' || k.id);
  else
    perform public.notificar(e.dono, 'avaliacoes', p.nome || ' já avaliou', 'Envie a sua até ' || to_char(k.avaliar_ate - interval '1 second', 'DD/MM') || '. As duas são publicadas juntas.', 'avaliar.html?id=' || k.id);
  end if;
  return null;
end $$;

drop trigger if exists avaliacoes_notificar on public.avaliacoes;
create trigger avaliacoes_notificar after insert on public.avaliacoes
  for each row execute function public.notif_avaliacao();

-- Avisos novos chegam na hora pelo Realtime (sino).
do $$ begin
  if to_regclass('public.notificacoes') is not null
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificacoes') then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
exception when others then
  raise notice 'Tempo real dos avisos não ativado (%). O sino continua funcionando ao abrir as telas.', sqlerrm;
end $$;
