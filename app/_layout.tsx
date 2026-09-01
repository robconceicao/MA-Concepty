import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AvisoDeAtualizacao } from '@/components/AvisoDeAtualizacao';
import { fontAssets, fonts } from '@/constants/fonts';
import { colors } from '@/constants/theme';
import { NOTIFICACOES_SUPORTADAS } from '@/services/notificacoes';
import { limparBadge } from '@/services/pushWeb';
import { useAuthStore } from '@/store/auth';
import { useClientesStore } from '@/store/clientes';
import { useFinanceiroStore } from '@/store/financeiro';
import { useLicenseStore } from '@/store/license';
import { useNotificacoesStore } from '@/store/notificacoes';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useRotaProtegida() {
  const sessao = useAuthStore((state) => state.sessao);
  const iniciando = useAuthStore((state) => state.iniciando);
  const license = useLicenseStore((state) => state.license);
  const iniciandoLicenca = useLicenseStore((state) => state.iniciando);
  const configurado = useLicenseStore((state) => state.configurado);
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (iniciando) return;
    const rotaAtual = segmentos[0];
    const naTelaDeLogin = rotaAtual === 'login';
    const naTelaDeLicenca = rotaAtual === 'licenca';

    if (!sessao) {
      if (!naTelaDeLogin) router.replace('/login');
      return;
    }

    if (configurado) {
      if (iniciandoLicenca) return;
      if (!license && !naTelaDeLicenca) {
        router.replace('/licenca');
        return;
      }
      if (license && (naTelaDeLogin || naTelaDeLicenca)) {
        router.replace('/');
        return;
      }
    } else if (naTelaDeLogin || naTelaDeLicenca) {
      router.replace('/');
    }
  }, [
    sessao,
    iniciando,
    license,
    iniciandoLicenca,
    configurado,
    segmentos,
    router,
  ]);
}

export default function RootLayout() {
  const [fontesCarregadas, erroFontes] = useFonts(fontAssets);
  const inicializar = useAuthStore((state) => state.inicializar);
  const sessao = useAuthStore((state) => state.sessao);
  const iniciando = useAuthStore((state) => state.iniciando);
  const inicializarLicenca = useLicenseStore((state) => state.inicializar);
  const limparLicenca = useLicenseStore((state) => state.limpar);
  const iniciandoLicenca = useLicenseStore((state) => state.iniciando);
  const configuradoLicenca = useLicenseStore((state) => state.configurado);
  const carregarClientes = useClientesStore((state) => state.carregar);
  const limparClientes = useClientesStore((state) => state.limpar);
  const clientes = useClientesStore((state) => state.clientes);
  const carregarGanhos = useFinanceiroStore((state) => state.carregar);
  const limparGanhos = useFinanceiroStore((state) => state.limpar);
  const iniciarAvisos = useNotificacoesStore((state) => state.inicializar);
  const sincronizarAvisos = useNotificacoesStore((state) => state.sincronizar);
  const router = useRouter();

  useEffect(() => inicializar(), [inicializar]);

  useEffect(() => {
    if (sessao) void inicializarLicenca();
    else limparLicenca();
  }, [sessao, inicializarLicenca, limparLicenca]);

  useEffect(() => {
    if (sessao) {
      carregarClientes();
      carregarGanhos();
    } else {
      limparClientes();
      limparGanhos();
    }
  }, [sessao, carregarClientes, limparClientes, carregarGanhos, limparGanhos]);

  useEffect(() => {
    iniciarAvisos();
  }, [iniciarAvisos]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    limparBadge();

    const aoVoltar = () => {
      if (document.visibilityState === 'visible') limparBadge();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, []);

  useEffect(() => {
    sincronizarAvisos(clientes);
  }, [clientes, sincronizarAvisos]);

  useEffect(() => {
    if (!NOTIFICACOES_SUPORTADAS) return;
    let ativo = true;
    const assinatura = Notifications.addNotificationResponseReceivedListener((resposta) => {
      const clienteId = resposta.notification.request.content.data?.clienteId;
      if (ativo && typeof clienteId === 'string') router.push(`/cliente/${clienteId}`);
    });
    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, [router]);

  useRotaProtegida();

  useEffect(() => {
    if (fontesCarregadas || erroFontes) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontesCarregadas, erroFontes]);

  if (!fontesCarregadas && !erroFontes && Platform.OS !== 'web') return null;

  if (iniciando || (sessao && configuradoLicenca && iniciandoLicenca)) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 19 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="licenca" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
        <Stack.Screen name="atendimento/novo" options={{ title: 'Lançar atendimento' }} />
        <Stack.Screen name="adiantamento/novo" options={{ title: 'Registrar adiantamento' }} />
      </Stack>
      <AvisoDeAtualizacao />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
