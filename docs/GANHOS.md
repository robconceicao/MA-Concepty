# Ganhos do profissional

A aba **Ganhos** responde a uma pergunta: *quanto eu vou receber neste mês, e
quando*.

O fechamento vai do dia 1 ao último dia do mês, e o saldo cai no **5º dia útil
do mês seguinte** — o mês só pode ser pago depois de fechado.

---

## Como o cálculo funciona

| Linha | O que é |
| --- | --- |
| **Atendimentos** | soma do que as clientes pagaram (o bruto do salão) |
| **Seu ganho** | a comissão sobre esse valor |
| **Adiantamentos** | o que você já recebeu no mês, como débito |
| **A receber** | seu ganho menos os adiantamentos |

Se você adiantar mais do que ganhou no mês, o valor a receber fica negativo e a
tela mostra "adiantado a mais" — em vez de esconder o vermelho.

Todas as somas são feitas em centavos. Somar `0,10 + 0,20` em ponto flutuante
daria `0,30000000000000004`, e num controle de dinheiro isso não pode acontecer.

---

## O catálogo de procedimentos

O `schema.sql` cria três, com o valor e o percentual iniciais:

| Procedimento | Cliente paga | Profissional |
| --- | --- | --- |
| Combo Mecha | R$ 650,00 | 15% → R$ 97,50 |
| Mega Hair Fita Adesiva | R$ 100,00 | 15% → R$ 15,00 |
| Progressiva | R$ 100,00 | 15% → R$ 15,00 |

**Para acrescentar ou mudar um procedimento**, use o Table Editor do Supabase na
tabela `procedimentos`. Ainda não há tela para isso no app.

Cada atendimento guarda uma **cópia** do valor e do percentual do dia em que foi
lançado. Se o preço do Combo Mecha subir para R$ 800, os atendimentos de antes
continuam valendo R$ 650 — o histórico não se reescreve.

---

## O 5º dia útil

O app pula sábados, domingos e os dias sem compensação bancária: os feriados
nacionais mais Carnaval (segunda e terça), Sexta-feira Santa e Corpus Christi,
que não são feriado na lei mas fecham banco.

Os móveis saem do cálculo da Páscoa, então valem para qualquer ano. Exemplos:

- agosto/2026 → **08/09/2026** (o dia 7 é a Independência e cai na segunda)
- novembro/2026 → **09/11/2026** (o dia 2 é Finados)
- dezembro/2026 → **08/01/2027** (o dia 1º é feriado e cai na sexta)

---

## O que ainda não faz

- **Editar um lançamento.** Dá para lançar e excluir; para corrigir, exclua e
  lance de novo.
- **Vincular o atendimento à cliente cadastrada.** Hoje o nome é texto livre. A
  tabela já tem a coluna `cliente_id` preparada, então é uma tela, não uma
  migração.
- **Tela de catálogo.** Preço e percentual mudam pelo painel do Supabase.
- **Relatório de vários meses.** A navegação é mês a mês.
