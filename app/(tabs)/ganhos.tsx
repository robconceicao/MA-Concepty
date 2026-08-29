import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvisoErro } from '@/components/AvisoErro';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { fonts } from '@/constants/fonts';
import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import { formatarMoeda, rotuloDoMes } from '@/core/financeiro';
import { useFechamento, useFinanceiroStore } from '@/store/financeiro';
import { formatarData } from '@/utils/dates';

export default function GanhosScreen() {
  const router = useRouter();
  const mes = useFinanceiroStore((state) => state.mes);
  const atendimentos = useFinanceiroStore((state) => state.atendimentos);
  const adiantamentos = useFinanceiroStore((state) => state.adiantamentos);
  const carregando = useFinanceiroStore((state) => state.carregando);
  const atualizando = useFinanceiroStore((state) => state.atualizando);
  const erro = useFinanceiroStore((state) => state.erro);
  const mudarMes = useFinanceiroStore((state) => state.mudarMes);
  const carregar = useFinanceiroStore((state) => state.carregar);
  const removerAtendimento = useFinanceiroStore((state) => state.removerAtendimento);
  const removerAdiantamento = useFinanceiroStore((state) => state.removerAdiantamento);

  const fechamento = useFechamento();

  function confirmarExclusao(titulo: string, mensagem: string, acao: () => Promise<void>) {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await acao();
          } catch (falha) {
            Alert.alert('Não foi possível excluir', String(falha));
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregar({ silencioso: true })}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.titulo}>Ganhos</Text>

        <View style={styles.seletorMes}>
          <Pressable
            onPress={() => mudarMes(-1)}
            hitSlop={10}
            accessibilityLabel="Mês anterior"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={styles.mesAtual}>{rotuloDoMes(mes.ano, mes.mes)}</Text>
          <Pressable
            onPress={() => mudarMes(1)}
            hitSlop={10}
            accessibilityLabel="Próximo mês"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {!!erro && <AvisoErro mensagem={erro} onTentarDeNovo={() => carregar()} />}

        {carregando ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : (
          <>
            <View style={styles.destaque}>
              <Text style={styles.destaqueRotulo}>A receber</Text>
              <Text style={[styles.destaqueValor, fechamento.liquido < 0 && styles.negativo]}>
                {formatarMoeda(fechamento.liquido)}
              </Text>
              <Text style={styles.destaqueData}>
                {fechamento.liquido < 0
                  ? `Adiantado a mais · acerto em ${formatarData(fechamento.pagamentoEm)}`
                  : `em ${formatarData(fechamento.pagamentoEm)} · 5º dia útil`}
              </Text>
            </View>

            <View style={styles.resumo}>
              <Linha
                rotulo={`Atendimentos (${fechamento.atendimentos})`}
                valor={formatarMoeda(fechamento.bruto)}
                observacao="valor pago pelas clientes"
              />
              <Linha rotulo="Seu ganho" valor={formatarMoeda(fechamento.ganho)} destaque />
              <Linha
                rotulo="Adiantamentos"
                valor={fechamento.adiantado > 0 ? `- ${formatarMoeda(fechamento.adiantado)}` : formatarMoeda(0)}
                negativo={fechamento.adiantado > 0}
              />
            </View>

            <View style={styles.acoes}>
              <Button
                label="Lançar atendimento"
                onPress={() => router.push('/atendimento/novo')}
                icon={<Ionicons name="add" size={18} color={colors.textInverse} />}
              />
              <Button
                label="Registrar adiantamento"
                variant="outline"
                onPress={() => router.push('/adiantamento/novo')}
                icon={<Ionicons name="cash-outline" size={17} color={colors.text} />}
              />
            </View>

            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Atendimentos</Text>
              {atendimentos.length === 0 ? (
                <EmptyState
                  icon="cut-outline"
                  titulo="Nenhum atendimento no mês"
                  descricao="Lance os procedimentos realizados para acompanhar o quanto vai receber."
                />
              ) : (
                atendimentos.map((item) => (
                  <View key={item.id} style={styles.item}>
                    <View style={styles.itemTexto}>
                      <Text style={styles.itemTitulo} numberOfLines={1}>
                        {item.procedimentos?.nome ?? 'Procedimento'}
                      </Text>
                      <Text style={typography.caption} numberOfLines={1}>
                        {formatarData(item.data)}
                        {item.nome_cliente ? ` · ${item.nome_cliente}` : ''}
                      </Text>
                    </View>
                    <View style={styles.itemValores}>
                      <Text style={styles.itemGanho}>{formatarMoeda(item.valor_profissional)}</Text>
                      <Text style={styles.itemBruto}>
                        de {formatarMoeda(item.valor_cliente)} · {Number(item.percentual_profissional)}%
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        confirmarExclusao(
                          'Excluir atendimento',
                          `${item.procedimentos?.nome ?? 'Procedimento'} de ${formatarData(item.data)}?`,
                          () => removerAtendimento(item.id)
                        )
                      }
                      hitSlop={8}
                      accessibilityLabel="Excluir atendimento"
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            {adiantamentos.length > 0 && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Adiantamentos</Text>
                {adiantamentos.map((item) => (
                  <View key={item.id} style={styles.item}>
                    <View style={styles.itemTexto}>
                      <Text style={styles.itemTitulo}>{item.descricao ?? 'Adiantamento'}</Text>
                      <Text style={typography.caption}>{formatarData(item.data)}</Text>
                    </View>
                    <Text style={[styles.itemGanho, styles.negativo]}>
                      - {formatarMoeda(item.valor)}
                    </Text>
                    <Pressable
                      onPress={() =>
                        confirmarExclusao(
                          'Excluir adiantamento',
                          `${formatarMoeda(item.valor)} de ${formatarData(item.data)}?`,
                          () => removerAdiantamento(item.id)
                        )
                      }
                      hitSlop={8}
                      accessibilityLabel="Excluir adiantamento"
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Linha({
  rotulo,
  valor,
  observacao,
  destaque = false,
  negativo = false,
}: {
  rotulo: string;
  valor: string;
  observacao?: string;
  destaque?: boolean;
  negativo?: boolean;
}) {
  return (
    <View style={styles.linha}>
      <View style={styles.linhaTexto}>
        <Text style={[styles.linhaRotulo, destaque && styles.linhaRotuloDestaque]}>{rotulo}</Text>
        {!!observacao && <Text style={styles.linhaObservacao}>{observacao}</Text>}
      </View>
      <Text
        style={[styles.linhaValor, destaque && styles.linhaValorDestaque, negativo && styles.negativo]}
      >
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  titulo: { fontFamily: fonts.display, fontSize: 30, color: colors.text },
  pressed: { opacity: 0.6 },

  seletorMes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  mesAtual: { fontSize: 15.5, fontWeight: '600', color: colors.text },

  spinner: { marginVertical: spacing.xxl },

  destaque: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 2,
    ...shadow.card,
  },
  destaqueRotulo: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.accentSoft,
  },
  destaqueValor: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  destaqueData: { fontSize: 13, color: colors.accentSoft, marginTop: 2 },
  negativo: { color: colors.late },

  resumo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linhaTexto: { flex: 1 },
  linhaRotulo: { fontSize: 14.5, color: colors.text },
  linhaRotuloDestaque: { fontWeight: '700' },
  linhaObservacao: { ...typography.caption, fontSize: 12 },
  linhaValor: { fontSize: 15, color: colors.text },
  linhaValorDestaque: { fontSize: 17, fontWeight: '700' },

  acoes: { gap: spacing.sm },

  secao: { gap: spacing.sm },
  secaoTitulo: { fontFamily: fonts.displayMedium, fontSize: 19, color: colors.text },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  itemTexto: { flex: 1, gap: 1 },
  itemTitulo: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  itemValores: { alignItems: 'flex-end' },
  itemGanho: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemBruto: { ...typography.caption, fontSize: 11.5 },
});
