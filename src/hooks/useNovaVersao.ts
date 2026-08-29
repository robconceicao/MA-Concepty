import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { buscarVersaoPublicada, versaoCarregada } from '@/services/versaoWeb';

/** De quanto em quanto tempo perguntar ao servidor, com o app aberto. */
const INTERVALO_MS = 30 * 60 * 1000;
/** Trava para não repetir a consulta a cada piscada de foco. */
const ESPERA_MINIMA_MS = 60 * 1000;

/** Verdadeiro quando o site já publicou um build diferente do que está aberto. */
export function useNovaVersao(): boolean {
  const [temNova, setTemNova] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const atual = versaoCarregada();
    if (!atual) return;

    let ativo = true;
    let relogio: ReturnType<typeof setInterval> | undefined;
    // Começa marcado como "agora": a página acabou de carregar, não faz
    // sentido perguntar de novo no primeiro minuto.
    let ultimaConsulta = Date.now();

    const parar = () => {
      ativo = false;
      document.removeEventListener('visibilitychange', conferir);
      if (relogio) clearInterval(relogio);
    };

    async function conferir() {
      if (!ativo || document.visibilityState !== 'visible') return;
      if (Date.now() - ultimaConsulta < ESPERA_MINIMA_MS) return;
      ultimaConsulta = Date.now();

      try {
        const publicada = await buscarVersaoPublicada();
        if (!ativo || !publicada || publicada === atual) return;
        setTemNova(true);
        // Achou: não há mais nada a descobrir até a página recarregar.
        parar();
      } catch {
        /* sem internet agora; a próxima rodada tenta de novo */
      }
    }

    // O caso que mais importa no iPhone: o app fica suspenso na memória e
    // volta com a página antiga na tela. Ao reaparecer, conferimos.
    document.addEventListener('visibilitychange', conferir);
    relogio = setInterval(conferir, INTERVALO_MS);

    return parar;
  }, []);

  return temNova;
}
