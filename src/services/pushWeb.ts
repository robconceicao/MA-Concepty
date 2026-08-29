/**
 * Aviso na tela do celular pela versão web (Web Push).
 *
 * No iPhone isso só funciona com o site adicionado à tela de início — é uma
 * regra da Apple, válida a partir do iOS 16.4. No Android e no computador
 * funciona direto no navegador.
 */
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const CHAVE_PUBLICA = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
const CAMINHO_SW = '/sw.js';

/** O navegador tem tudo o que precisamos e a chave VAPID está configurada? */
export function pushWebSuportado(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(CHAVE_PUBLICA)
  );
}

/** No iPhone, o push só existe com o app aberto pela tela de início. */
export function estaNaTelaDeInicio(): boolean {
  if (typeof window === 'undefined') return false;
  const emPe = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone;
  return Boolean(emPe || iosStandalone);
}

export function ehIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** No iPhone fora da tela de início nem adianta pedir permissão. */
export function precisaAdicionarNaTelaDeInicio(): boolean {
  return ehIOS() && !estaNaTelaDeInicio();
}

/** A chave VAPID viaja em base64url e o navegador quer bytes. */
function chaveParaBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const preenchimento = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + preenchimento).replace(/-/g, '+').replace(/_/g, '/');
  const bruto = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

function paraBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function registro(): Promise<ServiceWorkerRegistration> {
  const existente = await navigator.serviceWorker.getRegistration(CAMINHO_SW);
  if (existente) return existente;
  return navigator.serviceWorker.register(CAMINHO_SW);
}

/** Já existe uma assinatura ativa neste aparelho? */
export async function assinaturaAtiva(): Promise<boolean> {
  if (!pushWebSuportado() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration(CAMINHO_SW);
    return Boolean(await reg?.pushManager.getSubscription());
  } catch {
    return false;
  }
}

/**
 * Pede permissão, assina no navegador e guarda o endereço de entrega no banco.
 * Devolve false se a pessoa recusar — sem erro, é uma escolha dela.
 */
export async function assinarPush(): Promise<boolean> {
  if (!pushWebSuportado()) return false;

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return false;

  const reg = await registro();
  await navigator.serviceWorker.ready;

  const assinatura =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chaveParaBytes(CHAVE_PUBLICA!),
    }));

  const { error } = await supabase.from('push_assinaturas').upsert(
    {
      endpoint: assinatura.endpoint,
      p256dh: paraBase64(assinatura.getKey('p256dh')),
      auth: paraBase64(assinatura.getKey('auth')),
      aparelho: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    // Se não conseguimos guardar, a assinatura no navegador seria um fantasma:
    // o aparelho aceitaria avisos que ninguém sabe enviar.
    await assinatura.unsubscribe();
    throw new Error(error.message);
  }

  return true;
}

/** Cancela no navegador e apaga o registro do banco. */
export async function cancelarPush(): Promise<void> {
  if (!pushWebSuportado()) return;

  const reg = await navigator.serviceWorker.getRegistration(CAMINHO_SW);
  const assinatura = await reg?.pushManager.getSubscription();
  if (!assinatura) return;

  await supabase.from('push_assinaturas').delete().eq('endpoint', assinatura.endpoint);
  await assinatura.unsubscribe();
}

/**
 * Badge do ícone: a bolinha vermelha com o número de clientes esperando aviso.
 * Quem coloca é o service worker, ao receber o push; quem tira é o app, ao abrir.
 * Nem todo navegador tem a API, e não ter badge nunca pode quebrar nada.
 */
export async function limparBadge(): Promise<void> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
  try {
    await (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.();
  } catch {
    /* aparelho sem suporte a badge */
  }
}
