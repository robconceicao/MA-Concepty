import { useMemo } from 'react';
import { create } from 'zustand';
import { useDiaAtual } from '@/hooks/useDiaAtual';
import { MODO_DEMO, traduzirErro } from '@/lib/supabase';
import { CLIENTES_MOCK } from '@/mocks/clientes';
import {
  atualizarCliente,
  criarCliente,
  listarClientes,
  registrarLembrete,
  removerCliente,
} from '@/services/clientes';
import type { Cliente, ClienteInput, ReturnStatus } from '@/types/cliente';
import { calcularDataRetorno, diasAteRetorno, foiHoje, statusDoRetorno, toISODate } from '@/utils/dates';
import { abrirWhatsApp } from '@/utils/whatsapp';

export type FiltroStatus = 'todas' | ReturnStatus;

/** Cliente + prazo calculado, que e o que as telas consomem. */
export type ClienteView = Cliente & {
  diasRestantes: number;
  status: ReturnStatus;
  /** O lembrete de hoje ja foi disparado para esta cliente. */
  avisadaHoje: boolean;
};

type ClientesState = {
  clientes: Cliente[];
  carregando: boolean;
  /** Recarga disparada pelo puxar-para-atualizar. */
  atualizando: boolean;
  erro: string | null;
  busca: string;
  filtro: FiltroStatus;
  setBusca: (busca: string) => void;
  setFiltro: (filtro: FiltroStatus) => void;
  carregar: (opcoes?: { silencioso?: boolean }) => Promise<void>;
  criar: (input: ClienteInput) => Promise<Cliente>;
  atualizar: (id: string, input: ClienteInput) => Promise<void>;
  remover: (id: string) => Promise<void>;
  /** Abrir WhatsApp não comprova envio. */
  enviarLembrete: (cliente: ClienteView) => Promise<void>;
  lembretesAbertos: string[];
  confirmarLembrete: (cliente: ClienteView) => Promise<void>;
  limpar: () => void;
};

