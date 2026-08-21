import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Props = {
  mensagem: string;
  onTentarDeNovo?: () => void;
};

export function AvisoErro({ mensagem, onTentarDeNovo }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.danger} />
      <Text style={styles.texto}>{mensagem}</Text>
      {onTentarDeNovo && (
        <Pressable
          onPress={onTentarDeNovo}
          accessibilityRole="button"
          style={({ pressed }) => [styles.botao, pressed && styles.pressed]}
        >
          <Text style={styles.botaoLabel}>Tentar de novo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lateSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  texto: { flex: 1, fontSize: 13.5, color: colors.danger },
  botao: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  botaoLabel: { fontSize: 12.5, fontWeight: '700', color: colors.danger },
});
