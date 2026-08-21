import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

export default function ClientesScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.subtitle}>Clientes</Text>
      <Text style={styles.caption}>Lista, busca e filtros chegam na Etapa 3.</Text>
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
