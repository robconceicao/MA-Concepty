import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        // lineHeight explicito: sem ele a caixa do rotulo fica menor que a fonte
        // e a perna do "j" de "Hoje" some na web.
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600', lineHeight: 15 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // Na web nao existe area segura embaixo, e a barra encosta no fim da
          // janela cortando a perna do "j" de "Hoje". No aparelho o inset ja
          // cuida disso, entao a folga extra e so aqui.
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
    </Tabs>
  );
}
