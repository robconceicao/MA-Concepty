import { create } from 'zustand';
import {
  buscarLicencaTadeu,
  entrarNaTadeuApps,
  limiteFeature,
  TadeuLicenseConfigured,
  temFeature,
  type TadeuLicense,
} from '@/lib/tadeuLicense';

type LicenseState = {
  license: TadeuLicense | null;
  iniciando: boolean;
  entrando: boolean;
  erro: string | null;
  configurado: boolean;
  inicializar: () => Promise<void>;
  entrar: (email: string, senha: string) => Promise<boolean>;
  limpar: () => void;
  temFeature: (key: string) => boolean;
  limite: (key: string) => number | null;
};

export const useLicenseStore = create<LicenseState>((set, get) => ({
  license: null,
  iniciando: TadeuLicenseConfigured,
  entrando: false,
  erro: null,
  configurado: TadeuLicenseConfigured,

  inicializar: async () => {
    if (!TadeuLicenseConfigured) {
      set({ iniciando: false });
      return;
    }
    set({ iniciando: true, erro: null });
    try {
      const license = await buscarLicencaTadeu();
      set({ license, iniciando: false });
    } catch {
      set({ license: null, iniciando: false });
    }
  },

  entrar: async (email, senha) => {
    set({ entrando: true, erro: null });
    try {
      const license = await entrarNaTadeuApps(email, senha);
      set({ license, entrando: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      set({
        entrando: false,
        erro: message.startsWith('TADEU_LICENSE_DENIED:')
          ? 'Sua conta Tadeu Apps não possui assinatura ativa do MA Concepty.'
          : 'Não foi possível validar a licença. Confira e-mail, senha e conexão.',
      });
      return false;
    }
  },

  limpar: () => set({ license: null, erro: null }),
  temFeature: (key) => temFeature(get().license, key),
  limite: (key) => limiteFeature(get().license, key),
}));
