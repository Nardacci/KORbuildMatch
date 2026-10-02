-- =============================================================================
-- KORbuild Match — preço do plano em dólar, cobrado em reais pela cotação do dia
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run (nada selecionado).
-- Pode rodar mais de uma vez sem problema.
--
-- Mesmo modelo do KORbuild: o preço fica em US$ na tabela planos; a cotação de venda PTAX do
-- Banco Central é guardada uma vez por dia em cotacoes (função "assinatura", caminho /cotacao);
-- o Mercado Pago cobra em reais o valor convertido. Antes de cada cobrança mensal o valor da
-- assinatura é atualizado com a cotação do dia.
-- =============================================================================

-- Planos podem ter preço em dólar.
alter table public.planos drop constraint if exists planos_moeda_check;
alter table public.planos add constraint planos_moeda_check
  check (moeda in ('USD', 'BRL', 'ARS', 'MXN', 'CLP', 'COP', 'PEN', 'UYU'));
alter table public.planos alter column moeda set default 'USD';
-- Essencial em dólar (US$ 79, o mesmo do protótipo). Só muda se o preço ainda não foi definido.
update public.planos set moeda = 'USD', preco = 79 where id = 'essencial' and preco is null;

-- Cotações do dia (uma linha por par e data). Dado público: qualquer um pode ler.
create table if not exists public.cotacoes (
  par         text not null,                  -- ex.: 'USD/BRL'
  taxa        numeric(12, 6) not null check (taxa > 0),  -- reais por 1 unidade da moeda
  data        date not null,                  -- dia da cotação (PTAX não sai em fim de semana e feriado)
  fonte       text not null default 'BCB_PTAX',
  buscado_em  timestamptz not null default now(),
  primary key (par, data)
);
alter table public.cotacoes enable row level security;
drop policy if exists cotacoes_ler on public.cotacoes;
create policy cotacoes_ler on public.cotacoes for select to anon, authenticated using (true);

-- O que está combinado hoje com o Mercado Pago (em reais) e com qual cotação.
alter table public.assinaturas add column if not exists valor_cobrado numeric(10, 2);
alter table public.assinaturas add column if not exists cotacao_usada numeric(12, 6);
alter table public.assinaturas add column if not exists cotacao_data date;
