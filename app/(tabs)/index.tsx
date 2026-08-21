import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>MA Concepty</Text>
      <Text style={styles.caption}>
        Estrutura pronta (Etapa 1). O resumo de clientes chega na Etapa 3.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  caption: { ...typography.caption, textAlign: 'center' },
});
