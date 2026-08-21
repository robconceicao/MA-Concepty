import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { MODO_DEMO, supabase, traduzirErro } from '@/lib/supabase';

type AuthState = {
  sessao: Session | null;
  /** Ainda verificando se existe sessao salva. */
  iniciando: boolean;
  entrando: boolean;
  erro: string | null;
  inicializar: () => () => void;
  entrar: (email: string, senha: string) => Promise<boolean>;
  sair: () => Promise<void>;
  limparErro: () => void;
};

/** Sessão falsa do modo demonstração, para o app abrir sem Supabase. */
const SESSAO_DEMO = { user: { id: 'demo', email: 'demo@marco.app' } } as unknown as Session;

export const useAuthStore = create<AuthState>((set) => ({
  sessao: MODO_DEMO ? SESSAO_DEMO : null,
  iniciando: !MODO_DEMO,
  entrando: false,
  erro: null,

  /** Devolve a funcao de cancelar a escuta de mudancas de sessao. */
  inicializar: () => {
    if (MODO_DEMO) return () => {};

    supabase.auth
      .getSession()
      .then(({ data }) => set({ sessao: data.session, iniciando: false }))
      .catch(() => set({ sessao: null, iniciando: false }));

    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      set({ sessao, iniciando: false });
    });

    return () => data.subscription.unsubscribe();
  },

  entrar: async (email, senha) => {
    set({ entrando: true, erro: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) throw error;
      set({ sessao: data.session, entrando: false });
      return true;
    } catch (erro) {
      set({ erro: traduzirErro(erro), entrando: false });
      return false;
    }
  },

  sair: async () => {
    if (MODO_DEMO) return;
    await supabase.auth.signOut();
    set({ sessao: null });
  },

  limparErro: () => set({ erro: null }),
}));
