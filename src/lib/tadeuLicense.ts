import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export type LicensedFeature = {
  key: string;
  limitValue: number | null;
  limitUnit: string | null;
};

export type TadeuLicense = {
  plan: 'free' | 'pro' | 'premium' | 'legacy';
  features: LicensedFeature[];
  expiresAt: string | null;
  checkedAt: string;
  offline?: boolean;
};

const APP_SLUG = 'ma-concepty';
const CACHE_KEY = '@ma-concepty:tadeu-license-cache';
const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;

const baseUrl = (process.env.EXPO_PUBLIC_TADEU_APPS_URL || 'https://tadeu-apps-core-test2.vercel.app').replace(/\/$/, '');
const supabaseUrl = process.env.EXPO_PUBLIC_TADEU_APPS_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_TADEU_APPS_SUPABASE_ANON_KEY || '';

export const TadeuLicenseConfigured = Boolean(baseUrl && supabaseUrl && supabaseKey);

const storage = Platform.OS === 'web'
  ? undefined
  : AsyncStorage;

let client: SupabaseClient | null = null;

function authClient() {
  if (!TadeuLicenseConfigured) return null;
  client ??= createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage,
      storageKey: 'ma-concepty-tadeu-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

async function cacheLicense(license: TadeuLicense) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(license));
}

async function readCache(): Promise<TadeuLicense | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TadeuLicense;
    const checked = new Date(parsed.checkedAt).getTime();
    if (!Number.isFinite(checked) || Date.now() - checked > MAX_OFFLINE_MS) return null;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    return { ...parsed, offline: true };
  } catch {
    return null;
  }
}

export async function entrarNaTadeuApps(email: string, senha: string) {
  const auth = authClient();
  if (!auth) throw new Error('Licenciamento Tadeu Apps não configurado.');
  const { error } = await auth.auth.signInWithPassword({ email: email.trim(), password: senha });
  if (error) throw error;
  return buscarLicencaTadeu();
}

export async function buscarLicencaTadeu(): Promise<TadeuLicense> {
  const auth = authClient();
  if (!auth) throw new Error('TADEU_NOT_CONFIGURED');
  const { data } = await auth.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('TADEU_AUTH_REQUIRED');

  try {
    const response = await fetch(`${baseUrl}/api/apps/${APP_SLUG}/license`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok || payload?.license !== 'active') {
      await AsyncStorage.removeItem(CACHE_KEY);
      throw new Error(`TADEU_LICENSE_DENIED:${payload?.reason ?? 'unknown'}`);
    }

    const license: TadeuLicense = {
      plan: payload.plan,
      features: Array.isArray(payload.features) ? payload.features : [],
      expiresAt: payload.expiresAt ?? null,
      checkedAt: new Date().toISOString(),
    };
    await cacheLicense(license);
    return license;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('TADEU_LICENSE_DENIED:')) throw error;
    const cached = await readCache();
    if (cached) return cached;
    throw error;
  }
}

export function temFeature(license: TadeuLicense | null, key: string) {
  if (!license) return false;
  if (license.plan === 'legacy') return true;
  return license.features.some((item) => item.key === key);
}

export function limiteFeature(license: TadeuLicense | null, key: string) {
  const item = license?.features.find((feature) => feature.key === key);
  return item?.limitValue ?? null;
}
