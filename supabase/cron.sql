-- =============================================================================
-- MARCO Concept Beauty - agendamento do resumo diário por e-mail
--
-- Rode DEPOIS de publicar a função (veja docs/RESUMO-DIARIO.md).
-- Antes de executar, troque as duas linhas marcadas com TROQUE.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove um agendamento anterior, se existir, para o script poder rodar de novo.
do $$
begin
  perform cron.unschedule('resumo-diario');
exception
  when others then null;
end
$$;

-- 11:00 UTC = 08:00 em São Paulo. O Brasil não tem mais horário de verão,
-- então esse deslocamento de 3 horas vale o ano inteiro.
select cron.schedule(
  'resumo-diario',
  '0 11 * * *',
  $$
  select net.http_post(
    url := 'https://TROQUE-PELO-REF-DO-PROJETO.supabase.co/functions/v1/resumo-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'TROQUE-PELO-MESMO-CRON_SECRET-DA-FUNCAO'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Conferir o agendamento:
--   select jobname, schedule, active from cron.job;
--
-- Ver as últimas execuções (a chamada é assíncrona; o resultado do envio
-- aparece nos logs da função, no painel do Supabase):
--   select * from cron.job_run_details order by start_time desc limit 10;
--
-- Desligar sem apagar:
--   update cron.job set active = false where jobname = 'resumo-diario';
