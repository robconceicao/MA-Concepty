import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import {
  NOTIFICACOES_SUPORTADAS,
  cancelarTudo,
  pedirPermissao,
  reagendarAvisos,
  temPermissao,
} from '@/services/notificacoes';
import {
  assinarPush,
  assinaturaAtiva,
  cancelarPush,
  precisaAdicionarNaTelaDeInicio,
  pushWebSuportado,
} from '@/services/pushWeb';
import type { Cliente } from '@/types/cliente';

const CHAVE = '@maconcepty/avisos-ativados';
const NA_WEB = Platform.OS === 'web';

type NotificacoesState = {
  suportado: boolean;
  ativado: boolean;
  ocupado: boolean;
  /** Quantos avisos estão agendados no aparelho (só no app instalado). */
  agendados: number;
  /** No iPhone, o push exige o site adicionado à tela de início. */
  precisaTelaDeInicio: boolean;
  erro: string | null;
  inicializar: () => Promise<void>;
  alternar: (clientes: Cliente[]) => Promise<void>;
  sincronizar: (clientes: Cliente[]) => Promise<void>;
};

/**
 * Dois caminhos bem diferentes para a mesma promessa:
 *
 * - no app instalado, notificação local agendada para as 9h do dia de cada
 *   retorno, sem depender de servidor;
 * - na web, Web Push disparado pelo servidor junto com o resumo das 8h.
 *
 * A tela não precisa saber qual dos dois está em uso.
 */
export const useNotificacoesStore = create<NotificacoesState>((set, get) => ({
  suportado: NA_WEB ? pushWebSuportado() : NOTIFICACOES_SUPORTADAS,
  ativado: false,
  ocupado: false,
  agendados: 0,
  precisaTelaDeInicio: NA_WEB ? precisaAdicionarNaTelaDeInicio() : false,
  erro: null,

  inicializar: async () => {
    if (NA_WEB) {
      set({
        suportado: pushWebSuportado(),
        precisaTelaDeInicio: precisaAdicionarNaTelaDeInicio(),
        ativado: await assinaturaAtiva(),
      });
      return;
    }

    if (!NOTIFICACOES_SUPORTADAS) return;
    const salvo = await AsyncStorage.getItem(CHAVE);
    // A permissão pode ter sido revogada nos ajustes do sistema desde a última vez.
    const ativado = salvo === 'sim' && (await temPermissao());
    set({ ativado });
    if (salvo === 'sim' && !ativado) await AsyncStorage.setItem(CHAVE, 'nao');
  },

  alternar: async (clientes) => {
    if (!get().suportado || get().ocupado) return;
    set({ ocupado: true, erro: null });

    try {
      if (NA_WEB) {
        if (get().ativado) {
          await cancelarPush();
          set({ ativado: false });
          return;
        }
        set({ ativado: await assinarPush() });
        return;
      }

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
    } catch (erro) {
      set({ erro: erro instanceof Error ? erro.message : 'Não foi possível mudar os avisos.' });
    } finally {
      set({ ocupado: false });
    }
  },

  /** Só o app instalado reagenda: na web quem decide a hora é o servidor. */
  sincronizar: async (clientes) => {
    if (NA_WEB || !NOTIFICACOES_SUPORTADAS || !get().ativado) return;
    set({ agendados: await reagendarAvisos(clientes) });
  },
}));
