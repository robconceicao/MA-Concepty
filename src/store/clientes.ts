import { useMemo } from 'react';
import { create } from 'zustand';
import { CLIENTES_MOCK } from '@/mocks/clientes';
import type { Cliente, ClienteInput, ReturnStatus } from '@/types/cliente';
import {
  calcularDataRetorno,
  diasAteRetorno,
  statusDoRetorno,
  toISODate,
} from '@/utils/dates';

export type FiltroStatus = 'todas' | ReturnStatus;

/** Cliente + prazo calculado, que e o que as telas consomem. */
export type ClienteView = Cliente & {
  diasRestantes: number;
  status: ReturnStatus;
};

type ClientesState = {
  clientes: Cliente[];
  busca: string;
  filtro: FiltroStatus;
  setBusca: (busca: string) => void;
  setFiltro: (filtro: FiltroStatus) => void;
  criar: (input: ClienteInput) => Cliente;
  atualizar: (id: string, input: ClienteInput) => void;
  remover: (id: string) => void;
};

function comPrazo(cliente: Cliente): ClienteView {
  const diasRestantes = diasAteRetorno(cliente.data_retorno);
  return { ...cliente, diasRestantes, status: statusDoRetorno(diasRestantes) };
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function montar(input: ClienteInput, base?: Cliente): Cliente {
  const agora = new Date().toISOString();
  return {
    id: base?.id ?? `local-${Date.now()}`,
    user_id: base?.user_id ?? 'mock-user',
    nome: input.nome.trim(),
    whatsapp: input.whatsapp,
    tecnica: input.tecnica,
    ultima_aplicacao: input.ultima_aplicacao,
    observacoes: input.observacoes?.trim() ? input.observacoes.trim() : null,
    ativo: base?.ativo ?? true,
    data_retorno: toISODate(calcularDataRetorno(input.ultima_aplicacao, input.tecnica)),
    created_at: base?.created_at ?? agora,
    updated_at: agora,
  };
}

/**
 * Etapa 3: tudo em memoria, a partir dos mocks.
 * Etapa 4: as mesmas acoes passam a falar com o Supabase.
 */
export const useClientesStore = create<ClientesState>((set) => ({
  clientes: CLIENTES_MOCK,
  busca: '',
  filtro: 'todas',
  setBusca: (busca) => set({ busca }),
  setFiltro: (filtro) => set({ filtro }),
  criar: (input) => {
    const novo = montar(input);
    set((state) => ({ clientes: [novo, ...state.clientes] }));
    return novo;
  },
  atualizar: (id, input) =>
    set((state) => ({
      clientes: state.clientes.map((cliente) =>
        cliente.id === id ? montar(input, cliente) : cliente
      ),
    })),
  remover: (id) =>
    set((state) => ({ clientes: state.clientes.filter((cliente) => cliente.id !== id) })),
}));

/** Todas as clientes com prazo, ordenadas por urgencia (mais atrasada primeiro). */
function comPrazoOrdenadas(clientes: Cliente[]): ClienteView[] {
  return clientes.map(comPrazo).sort((a, b) => a.diasRestantes - b.diasRestantes);
}

/**
 * Os derivados ficam em useMemo, e nao dentro do seletor do Zustand: o store v5
 * compara por identidade, entao um seletor que monta objeto novo a cada render
 * entra em loop infinito.
 */
export function useClientesFiltradas(): ClienteView[] {
  const clientes = useClientesStore((state) => state.clientes);
  const busca = useClientesStore((state) => state.busca);
  const filtro = useClientesStore((state) => state.filtro);

  return useMemo(() => {
    const termo = normalizar(busca);
    return comPrazoOrdenadas(clientes).filter((cliente) => {
      const combinaBusca = !termo || normalizar(cliente.nome).includes(termo);
      const combinaFiltro = filtro === 'todas' || cliente.status === filtro;
      return combinaBusca && combinaFiltro;
    });
  }, [clientes, busca, filtro]);
}

export type Resumo = {
  total: number;
  proximas: number;
  atrasadas: number;
  noPrazo: number;
  /** Quem precisa de aviso: atrasadas e proximas, da mais urgente para a menos. */
  avisos: ClienteView[];
};

export function useResumo(): Resumo {
  const clientes = useClientesStore((state) => state.clientes);

  return useMemo(() => {
    const todas = comPrazoOrdenadas(clientes);
    return {
      total: todas.length,
      proximas: todas.filter((c) => c.status === 'proximo').length,
      atrasadas: todas.filter((c) => c.status === 'atrasado').length,
      noPrazo: todas.filter((c) => c.status === 'no_prazo').length,
      avisos: todas.filter((c) => c.status !== 'no_prazo'),
    };
  }, [clientes]);
}

export function useCliente(id: string): ClienteView | undefined {
  const cliente = useClientesStore((state) => state.clientes.find((item) => item.id === id));
  return useMemo(() => (cliente ? comPrazo(cliente) : undefined), [cliente]);
}
