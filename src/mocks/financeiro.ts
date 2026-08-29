import type { Adiantamento, Atendimento, Procedimento } from '@/types/financeiro';
import { ganhoDoProcedimento } from '@/core/financeiro';

const agora = new Date().toISOString();
const base = { user_id: 'demo', created_at: agora, updated_at: agora };

export const PROCEDIMENTOS_MOCK: Procedimento[] = [
  { ...base, id: 'proc-1', nome: 'Combo Mecha', valor_cliente: 650, percentual_profissional: 15, ativo: true },
  { ...base, id: 'proc-2', nome: 'Mega Hair Fita Adesiva', valor_cliente: 100, percentual_profissional: 15, ativo: true },
  { ...base, id: 'proc-3', nome: 'Progressiva', valor_cliente: 100, percentual_profissional: 15, ativo: true },
];

/** Dia do mes corrente, para os exemplos cairem sempre no fechamento aberto. */
function diaDesteMes(dia: number): string {
  const hoje = new Date();
  const seguro = Math.min(dia, new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate());
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(seguro).padStart(2, '0')}`;
}

function atendimento(
  id: string,
  procedimento: Procedimento,
  dia: number,
  nomeCliente: string
): Atendimento {
  return {
    ...base,
    id,
    procedimento_id: procedimento.id,
    cliente_id: null,
    nome_cliente: nomeCliente,
    data: diaDesteMes(dia),
    valor_cliente: procedimento.valor_cliente,
    percentual_profissional: procedimento.percentual_profissional,
    valor_profissional: ganhoDoProcedimento(
      procedimento.valor_cliente,
      procedimento.percentual_profissional
    ),
    observacoes: null,
    procedimentos: { nome: procedimento.nome },
  };
}

const [combo, fita, progressiva] = PROCEDIMENTOS_MOCK;

export const ATENDIMENTOS_MOCK: Atendimento[] = [
  atendimento('at-1', combo, 3, 'Ana Beatriz Moraes'),
  atendimento('at-2', fita, 8, 'Carolina Prado'),
  atendimento('at-3', progressiva, 12, 'Marina Lopes'),
  atendimento('at-4', combo, 17, 'Juliana Ferraz'),
  atendimento('at-5', fita, 21, 'Bianca Rezende'),
];

export const ADIANTAMENTOS_MOCK: Adiantamento[] = [
  { ...base, id: 'ad-1', data: diaDesteMes(15), valor: 100, descricao: 'Adiantamento em dinheiro' },
];
