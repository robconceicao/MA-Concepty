import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  NOTIFICACOES_SUPORTADAS,
  cancelarTudo,
  pedirPermissao,
  reagendarAvisos,
  temPermissao,
} from '@/services/notificacoes';
import type { Cliente } from '@/types/cliente';

const CHAVE = '@maconcepty/avisos-ativados';

type NotificacoesState = {
  suportado: boolean;
  ativado: boolean;
  ocupado: boolean;
  /** Quantos avisos estao agendados no aparelho. */
  agendados: number;
  inicializar: () => Promise<void>;
  alternar: (clientes: Cliente[]) => Promise<void>;
  sincronizar: (clientes: Cliente[]) => Promise<void>;
};

export const useNotificacoesStore = create<NotificacoesState>((set, get) => ({
  suportado: NOTIFICACOES_SUPORTADAS,
  ativado: false,
  ocupado: false,
  agendados: 0,

  inicializar: async () => {
    if (!NOTIFICACOES_SUPORTADAS) return;
    const salvo = await AsyncStorage.getItem(CHAVE);
    // A permissão pode ter sido revogada nos ajustes do sistema desde a última vez.
    const ativado = salvo === 'sim' && (await temPermissao());
    set({ ativado });
    if (salvo === 'sim' && !ativado) await AsyncStorage.setItem(CHAVE, 'nao');
  },

  alternar: async (clientes) => {
    if (!NOTIFICACOES_SUPORTADAS || get().ocupado) return;
    set({ ocupado: true });
    try {
      if (get().ativado) {
        await cancelarTudo();
        await AsyncStorage.setItem(CHAVE, 'nao');
        set({ ativado: false, agendados: 0 });
        return;
      }

      const permitido = await pedirPermissao();
      if (!permitido) {
        set({ ativado: false });
        return;
      }
      const agendados = await reagendarAvisos(clientes);
      await AsyncStorage.setItem(CHAVE, 'sim');
      set({ ativado: true, agendados });
    } finally {
      set({ ocupado: false });
    }
  },

  sincronizar: async (clientes) => {
    if (!NOTIFICACOES_SUPORTADAS || !get().ativado) return;
    set({ agendados: await reagendarAvisos(clientes) });
  },
}));
