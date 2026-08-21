import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TECHNIQUES, type TechniqueId } from '@/constants/techniques';
import { colors, radius, spacing, typography } from '@/constants/theme';

type Props = {
  value: TechniqueId | null;
  onChange: (value: TechniqueId) => void;
  erro?: string;
};

export function TechniquePicker({ value, onChange, erro }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Técnica</Text>
      <View style={styles.grid}>
        {TECHNIQUES.map((tecnica) => {
          const ativo = tecnica.id === value;
          return (
            <Pressable
              key={tecnica.id}
              onPress={() => onChange(tecnica.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo }}
              style={({ pressed }) => [styles.opcao, ativo && styles.ativo, pressed && styles.pressed]}
            >
              <Text style={[styles.nome, ativo && styles.nomeAtivo]}>{tecnica.label}</Text>
              <Text style={[styles.dias, ativo && styles.diasAtivo]}>
                retorno em {tecnica.maintenanceDays} dias
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!!erro && <Text style={styles.erro}>{erro}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  opcao: {
    flexGrow: 1,
    flexBasis: '47%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  ativo: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.75 },
  nome: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  nomeAtivo: { color: colors.textInverse },
  dias: { fontSize: 11.5, color: colors.textMuted },
  diasAtivo: { color: colors.accentSoft },
  erro: { fontSize: 12.5, color: colors.danger },
});
