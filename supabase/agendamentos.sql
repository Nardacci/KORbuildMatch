-- =============================================================================
-- KORbuild Match — agendamentos (etapa 6, parte 2)
-- Como aplicar: Supabase → SQL Editor → New query → cole este arquivo inteiro.
-- ANTES de rodar, troque COLE_AQUI_O_CRON_SECRET (aparece 2 vezes) pelo mesmo valor que você salvou em
-- Edge Functions → Secrets → CRON_SECRET. NÃO salve este arquivo com o segredo no GitHub.
-- Pode rodar mais de uma vez: cada agendamento é recriado com o mesmo nome.
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
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'COLE_AQUI_O_CRON_SECRET'),
    body    := '{}'::jsonb
  );
$$);

-- Cotação do dólar (PTAX do Banco Central): todo dia às 14h10 de Brasília, depois da publicação (~13h).
-- Também atualiza o valor em reais das assinaturas com cobrança nos próximos 3 dias.
select cron.schedule('kor-cotacao-dolar', '10 17 * * *', $$
  select net.http_post(
    url     := 'https://gbdmtgephszxhaprpiss.supabase.co/functions/v1/assinatura/cotacao',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'COLE_AQUI_O_CRON_SECRET'),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$$);

-- Conferir: deve listar os três agendamentos.
select jobname, schedule, active from cron.job where jobname like 'kor-%' order by jobname;

-- Ver as últimas execuções (rode depois de alguns minutos):
-- select jobname, status, return_message, start_time from cron.job_run_details d
--   join cron.job j using (jobid) where jobname like 'kor-%' order by start_time desc limit 10;
