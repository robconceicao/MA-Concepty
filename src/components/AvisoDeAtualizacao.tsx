import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/theme';
import { useNovaVersao } from '@/hooks/useNovaVersao';

/**
 * Faixa que aparece quando o site já tem um build mais novo do que o aberto.
 *
 * Fica por cima do cabeçalho, e não some sozinha: sair do ar sem avisar seria
 * pior do que ocupar um pedaço da tela até a pessoa decidir.
 */
export function AvisoDeAtualizacao() {
  const temNova = useNovaVersao();
  const [dispensado, setDispensado] = useState(false);
  const insets = useSafeAreaInsets();

  if (Platform.OS !== 'web' || !temNova || dispensado) return null;

  return (
    <View style={[styles.barra, { paddingTop: insets.top + spacing.sm }]}>
      <Ionicons name="sparkles-outline" size={16} color={colors.textInverse} />
      <Text style={styles.texto}>Nova versão disponível</Text>

      <Pressable
        onPress={() => window.location.reload()}
        accessibilityRole="button"
        style={({ pressed }) => [styles.botao, pressed && styles.pressed]}
      >
        <Text style={styles.botaoLabel}>Atualizar</Text>
      </Pressable>

      <Pressable
        onPress={() => setDispensado(true)}
        accessibilityRole="button"
        accessibilityLabel="Dispensar aviso de atualização"
        style={({ pressed }) => [styles.fechar, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.65)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.ink,
  },
  texto: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.textInverse },
  botao: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
  },
  botaoLabel: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  fechar: { padding: spacing.xs },
  pressed: { opacity: 0.7 },
});
