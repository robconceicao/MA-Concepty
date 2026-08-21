import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fontAssets, fonts } from '@/constants/fonts';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* a splash ja pode ter sido escondida */
});

export default function RootLayout() {
  const [fontesCarregadas, erroFontes] = useFonts(fontAssets);

  useEffect(() => {
    if (fontesCarregadas || erroFontes) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontesCarregadas, erroFontes]);

  // Na web a fonte entra depois; segurar a tela aqui quebraria a hidratacao.
  if (!fontesCarregadas && !erroFontes && Platform.OS !== 'web') return null;

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
