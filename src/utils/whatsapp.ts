import { Alert } from 'react-native';
import type { Cliente } from '@/types/cliente';

/**
 * Disparo do lembrete. O deep link do WhatsApp entra na Etapa 5;
 * por enquanto so confirma que o botao chega ate aqui com a cliente certa.
 */
export function enviarLembrete(cliente: Pick<Cliente, 'nome'>) {
  Alert.alert(
    'Lembrete',
    `O disparo para ${cliente.nome} abre o WhatsApp na Etapa 5.`
  );
}
