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

  -- Quando o ultimo lembrete foi disparado no WhatsApp.
  ultimo_lembrete_em timestamptz,

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

-- Para quem ja rodou uma versao anterior deste script: acrescenta a coluna
-- sem tocar nos dados existentes.
alter table public.clientes
  add column if not exists ultimo_lembrete_em timestamptz;

comment on table  public.clientes is 'Clientes de mega hair e o controle de retorno para manutencao.';
comment on column public.clientes.whatsapp is 'Apenas digitos, com DDI. Ex: 5511987654321.';
comment on column public.clientes.data_retorno is 'ultima_aplicacao + dias da tecnica. Calculada pelo banco.';
comment on column public.clientes.ultimo_lembrete_em is 'Ultimo disparo de lembrete no WhatsApp. Evita avisar a mesma cliente duas vezes no dia.';

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
-- Depende da data de hoje, entao vive numa view (nao pode ser coluna gerada).
--   atrasado  : data_retorno ja passou
--   proximo   : faltam 10 dias ou menos
--   no_prazo  : faltam mais de 10 dias
-- O banco do Supabase roda em UTC; aqui o "hoje" e o de Sao Paulo, se nao a
-- virada do dia aconteceria as 21h para o salao.
-- O drop e necessario porque a view ganhou colunas novas: o create or replace
-- so aceita acrescentar colunas no fim da lista.
drop view if exists public.clientes_com_status;

create view public.clientes_com_status
with (security_invoker = true)
as
select
  c.*,
  (c.data_retorno - (now() at time zone 'America/Sao_Paulo')::date) as dias_restantes,
  case
    when c.data_retorno < (now() at time zone 'America/Sao_Paulo')::date then 'atrasado'
    when c.data_retorno - (now() at time zone 'America/Sao_Paulo')::date <= 10 then 'proximo'
    else 'no_prazo'
  end as status,
  (
    c.ultimo_lembrete_em is not null
    and c.ultimo_lembrete_em >=
      date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
  ) as avisada_hoje
from public.clientes c;

comment on view public.clientes_com_status is
  'Clientes + dias restantes, status (no_prazo / proximo / atrasado) e se o lembrete de hoje ja foi enviado. security_invoker respeita o RLS de quem consulta.';

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

-- -----------------------------------------------------------------------------
-- 8. Assinaturas de push (aviso na tela do celular pela versao web)
-- -----------------------------------------------------------------------------
-- Cada aparelho que autoriza o aviso guarda aqui o proprio endereco de entrega.
-- Um mesmo login pode ter varios (celular, tablet, computador).
create table if not exists public.push_assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- Endereco que o navegador da para entregar o aviso. E unico por aparelho.
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,

  aparelho text,
  criado_em timestamptz not null default now(),
  ultimo_envio_em timestamptz
);

comment on table public.push_assinaturas is
  'Aparelhos autorizados a receber aviso de retorno pela versao web (Web Push).';

create index if not exists push_assinaturas_user_idx
  on public.push_assinaturas (user_id);

alter table public.push_assinaturas enable row level security;

drop policy if exists "push_select_own" on public.push_assinaturas;
create policy "push_select_own"
  on public.push_assinaturas for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "push_insert_own" on public.push_assinaturas;
create policy "push_insert_own"
  on public.push_assinaturas for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "push_update_own" on public.push_assinaturas;
create policy "push_update_own"
  on public.push_assinaturas for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_delete_own" on public.push_assinaturas;
create policy "push_delete_own"
  on public.push_assinaturas for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.push_assinaturas to authenticated;

-- =============================================================================
-- 9. Ganhos do profissional
-- =============================================================================
-- O catalogo guarda o preco e o percentual de hoje; cada atendimento guarda uma
-- copia dos dois. E de proposito: mudar o preco no catalogo nao pode reescrever
-- o que ja foi pago no mes passado.

create table if not exists public.procedimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  nome text not null,
  /** Quanto a cliente paga pelo procedimento. */
  valor_cliente numeric(10, 2) not null,
  /** Quanto disso fica com o profissional, em porcentagem. */
  percentual_profissional numeric(5, 2) not null,

  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint procedimentos_nome_check check (char_length(btrim(nome)) between 2 and 120),
  constraint procedimentos_valor_check check (valor_cliente >= 0),
  constraint procedimentos_percentual_check check (percentual_profissional between 0 and 100)
);

