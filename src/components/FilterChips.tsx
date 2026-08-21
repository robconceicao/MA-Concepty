import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import type { FiltroStatus } from '@/store/clientes';

export type ChipOption = {
  id: FiltroStatus;
  label: string;
  count: number;
  cor?: string;
};

type Props = {
  options: ChipOption[];
  value: FiltroStatus;
  onChange: (value: FiltroStatus) => void;
};

export function FilterChips({ options, value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const ativo = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            style={({ pressed }) => [styles.chip, ativo && styles.chipAtivo, pressed && styles.pressed]}
          >
            {option.cor && <Text style={[styles.dot, { color: option.cor }]}>●</Text>}
            <Text style={[styles.label, ativo && styles.labelAtivo]}>
              {option.label} ({option.count})
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.75 },
  dot: { fontSize: 9 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelAtivo: { color: colors.textInverse },
});
