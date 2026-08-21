import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

/** id === 'novo' abre o formulario de cadastro; qualquer outro id abre a edicao. */
export default function ClienteFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'novo';

  return (
    <View style={styles.container}>
      <Text style={typography.subtitle}>{isNew ? 'Nova cliente' : 'Editar cliente'}</Text>
      <Text style={styles.caption}>Formulario completo na Etapa 3.</Text>
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
