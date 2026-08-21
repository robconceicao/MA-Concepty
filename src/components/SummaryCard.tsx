import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, shadow, spacing } from '@/constants/theme';

type Props = {
  valor: number;
  label: string;
  cor?: string;
  fundo?: string;
  onPress?: () => void;
};

export function SummaryCard({ valor, label, cor = colors.text, fundo = colors.surface, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.card, { backgroundColor: fundo }, pressed && styles.pressed]}
    >
      <Text style={[styles.valor, { color: cor }]}>{valor}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
    ...shadow.card,
  },
  pressed: { opacity: 0.75 },
  valor: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
});
