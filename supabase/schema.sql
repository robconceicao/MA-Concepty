-- =============================================================================
-- MA Concepty - Etapa 2: modelagem do banco
-- Rode este script inteiro em: Supabase > SQL Editor > New query > Run.
-- E idempotente: pode rodar de novo sem quebrar nada.
-- =============================================================================

-- gen_random_uuid()
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Tecnicas de mega hair
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tecnica_mega_hair') then
    create type public.tecnica_mega_hair as enum (
      'fita_adesiva',
      'ponto_americano',
      'queratina',
      'microesferas'
    );
  end if;
end
$$;

-- Regra de negocio: intervalo ideal de manutencao, em dias, por tecnica.
-- IMMUTABLE porque e usada na coluna gerada data_retorno.
create or replace function public.dias_manutencao(tecnica public.tecnica_mega_hair)
returns integer
language sql
immutable
strict
as $$
  select case tecnica
    when 'fita_adesiva'    then 45
    when 'ponto_americano' then 60
    when 'queratina'       then 90
    when 'microesferas'    then 60
  end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Tabela de clientes
-- -----------------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),

  -- Dona do cadastro. Cada login enxerga apenas as proprias clientes (RLS abaixo).
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  nome text not null,
  -- Somente digitos, com DDI: 5511987654321. A mascara vive no app.
  whatsapp text not null,
  tecnica public.tecnica_mega_hair not null,
  ultima_aplicacao date not null,
  observacoes text,

  -- Arquivar sem perder o historico.
  ativo boolean not null default true,

  -- Data ideal de retorno, calculada pelo proprio banco.
  data_retorno date generated always as (
    ultima_aplicacao + public.dias_manutencao(tecnica)
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clientes_nome_check check (char_length(btrim(nome)) between 2 and 120),
  constraint clientes_whatsapp_check check (whatsapp ~ '^[0-9]{10,15}$'),
  constraint clientes_observacoes_check check (observacoes is null or char_length(observacoes) <= 1000)
);

comment on table  public.clientes is 'Clientes de mega hair e o controle de retorno para manutencao.';
comment on column public.clientes.whatsapp is 'Apenas digitos, com DDI. Ex: 5511987654321.';
comment on column public.clientes.data_retorno is 'ultima_aplicacao + dias da tecnica. Calculada pelo banco.';

-- -----------------------------------------------------------------------------
-- 3. updated_at automatico
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
  before update on public.clientes
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Indices
-- -----------------------------------------------------------------------------
-- Dashboard e lista ordenam por data de retorno dentro da conta.
create index if not exists clientes_user_retorno_idx
  on public.clientes (user_id, data_retorno);

-- Busca por nome sem diferenciar maiusculas.
create index if not exists clientes_user_nome_idx
  on public.clientes (user_id, lower(nome));

-- -----------------------------------------------------------------------------
-- 5. Status do retorno (view)
-- -----------------------------------------------------------------------------
-- Depende de current_date, entao vive numa view (nao pode ser coluna gerada).
--   atrasado  : data_retorno ja passou
--   proximo   : faltam 10 dias ou menos
--   no_prazo  : faltam mais de 10 dias
create or replace view public.clientes_com_status
with (security_invoker = true)
as
select
  c.*,
  (c.data_retorno - current_date) as dias_restantes,
  case
    when c.data_retorno < current_date then 'atrasado'
    when c.data_retorno - current_date <= 10 then 'proximo'
    else 'no_prazo'
  end as status
from public.clientes c;

comment on view public.clientes_com_status is
  'Clientes + dias restantes e status (no_prazo / proximo / atrasado). security_invoker respeita o RLS de quem consulta.';

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.clientes enable row level security;

drop policy if exists "clientes_select_own" on public.clientes;
create policy "clientes_select_own"
  on public.clientes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "clientes_insert_own" on public.clientes;
create policy "clientes_insert_own"
  on public.clientes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "clientes_update_own" on public.clientes;
create policy "clientes_update_own"
  on public.clientes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "clientes_delete_own" on public.clientes;
create policy "clientes_delete_own"
  on public.clientes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Sem politica para o papel anon: quem nao esta logado nao le nada.

-- -----------------------------------------------------------------------------
-- 7. Permissoes de tabela
-- -----------------------------------------------------------------------------
-- O Supabase ja concede isso por padrao; deixamos explicito para o script ficar
-- completo mesmo em projetos com default privileges alterados. O RLS acima
-- continua sendo o que decide quais linhas cada conta enxerga.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.clientes to authenticated;
grant select on public.clientes_com_status to authenticated;
grant execute on function public.dias_manutencao(public.tecnica_mega_hair) to authenticated;
