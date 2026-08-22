import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Sem as chaves no .env o app roda em modo demonstracao, com os clientes
 * de exemplo em memoria. Assim da para navegar antes de configurar o Supabase.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const MODO_DEMO = !isSupabaseConfigured;

if (MODO_DEMO) {
  console.warn(
    '[MARCO Concept Beauty] Supabase não configurado: rodando em modo demonstração. ' +
      'Copie .env.example para .env e preencha as chaves.'
  );
}

/**
 * Nao usamos Realtime em lugar nenhum do app, mas o createClient monta o cliente
 * de Realtime na hora e exige um WebSocket. No navegador e no aparelho ele existe;
 * ao renderizar a versao web dentro do Node (Node abaixo da 22 nao tem WebSocket
 * global) o construtor estourava e derrubava a tela inteira. Este stub so entra
 * nesse caso: se algum dia alguem tentar usar Realtime, o erro diz o porque.
 */
class WebSocketIndisponivel {
  constructor() {
    throw new Error(
      'Realtime nao e usado neste app. Rode em Node 22+ para habilitar WebSocket.'
    );
  }
}

const realtimeSemWebSocket =
  typeof globalThis.WebSocket === 'undefined'
    ? { transport: WebSocketIndisponivel as unknown as typeof WebSocket }
    : undefined;

export const supabase = createClient(
  supabaseUrl ?? 'https://demo.supabase.co',
  supabaseAnonKey ?? 'chave-de-demonstracao',
  {
    auth: {
      // Na web o proprio navegador guarda a sessao; no app usamos o AsyncStorage.
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: realtimeSemWebSocket,
  }
);

/** Mensagens de erro do Supabase em portugues. */
export function traduzirErro(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? '');

  const mapa: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme o e-mail antes de entrar.',
    'User already registered': 'Já existe uma conta com esse e-mail.',
    'Password should be at least 6 characters': 'A senha precisa de ao menos 6 caracteres.',
    'Failed to fetch': 'Sem conexão com o servidor. Verifique a internet.',
    'Network request failed': 'Sem conexão com o servidor. Verifique a internet.',
  };

  for (const [chave, traducao] of Object.entries(mapa)) {
    if (mensagem.includes(chave)) return traducao;
  }

  if (mensagem.includes('clientes_whatsapp_check')) return 'WhatsApp inválido: informe DDD e número.';
  if (mensagem.includes('clientes_nome_check')) return 'Nome inválido: informe o nome completo.';
  if (mensagem.includes('row-level security')) return 'Sem permissão para esta operação.';

  return mensagem || 'Algo deu errado. Tente de novo.';
}
