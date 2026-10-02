-- =============================================================================
-- KORbuild Match — etapa 4 (mensagens)
-- Como aplicar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez sem problema.
-- =============================================================================

-- O profissional conversa com a empresa logada? A empresa passa a ver o perfil de quem conversa
-- com ela, mesmo que a pessoa tenha ocultado o perfil das buscas (como já valia para candidaturas).
create or replace function public.conversou_comigo(p_profissional uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversas c join public.empresas e on e.id = c.empresa_id
                 where c.profissional_id = p_profissional and e.dono = auth.uid())
$$;

drop policy if exists profissionais_ler on public.profissionais;
create policy profissionais_ler on public.profissionais for select to authenticated
  using (visivel or id = auth.uid() or public.candidatou_a_mim(id) or public.conversou_comigo(id));

-- A empresa só abre conversa com quem ela já pode ver (perfil visível ou candidato a uma vaga dela).
-- Sem isso, criar uma conversa seria um jeito de enxergar um perfil oculto.
drop policy if exists conversas_criar on public.conversas;
create policy conversas_criar on public.conversas for insert to authenticated
  with check (
    profissional_id = auth.uid()
    or (public.eh_dono_empresa(empresa_id)
        and exists (select 1 from public.profissionais p where p.id = profissional_id and (p.visivel or public.candidatou_a_mim(p.id))))
  );
