import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/constants/theme';
import { useLicenseStore } from '@/store/license';

export default function TabsLayout() {
  const license = useLicenseStore((state) => state.license);
  const configurado = useLicenseStore((state) => state.configurado);
  const temFeature = useLicenseStore((state) => state.temFeature);
  const ganhosLiberados = !configurado || !license || temFeature('financial_gains');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600', lineHeight: 15 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...Platform.select({ web: { height: 68, paddingTop: 6, paddingBottom: 12 }, default: {} }),
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ganhos"
        options={{
          title: 'Ganhos',
          href: ganhosLiberados ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
