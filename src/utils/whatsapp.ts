import { Alert, Linking } from 'react-native';
import { TECHNIQUE_BY_ID } from '@/constants/techniques';
import type { Cliente } from '@/types/cliente';
import { formatarData } from '@/utils/dates';
import { apenasDigitos, paraFormatoBanco } from '@/utils/phone';

type ClienteLembrete = Pick<Cliente, 'nome' | 'whatsapp' | 'tecnica' | 'data_retorno'>;

/** "Ana Beatriz Moraes" -> "Ana": a mensagem fica mais natural com o primeiro nome. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/** Mensagem pré-moldada do lembrete de manutenção. */
export function montarMensagem(cliente: ClienteLembrete): string {
  const tecnica = TECHNIQUE_BY_ID[cliente.tecnica].label;
  return (
    `Olá, ${primeiroNome(cliente.nome)}! ✨ Passando para lembrar que está chegando a hora ` +
    `da manutenção do seu Mega Hair (${tecnica}). Seu retorno ideal é até o dia ` +
    `${formatarData(cliente.data_retorno)}. Vamos agendar? 🥰`
  );
}

/**
 * Link universal do WhatsApp. Preferimos wa.me ao esquema whatsapp://
 * porque o Android 11+ exige declarar o esquema no manifesto para abri-lo,
 * enquanto o wa.me e um app link ja verificado pelo proprio WhatsApp:
 * com o app instalado ele abre a conversa, sem o app cai no WhatsApp Web.
 */
export function montarLinkWhatsApp(whatsapp: string, mensagem: string): string {
  const numero = apenasDigitos(paraFormatoBanco(whatsapp));
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/** Abre o WhatsApp na conversa da cliente, com a mensagem pronta. */
export async function enviarLembrete(cliente: ClienteLembrete): Promise<void> {
  const mensagem = montarMensagem(cliente);
  const link = montarLinkWhatsApp(cliente.whatsapp, mensagem);

  try {
    await Linking.openURL(link);
  } catch {
    // Alguns aparelhos sem navegador padrao recusam o https; ai tentamos o esquema do app.
    const numero = apenasDigitos(paraFormatoBanco(cliente.whatsapp));
    const alternativo = `whatsapp://send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
    try {
      await Linking.openURL(alternativo);
    } catch {
      Alert.alert(
        'Não foi possível abrir o WhatsApp',
        `Verifique se o aplicativo está instalado e se o número ${numero} está correto.`
      );
    }
  }
}
