import { Alert, Linking } from 'react-native';
import { apenasDigitos, montarLinkWhatsApp, montarMensagem, paraFormatoBanco } from '@/core/retorno';
import type { ClienteLembrete } from '@/core/retorno';

/**
 * A mensagem e o link sao montados em src/core/retorno.ts, compartilhado com a
 * Edge Function do resumo diario — assim o texto do lembrete existe num lugar so.
 * Aqui fica apenas o que depende do React Native: abrir o aplicativo.
 */
export { montarLinkWhatsApp, montarMensagem, primeiroNome } from '@/core/retorno';
export type { ClienteLembrete } from '@/core/retorno';

/** Abre o WhatsApp na conversa da cliente, com a mensagem pronta. */
export async function abrirWhatsApp(cliente: ClienteLembrete): Promise<boolean> {
  const mensagem = montarMensagem(cliente);
  const link = montarLinkWhatsApp(cliente.whatsapp, mensagem);

  try {
    await Linking.openURL(link);
    return true;
  } catch {
    // Alguns aparelhos sem navegador padrao recusam o https; ai tentamos o esquema do app.
    const numero = apenasDigitos(paraFormatoBanco(cliente.whatsapp));
    const alternativo = `whatsapp://send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
    try {
      await Linking.openURL(alternativo);
      return true;
    } catch {
      Alert.alert(
        'Não foi possível abrir o WhatsApp',
        `Verifique se o aplicativo está instalado e se o número ${numero} está correto.`
      );
      return false;
    }
  }
}
