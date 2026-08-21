import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  small = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? colors.textInverse : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, small && styles.labelSmall, labelColor[variant]]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  small: { paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.lateSoft },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 15, fontWeight: '600' },
  labelSmall: { fontSize: 13.5 },
});

const labelColor = StyleSheet.create({
  primary: { color: colors.textInverse },
  outline: { color: colors.text },
  ghost: { color: colors.textMuted },
  danger: { color: colors.danger },
});
