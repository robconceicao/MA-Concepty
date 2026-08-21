import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, statusColors } from '@/constants/theme';
import type { ReturnStatus } from '@/types/cliente';

type Props = {
  status: ReturnStatus;
  compact?: boolean;
};

export function StatusBadge({ status, compact = false }: Props) {
  const { fg, bg, label } = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, compact && styles.compact]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.label, { color: fg }, compact && styles.labelCompact]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  compact: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12.5, fontWeight: '600', letterSpacing: 0.2 },
  labelCompact: { fontSize: 11.5 },
});