comment on table public.procedimentos is
  'Catalogo de procedimentos, com o valor cobrado da cliente e a comissao do profissional.';

-- Nome unico por conta, sem diferenciar maiusculas.
create unique index if not exists procedimentos_user_nome_idx
  on public.procedimentos (user_id, lower(btrim(nome)));

drop trigger if exists procedimentos_set_updated_at on public.procedimentos;
create trigger procedimentos_set_updated_at
  before update on public.procedimentos
  for each row
  execute function public.set_updated_at();

create table if not exists public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  procedimento_id uuid not null references public.procedimentos (id) on delete restrict,
  -- Opcional: o atendimento pode ser de uma cliente avulsa, sem cadastro.
  cliente_id uuid references public.clientes (id) on delete set null,
  nome_cliente text,

  data date not null,

  -- Copia do catalogo no dia do atendimento.
  valor_cliente numeric(10, 2) not null,
  percentual_profissional numeric(5, 2) not null,
  -- Quanto o profissional ganhou. Quem calcula e o banco.
  valor_profissional numeric(10, 2) generated always as (
    round(valor_cliente * percentual_profissional / 100, 2)
  ) stored,

  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint atendimentos_valor_check check (valor_cliente >= 0),
  constraint atendimentos_percentual_check check (percentual_profissional between 0 and 100),
  constraint atendimentos_observacoes_check check (observacoes is null or char_length(observacoes) <= 1000)
);

comment on table public.atendimentos is
  'Procedimentos realizados. valor_cliente e percentual sao a copia do catalogo na data.';

create index if not exists atendimentos_user_data_idx
  on public.atendimentos (user_id, data desc);

drop trigger if exists atendimentos_set_updated_at on public.atendimentos;
create trigger atendimentos_set_updated_at
  before update on public.atendimentos
  for each row
  execute function public.set_updated_at();

-- Adiantamento: dinheiro ja recebido, que entra como debito no fechamento do mes.
create table if not exists public.adiantamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  data date not null,
  valor numeric(10, 2) not null,
  descricao text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint adiantamentos_valor_check check (valor > 0),
  constraint adiantamentos_descricao_check check (descricao is null or char_length(descricao) <= 200)
);

comment on table public.adiantamentos is
  'Valores adiantados ao profissional, descontados do fechamento do mes.';

create index if not exists adiantamentos_user_data_idx
  on public.adiantamentos (user_id, data desc);

drop trigger if exists adiantamentos_set_updated_at on public.adiantamentos;
create trigger adiantamentos_set_updated_at
  before update on public.adiantamentos
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 9.1 RLS dos ganhos
-- -----------------------------------------------------------------------------
alter table public.procedimentos enable row level security;
alter table public.atendimentos enable row level security;
alter table public.adiantamentos enable row level security;

do $$
declare
  tabela text;
begin
  foreach tabela in array array['procedimentos', 'atendimentos', 'adiantamentos'] loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I', tabela);
    execute format(
      'create policy "%1$s_select_own" on public.%1$I for select to authenticated using (auth.uid() = user_id)',
      tabela
    );
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I', tabela);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I for insert to authenticated with check (auth.uid() = user_id)',
      tabela
    );
    execute format('drop policy if exists "%1$s_update_own" on public.%1$I', tabela);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tabela
    );
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I', tabela);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I for delete to authenticated using (auth.uid() = user_id)',
      tabela
    );
    execute format('grant select, insert, update, delete on public.%1$I to authenticated', tabela);
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- 9.2 Catalogo inicial
-- -----------------------------------------------------------------------------
-- Cria os tres procedimentos para cada conta que ainda nao os tem. Rodar de novo
-- nao duplica nem sobrescreve valores que voce tenha ajustado no painel.
insert into public.procedimentos (user_id, nome, valor_cliente, percentual_profissional)
select u.id, catalogo.nome, catalogo.valor, catalogo.percentual
from auth.users u
cross join (values
  ('Combo Mecha', 650.00, 15.00),
  ('Mega Hair Fita Adesiva', 100.00, 15.00),
  ('Progressiva', 100.00, 15.00)
) as catalogo(nome, valor, percentual)
on conflict do nothing;
