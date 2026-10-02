-- =============================================================================
-- KORbuild Match — etapa 5 (contratação e reputação)
-- Como aplicar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema.
-- =============================================================================

-- Avaliações publicadas (as duas enviadas ou o prazo terminou), com o contexto que pode ser público.
-- As contratações em si continuam privadas entre as duas partes; aqui sai só o necessário para o perfil:
-- função, data, respostas, nota, comentário e resposta. O autor aparece resumido: a empresa pelo nome
-- (ou "Empresa não divulgada", se o profissional ocultou o nome dela no histórico) e o profissional
-- pelo primeiro nome e a inicial do sobrenome.
create or replace view public.avaliacoes_publicas as
  select a.id, a.contratacao_id, a.autor_tipo, a.nota, a.respostas, a.comentario, a.resposta, a.criado_em,
         k.profissional_id, k.empresa_id, k.funcao,
         case when a.autor_tipo = 'empresa'
              then case when coalesce(x.mostrar_empresa, true) then e.nome else 'Empresa não divulgada' end
              else split_part(p.nome, ' ', 1) ||
                   coalesce(' ' || left(nullif(split_part(p.nome, ' ', array_length(string_to_array(p.nome, ' '), 1)), split_part(p.nome, ' ', 1)), 1) || '.', '')
         end as autor_nome
  from public.avaliacoes a
  join public.contratacoes k on k.id = a.contratacao_id
  join public.empresas e on e.id = k.empresa_id
  join public.profissionais p on p.id = k.profissional_id
  left join public.experiencias x on x.contratacao_id = k.id
  where not a.removida
    and ((select count(*) from public.avaliacoes y where y.contratacao_id = a.contratacao_id) = 2 or k.avaliar_ate < now());

grant select on public.avaliacoes_publicas to anon, authenticated;
