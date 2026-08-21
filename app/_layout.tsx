import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fontAssets, fonts } from '@/constants/fonts';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { useClientesStore } from '@/store/clientes';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* a splash já pode ter sido escondida */
});

/** Manda para o login quem não tem sessão, e para o app quem já tem. */
function useRotaProtegida() {
  const sessao = useAuthStore((state) => state.sessao);
  const iniciando = useAuthStore((state) => state.iniciando);
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (iniciando) return;
    const naTelaDeLogin = segmentos[0] === 'login';

    if (!sessao && !naTelaDeLogin) router.replace('/login');
    else if (sessao && naTelaDeLogin) router.replace('/');
  }, [sessao, iniciando, segmentos, router]);
}

export default function RootLayout() {
  const [fontesCarregadas, erroFontes] = useFonts(fontAssets);
  const inicializar = useAuthStore((state) => state.inicializar);
  const sessao = useAuthStore((state) => state.sessao);
  const iniciando = useAuthStore((state) => state.iniciando);
  const carregarClientes = useClientesStore((state) => state.carregar);
  const limparClientes = useClientesStore((state) => state.limpar);

  useEffect(() => inicializar(), [inicializar]);

  // A lista só é buscada depois que existe sessão, se não o RLS devolve vazio.
  useEffect(() => {
    if (sessao) carregarClientes();
    else limparClientes();
  }, [sessao, carregarClientes, limparClientes]);

  useRotaProtegida();

  useEffect(() => {
    if (fontesCarregadas || erroFontes) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontesCarregadas, erroFontes]);

  // Na web a fonte entra depois; segurar a tela aqui quebraria a hidratação.
  if (!fontesCarregadas && !erroFontes && Platform.OS !== 'web') return null;

  if (iniciando) {
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
      </Stack>
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
