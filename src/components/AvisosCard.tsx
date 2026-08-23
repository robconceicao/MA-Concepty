import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { HORA_DO_AVISO } from '@/services/notificacoes';

type Props = {
  ativado: boolean;
  agendados: number;
  ocupado: boolean;
  /** No iPhone, o push exige o site adicionado à tela de início. */
  precisaTelaDeInicio?: boolean;
  erro?: string | null;
  onAlternar: () => void;
};

const NA_WEB = Platform.OS === 'web';

/** Liga ou desliga o aviso no dia do retorno. */
export function AvisosCard({
  ativado,
  agendados,
  ocupado,
  precisaTelaDeInicio = false,
  erro,
  onAlternar,
}: Props) {
  function descrever(): string {
    if (precisaTelaDeInicio) {
      return 'Adicione o app à tela de início pelo botão Compartilhar do Safari para receber avisos.';
    }
    if (!ativado) {
      return NA_WEB
        ? 'Receba um aviso no celular quando houver cliente para avisar'
        : `Receba uma notificação às ${HORA_DO_AVISO}h no dia de cada retorno`;
    }
    return NA_WEB
      ? 'Aviso diário ligado neste aparelho'
      : `${agendados} agendado${agendados === 1 ? '' : 's'} para as ${HORA_DO_AVISO}h`;
  }

  return (
    <View style={styles.card}>
      <View style={styles.linha}>
        <View style={[styles.icone, ativado && styles.iconeAtivo]}>
          <Ionicons
            name={ativado ? 'notifications' : 'notifications-off-outline'}
            size={17}
            color={ativado ? colors.accent : colors.textMuted}
          />
        </View>

        <View style={styles.texto}>
          <Text style={styles.titulo}>Avisos no dia do retorno</Text>
          <Text style={typography.caption}>{descrever()}</Text>
        </View>

        <Switch
          value={ativado}
          onValueChange={onAlternar}
          disabled={ocupado || precisaTelaDeInicio}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.surface}
          accessibilityLabel="Ativar avisos no dia do retorno"
        />
      </View>

      {!!erro && <Text style={styles.erro}>{erro}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  erro: { fontSize: 12.5, color: colors.danger },
});
