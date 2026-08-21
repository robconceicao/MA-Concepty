import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@/components/StatusBadge';
import { TECHNIQUE_BY_ID } from '@/constants/techniques';
import { colors, radius, shadow, spacing, statusColors, typography } from '@/constants/theme';
import type { ClienteView } from '@/store/clientes';
import { descreverPrazo, formatarData } from '@/utils/dates';
import { doFormatoBanco } from '@/utils/phone';

type Props = {
  cliente: ClienteView;
  onPress: () => void;
  onEnviarLembrete: () => void;
};

/**
 * A area de dados e o botao de lembrete sao irmaos, nunca aninhados:
 * um Pressable dentro do outro vira <button> dentro de <button> na web,
 * e o navegador desmonta o card na hidratacao.
 */
export function ClienteCard({ cliente, onPress, onEnviarLembrete }: Props) {
  const tecnica = TECHNIQUE_BY_ID[cliente.tecnica];
  const cor = statusColors[cliente.status];

  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: cor.fg }]} />

      <View style={styles.content}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Abrir cadastro de ${cliente.nome}`}
          style={({ pressed }) => [styles.dados, pressed && styles.pressed]}
        >
          <View style={styles.header}>
            <Text style={styles.nome} numberOfLines={1}>
              {cliente.nome}
            </Text>
            <StatusBadge status={cliente.status} compact />
          </View>

          <View style={styles.linha}>
            <Ionicons name="cut-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>
              {tecnica.label} · {tecnica.maintenanceDays} dias
            </Text>
          </View>

          <View style={styles.linha}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>Retorno em {formatarData(cliente.data_retorno)}</Text>
          </View>
        </Pressable>

        <View style={styles.rodape}>
          <View style={styles.prazoBloco}>
            <Text style={[styles.prazo, { color: cor.fg }]}>
              {descreverPrazo(cliente.diasRestantes)}
            </Text>
            <Text style={styles.telefone}>{doFormatoBanco(cliente.whatsapp)}</Text>
          </View>

          <Pressable
            onPress={onEnviarLembrete}
            accessibilityRole="button"
            accessibilityLabel={`Enviar lembrete para ${cliente.nome}`}
            style={({ pressed }) => [styles.lembrete, pressed && styles.pressed]}
          >
            <Ionicons name="logo-whatsapp" size={16} color={colors.textInverse} />
            <Text style={styles.lembreteLabel}>Enviar lembrete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  pressed: { opacity: 0.7 },
  stripe: { width: 4 },
  content: { flex: 1, padding: spacing.lg },
  dados: { gap: spacing.xs + 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  nome: { ...typography.subtitle, flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: typography.caption,
  rodape: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  prazoBloco: { flexShrink: 1 },
  prazo: { fontSize: 14, fontWeight: '700' },
  telefone: { ...typography.caption, marginTop: 2 },
  lembrete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  lembreteLabel: { color: colors.textInverse, fontSize: 13, fontWeight: '600' },
});