export function comPrazo(cliente: Cliente, agora: Date = new Date()): ClienteView {
  const diasRestantes = diasAteRetorno(cliente.data_retorno, agora);
  return {
    ...cliente,
    diasRestantes,
    status: statusDoRetorno(diasRestantes),
    avisadaHoje: foiHoje(cliente.ultimo_lembrete_em, agora),
  };
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Monta a linha localmente. So o modo demonstracao usa isso. */
function montarLocal(input: ClienteInput, base?: Cliente): Cliente {
  const agora = new Date().toISOString();
  return {
    id: base?.id ?? `local-${Date.now()}`,
    user_id: base?.user_id ?? 'demo',
    nome: input.nome.trim(),
    whatsapp: input.whatsapp,
    tecnica: input.tecnica,
    ultima_aplicacao: input.ultima_aplicacao,
    observacoes: input.observacoes?.trim() ? input.observacoes.trim() : null,
    ativo: base?.ativo ?? true,
    ultimo_lembrete_em: base?.ultimo_lembrete_em ?? null,
    data_retorno: toISODate(calcularDataRetorno(input.ultima_aplicacao, input.tecnica)),
    created_at: base?.created_at ?? agora,
    updated_at: agora,
  };
}

export const useClientesStore = create<ClientesState>((set, get) => ({
  clientes: MODO_DEMO ? CLIENTES_MOCK : [],
  carregando: false,
  atualizando: false,
  lembretesAbertos: [],
  erro: null,
  busca: '',
  filtro: 'todas',

  setBusca: (busca) => set({ busca }),
  setFiltro: (filtro) => set({ filtro }),

  carregar: async ({ silencioso = false } = {}) => {
    if (MODO_DEMO) return;
    set(silencioso ? { atualizando: true, erro: null } : { carregando: true, erro: null });
    try {
      const clientes = await listarClientes();
      set({ clientes, carregando: false, atualizando: false });
    } catch (erro) {
      set({ erro: traduzirErro(erro), carregando: false, atualizando: false });
    }
  },

  criar: async (input) => {
    if (MODO_DEMO) {
      const novo = montarLocal(input);
      set((state) => ({ clientes: [novo, ...state.clientes] }));
      return novo;
    }
    const novo = await criarCliente(input);
    set((state) => ({ clientes: [novo, ...state.clientes] }));
    return novo;
  },

  atualizar: async (id, input) => {
    const aplicar = (atualizado: Cliente) =>
      set((state) => ({
        clientes: state.clientes.map((cliente) => (cliente.id === id ? atualizado : cliente)),
      }));

    if (MODO_DEMO) {
      const base = get().clientes.find((cliente) => cliente.id === id);
      aplicar(montarLocal(input, base));
      return;
    }
    aplicar(await atualizarCliente(id, input));
  },

  remover: async (id) => {
    if (!MODO_DEMO) await removerCliente(id);
    set((state) => ({ clientes: state.clientes.filter((cliente) => cliente.id !== id) }));
  },

  enviarLembrete: async (cliente) => {
    const abriu = await abrirWhatsApp(cliente);
    if (abriu) set(state => ({ lembretesAbertos: [...new Set([...state.lembretesAbertos, cliente.id])] }));
  },

  confirmarLembrete: async (cliente) => {
    // Explicit operator confirmation; never a provider delivery receipt.
    if (!get().lembretesAbertos.includes(cliente.id)) return;
    try {
      const marcado = MODO_DEMO
        ? { ...cliente, ultimo_lembrete_em: new Date().toISOString() }
        : await registrarLembrete(cliente.id);
      set(state => ({
        clientes: state.clientes.map(item => item.id === cliente.id ? marcado : item),
        lembretesAbertos: state.lembretesAbertos.filter(id => id !== cliente.id),
        erro: null,
      }));
    } catch (erro) {
      set({ erro: traduzirErro(erro) });
      throw erro;
    }
  },

  limpar: () =>
    set({ clientes: MODO_DEMO ? CLIENTES_MOCK : [], busca: '', filtro: 'todas', erro: null, lembretesAbertos: [] }),
}));

/** Todas as clientes com prazo, ordenadas por urgencia (mais atrasada primeiro). */
function comPrazoOrdenadas(clientes: Cliente[]): ClienteView[] {
  return clientes.map(cliente => comPrazo(cliente)).sort((a, b) => a.diasRestantes - b.diasRestantes);
}

/**
 * Os derivados ficam em useMemo, e nao dentro do seletor do Zustand: o store v5
 * compara por identidade, entao um seletor que monta objeto novo a cada render
 * entra em loop infinito.
 */
export function useClientesFiltradas(): ClienteView[] {
  const dia = useDiaAtual();
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
  }, [clientes, busca, filtro, dia]);
}

export type Resumo = {
  total: number;
  proximas: number;
  atrasadas: number;
  noPrazo: number;
  /** Quem ainda precisa de aviso hoje: atrasadas e proximas que nao foram avisadas. */
  avisos: ClienteView[];
  /** Quantas ja receberam o lembrete hoje. */
  avisadasHoje: number;
};

export function useResumo(): Resumo {
  const dia = useDiaAtual();
  const clientes = useClientesStore((state) => state.clientes);

  return useMemo(() => {
    const todas = comPrazoOrdenadas(clientes);
    return {
      total: todas.length,
      proximas: todas.filter((c) => c.status === 'proximo').length,
      atrasadas: todas.filter((c) => c.status === 'atrasado').length,
      noPrazo: todas.filter((c) => c.status === 'no_prazo').length,
      avisos: todas.filter((c) => c.status !== 'no_prazo' && !c.avisadaHoje),
      avisadasHoje: todas.filter((c) => c.avisadaHoje).length,
    };
  }, [clientes, dia]);
}

export function useCliente(id: string): ClienteView | undefined {
  const dia = useDiaAtual();
  const cliente = useClientesStore((state) => state.clientes.find((item) => item.id === id));
  return useMemo(() => (cliente ? comPrazo(cliente) : undefined), [cliente, dia]);
}
