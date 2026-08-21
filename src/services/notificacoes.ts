import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TECHNIQUE_BY_ID } from '@/constants/techniques';
import type { Cliente } from '@/types/cliente';
import { parseDateOnly } from '@/utils/dates';
import { primeiroNome } from '@/utils/whatsapp';

/** Notificacao local nao existe na web. */
export const NOTIFICACOES_SUPORTADAS = Platform.OS !== 'web';

/** Hora do aviso no dia do retorno. */
export const HORA_DO_AVISO = 9;

/**
 * O iOS guarda no maximo 64 notificacoes locais por app. Agendamos as proximas
 * e reagendamos a cada mudanca na lista, entao esse teto nunca aperta.
 */
const MAXIMO_AGENDADO = 40;

const CANAL_ANDROID = 'retornos';

if (NOTIFICACOES_SUPORTADAS) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function prepararCanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
    name: 'Retornos de manutenção',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#C98B8B',
  });
}

export async function temPermissao(): Promise<boolean> {
  if (!NOTIFICACOES_SUPORTADAS) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export async function pedirPermissao(): Promise<boolean> {
  if (!NOTIFICACOES_SUPORTADAS) return false;
  if (await temPermissao()) {
    await prepararCanal();
    return true;
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  if (granted) await prepararCanal();
  return granted;
}

export async function cancelarTudo(): Promise<void> {
  if (!NOTIFICACOES_SUPORTADAS) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Data e hora do aviso: o dia do retorno, as 9h da manha, no fuso do aparelho. */
function momentoDoAviso(dataRetorno: string): Date {
  const data = parseDateOnly(dataRetorno);
  data.setHours(HORA_DO_AVISO, 0, 0, 0);
  return data;
}

/**
 * Reagenda do zero os avisos das clientes cujo retorno ainda esta por vir.
 * Cancelar tudo antes e o caminho mais seguro: renomear, mudar a tecnica ou
 * excluir uma cliente muda a data do aviso, e reconciliar um a um daria margem
 * a avisos orfaos.
 */
export async function reagendarAvisos(clientes: Cliente[]): Promise<number> {
  if (!NOTIFICACOES_SUPORTADAS) return 0;
  await cancelarTudo();

  const agora = Date.now();
  const proximos = clientes
    .filter((cliente) => cliente.ativo)
    .map((cliente) => ({ cliente, quando: momentoDoAviso(cliente.data_retorno) }))
    .filter(({ quando }) => quando.getTime() > agora)
    .sort((a, b) => a.quando.getTime() - b.quando.getTime())
    .slice(0, MAXIMO_AGENDADO);

  for (const { cliente, quando } of proximos) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Retorno de ${primeiroNome(cliente.nome)} é hoje`,
        body: `Manutenção de ${TECHNIQUE_BY_ID[cliente.tecnica].label}. Toque para abrir e enviar o lembrete.`,
        data: { clienteId: cliente.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: quando,
        channelId: CANAL_ANDROID,
      },
    });
  }

  return proximos.length;
}
