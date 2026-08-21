import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  erro?: string;
  ajuda?: string;
};

export function TextField({ label, erro, ajuda, style, multiline, ...rest }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multiline, !!erro && styles.inputErro, style]}
        accessibilityLabel={label}
      />
      {erro ? (
        <Text style={styles.erro}>{erro}</Text>
      ) : ajuda ? (
        <Text style={styles.ajuda}>{ajuda}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15.5,
    color: colors.text,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  inputErro: { borderColor: colors.danger },
  erro: { fontSize: 12.5, color: colors.danger },
  ajuda: typography.caption,
});
