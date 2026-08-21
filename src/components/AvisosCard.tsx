import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { HORA_DO_AVISO } from '@/services/notificacoes';

type Props = {
  ativado: boolean;
  agendados: number;
  ocupado: boolean;
  onAlternar: () => void;
};

/** Liga ou desliga a notificação no dia do retorno. */
export function AvisosCard({ ativado, agendados, ocupado, onAlternar }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.icone, ativado && styles.iconeAtivo]}>
        <Ionicons
          name={ativado ? 'notifications' : 'notifications-off-outline'}
          size={17}
          color={ativado ? colors.accent : colors.textMuted}
        />
      </View>

      <View style={styles.texto}>
        <Text style={styles.titulo}>Avisos no dia do retorno</Text>
        <Text style={typography.caption}>
          {ativado
            ? `${agendados} agendado${agendados === 1 ? '' : 's'} para as ${HORA_DO_AVISO}h`
            : `Receba uma notificação às ${HORA_DO_AVISO}h no dia de cada retorno`}
        </Text>
      </View>

      <Switch
        value={ativado}
        onValueChange={onAlternar}
        disabled={ocupado}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.surface}
        accessibilityLabel="Ativar avisos no dia do retorno"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeAtivo: { backgroundColor: colors.accentSoft },
  texto: { flex: 1, gap: 1 },
  titulo: { fontSize: 14.5, fontWeight: '600', color: colors.text },
});
