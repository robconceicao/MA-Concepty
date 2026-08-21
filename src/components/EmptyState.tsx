import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao?: string;
};

export function EmptyState({ icon = 'sparkles-outline', titulo, descricao }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.circulo}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {descricao && <Text style={styles.descricao}>{descricao}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  circulo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  titulo: { ...typography.subtitle, textAlign: 'center' },
  descricao: { ...typography.caption, textAlign: 'center', maxWidth: 260 },
});
