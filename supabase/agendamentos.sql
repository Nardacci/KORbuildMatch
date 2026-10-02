-- =============================================================================
-- KORbuild Match — agendamentos (etapa 6, parte 2)
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run (nada selecionado).
-- Pode rodar mais de uma vez: cada agendamento é recriado com o mesmo nome.
--
-- O segredo NÃO fica neste arquivo: os agendamentos leem do Vault do Supabase o segredo
-- "kor_cron_secret", que deve ter o MESMO valor de Edge Functions → Secrets → CRON_SECRET.
-- Guarde-o uma vez, numa consulta separada (troque o texto entre aspas pelo seu valor):
--
--   select vault.create_secret('SEU_CRON_SECRET', 'kor_cron_secret');
--
-- Para trocar o valor depois:
--   select vault.update_secret((select id from vault.secrets where name = 'kor_cron_secret'), 'NOVO_VALOR');
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Lembretes do dia (candidatos sem resposta, avaliação perto do prazo, fim do período grátis).
-- 12:00 UTC = 9h em Brasília.
select cron.schedule('kor-lembretes-diarios', '0 12 * * *', $$ select public.lembretes_diarios(); $$);

-- E-mails de aviso: a cada 10 minutos, junta os avisos não vistos de cada pessoa em um e-mail só.
select cron.schedule('kor-enviar-avisos', '*/10 * * * *', $$
  select net.http_post(
    url     := 'https://gbdmtgephszxhaprpiss.supabase.co/functions/v1/enviar-avisos',
    headers := jsonb_build_object('Content-Type', 'application/json',
                 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'kor_cron_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$$);

-- Cotação do dólar (PTAX do Banco Central): todo dia às 14h10 de Brasília, depois da publicação (~13h).
-- Também atualiza o valor em reais das assinaturas com cobrança nos próximos 3 dias.
select cron.schedule('kor-cotacao-dolar', '10 17 * * *', $$
  select net.http_post(
    url     := 'https://gbdmtgephszxhaprpiss.supabase.co/functions/v1/assinatura/cotacao',
    headers := jsonb_build_object('Content-Type', 'application/json',
                 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'kor_cron_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$$);

-- Conferir: deve listar os três agendamentos e "segredo_no_vault" = true.
select jobname, schedule, active,
       exists (select 1 from vault.decrypted_secrets where name = 'kor_cron_secret') as segredo_no_vault
from cron.job where jobname like 'kor-%' order by jobname;

-- Ver as últimas respostas das funções (rode depois de alguns minutos):
-- select created, status_code, content from net._http_response order by created desc limit 5;
