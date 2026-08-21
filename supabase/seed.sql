-- =============================================================================
-- MA Concepty - dados de exemplo (opcional)
-- Use so para testar o app antes de cadastrar clientes reais.
-- 1) Crie seu usuario em Authentication > Users.
-- 2) Troque o e-mail abaixo pelo seu.
-- 3) Rode no SQL Editor.
-- =============================================================================

with conta as (
  select id from auth.users where email = 'troque-pelo-seu@email.com'
)
insert into public.clientes (user_id, nome, whatsapp, tecnica, ultima_aplicacao, observacoes)
select
  conta.id,
  d.nome,
  d.whatsapp,
  d.tecnica::public.tecnica_mega_hair,
  current_date - d.dias_atras,
  d.observacoes
from conta
cross join (values
  -- Fita adesiva (45d): aplicada ha 5 dias  -> retorno em 40 dias  -> No Prazo
  ('Ana Beatriz Moraes', '5511987654321', 'fita_adesiva',      5,  'Prefere horario a tarde.'),
  -- Ponto americano (60d): ha 55 dias       -> faltam 5 dias      -> Proximo
  ('Carolina Prado',     '5511912345678', 'ponto_americano',  55,  'Cabelo 60cm, cor 8.1.'),
  -- Queratina (90d): ha 85 dias             -> faltam 5 dias      -> Proximo
  ('Juliana Ferraz',     '5521998877665', 'queratina',        85,  null),
  -- Microesferas (60d): ha 72 dias          -> 12 dias atrasada   -> Atrasado
  ('Marina Lopes',       '5531976543210', 'microesferas',     72,  'Avisar sempre pela manha.'),
  -- Fita adesiva (45d): ha 60 dias          -> 15 dias atrasada   -> Atrasado
  ('Patricia Nunes',     '5541991112233', 'fita_adesiva',     60,  'Pele sensivel a fita.'),
  -- Queratina (90d): ha 10 dias             -> retorno em 80 dias -> No Prazo
  ('Renata Aguiar',      '5551988776655', 'queratina',        10,  null)
) as d(nome, whatsapp, tecnica, dias_atras, observacoes);
