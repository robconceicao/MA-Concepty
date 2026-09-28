import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { toISODate } from '@/core/retorno';
export function useDiaAtual(): string {
  const [dia, setDia] = useState(() => toISODate(new Date()));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const atualizar = () => {
      clearTimeout(timer);
      const agora = new Date();
      setDia(toISODate(agora));
      const meiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
      timer = setTimeout(atualizar, meiaNoite.getTime() - agora.getTime() + 100);
    };
    atualizar();
    const app = AppState.addEventListener('change', estado => { if (estado === 'active') atualizar(); });
    const visible = () => { if (document.visibilityState === 'visible') atualizar(); };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', visible);
    return () => { clearTimeout(timer); app.remove(); if (Platform.OS === 'web') document.removeEventListener('visibilitychange', visible); };
  }, []);
  return dia;
}
