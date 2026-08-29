import { useMemo } from 'react';
import { create } from 'zustand';
import {
  calcularFechamento,
  dataDePagamento,
  ganhoDoProcedimento,
  primeiroDiaDoMes,
  ultimoDiaDoMes,
  type Fechamento,
} from '@/core/financeiro';
import { MODO_DEMO, traduzirErro } from '@/lib/supabase';
import { ADIANTAMENTOS_MOCK, ATENDIMENTOS_MOCK, PROCEDIMENTOS_MOCK } from '@/mocks/financeiro';
import {
  criarAdiantamento as criarAdiantamentoRemoto,
  criarAtendimento as criarAtendimentoRemoto,
  listarAdiantamentos,
  listarAtendimentos,
  listarProcedimentos,
  removerAdiantamento as removerAdiantamentoRemoto,
  removerAtendimento as removerAtendimentoRemoto,
} from '@/services/financeiro';
import type {
  Adiantamento,
  AdiantamentoInput,
  Atendimento,
  AtendimentoInput,
  Procedimento,
} from '@/types/financeiro';

export type MesReferencia = { ano: number; mes: number };

function mesAtual(): MesReferencia {
  const hoje = new Date();
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
}

function dentroDoMes(data: string, mes: MesReferencia): boolean {
  return data >= primeiroDiaDoMes(mes.ano, mes.mes) && data <= ultimoDiaDoMes(mes.ano, mes.mes);
}

type FinanceiroState = {
  procedimentos: Procedimento[];
  atendimentos: Atendimento[];
  adiantamentos: Adiantamento[];
  /** Mes que a tela esta mostrando. */
  mes: MesReferencia;
  carregando: boolean;
  atualizando: boolean;
  erro: string | null;
  mudarMes: (passo: number) => void;
  carregar: (opcoes?: { silencioso?: boolean }) => Promise<void>;
  criarAtendimento: (input: AtendimentoInput) => Promise<void>;
  removerAtendimento: (id: string) => Promise<void>;
  criarAdiantamento: (input: AdiantamentoInput) => Promise<void>;
  removerAdiantamento: (id: string) => Promise<void>;
  limpar: () => void;
};

export const useFinanceiroStore = create<FinanceiroState>((set, get) => ({
  procedimentos: MODO_DEMO ? PROCEDIMENTOS_MOCK : [],
  atendimentos: MODO_DEMO ? ATENDIMENTOS_MOCK : [],
  adiantamentos: MODO_DEMO ? ADIANTAMENTOS_MOCK : [],
  mes: mesAtual(),
  carregando: false,
  atualizando: false,
  erro: null,

  mudarMes: (passo) => {
    const { ano, mes } = get().mes;
    const data = new Date(ano, mes + passo, 1);
    set({ mes: { ano: data.getFullYear(), mes: data.getMonth() } });
    get().carregar();
  },

  carregar: async ({ silencioso = false } = {}) => {
    const { ano, mes } = get().mes;

    // No modo demonstração os exemplos ficam em memória, mas o filtro por mês
    // precisa valer igual — se não, trocar de mês parece não fazer nada.
    if (MODO_DEMO) {
      set({
        atendimentos: ATENDIMENTOS_MOCK.filter((a) => dentroDoMes(a.data, get().mes)),
        adiantamentos: ADIANTAMENTOS_MOCK.filter((a) => dentroDoMes(a.data, get().mes)),
      });
      return;
    }

    set(silencioso ? { atualizando: true, erro: null } : { carregando: true, erro: null });

    try {
      const de = primeiroDiaDoMes(ano, mes);
      const ate = ultimoDiaDoMes(ano, mes);
      const [procedimentos, atendimentos, adiantamentos] = await Promise.all([
        listarProcedimentos(),
        listarAtendimentos(de, ate),
        listarAdiantamentos(de, ate),
      ]);
      set({ procedimentos, atendimentos, adiantamentos, carregando: false, atualizando: false });
    } catch (erro) {
      set({ erro: traduzirErro(erro), carregando: false, atualizando: false });
    }
  },

  criarAtendimento: async (input) => {
    const procedimento = get().procedimentos.find((p) => p.id === input.procedimento_id);
    if (!procedimento) throw new Error('Procedimento não encontrado.');

    if (MODO_DEMO) {
      const novo: Atendimento = {
        id: `local-${Date.now()}`,
        user_id: 'demo',
        procedimento_id: procedimento.id,
        cliente_id: input.cliente_id ?? null,
        nome_cliente: input.nome_cliente?.trim() || null,
        data: input.data,
        valor_cliente: procedimento.valor_cliente,
        percentual_profissional: procedimento.percentual_profissional,
        valor_profissional: ganhoDoProcedimento(
          procedimento.valor_cliente,
          procedimento.percentual_profissional
        ),
        observacoes: input.observacoes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        procedimentos: { nome: procedimento.nome },
      };
      set((state) => ({ atendimentos: [novo, ...state.atendimentos] }));
      return;
    }

    const novo = await criarAtendimentoRemoto(input, procedimento);
    // Lancamento de outro mes nao entra na lista que esta na tela.
    if (dentroDoMes(novo.data, get().mes)) {
      set((state) => ({ atendimentos: [novo, ...state.atendimentos] }));
    }
  },

  removerAtendimento: async (id) => {
    if (!MODO_DEMO) await removerAtendimentoRemoto(id);
    set((state) => ({ atendimentos: state.atendimentos.filter((a) => a.id !== id) }));
  },

  criarAdiantamento: async (input) => {
    if (MODO_DEMO) {
      const novo: Adiantamento = {
        id: `local-${Date.now()}`,
        user_id: 'demo',
        data: input.data,
        valor: input.valor,
        descricao: input.descricao?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set((state) => ({ adiantamentos: [novo, ...state.adiantamentos] }));
      return;
    }

    const novo = await criarAdiantamentoRemoto(input);
    if (dentroDoMes(novo.data, get().mes)) {
      set((state) => ({ adiantamentos: [novo, ...state.adiantamentos] }));
    }
  },

  removerAdiantamento: async (id) => {
    if (!MODO_DEMO) await removerAdiantamentoRemoto(id);
    set((state) => ({ adiantamentos: state.adiantamentos.filter((a) => a.id !== id) }));
  },

  limpar: () =>
    set({
      procedimentos: MODO_DEMO ? PROCEDIMENTOS_MOCK : [],
      atendimentos: MODO_DEMO ? ATENDIMENTOS_MOCK : [],
      adiantamentos: MODO_DEMO ? ADIANTAMENTOS_MOCK : [],
      mes: mesAtual(),
      erro: null,
    }),
}));

/** O fechamento do mes que esta na tela. */
export function useFechamento(): Fechamento & { pagamentoEm: Date } {
  const atendimentos = useFinanceiroStore((state) => state.atendimentos);
  const adiantamentos = useFinanceiroStore((state) => state.adiantamentos);
  const mes = useFinanceiroStore((state) => state.mes);

  return useMemo(
    () => ({
      ...calcularFechamento(atendimentos, adiantamentos),
      pagamentoEm: dataDePagamento(mes.ano, mes.mes),
    }),
    [atendimentos, adiantamentos, mes]
  );
}
