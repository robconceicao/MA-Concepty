import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { TextField } from '@/components/TextField';
import { fonts } from '@/constants/fonts';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatarMoeda } from '@/core/financeiro';
import { useFinanceiroStore } from '@/store/financeiro';
import { toISODate } from '@/utils/dates';

export default function NovoAtendimentoScreen() {
  const router = useRouter();
  const procedimentos = useFinanceiroStore((state) => state.procedimentos);
  const criar = useFinanceiroStore((state) => state.criarAtendimento);

  const [procedimentoId, setProcedimentoId] = useState<string | null>(null);
  const [data, setData] = useState(toISODate(new Date()));
  const [nomeCliente, setNomeCliente] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const escolhido = useMemo(
    () => procedimentos.find((p) => p.id === procedimentoId) ?? null,
    [procedimentos, procedimentoId]
  );

  async function salvar() {
    if (!escolhido) {
      setErro('Escolha o procedimento realizado.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await criar({
        procedimento_id: escolhido.id,
        data,
        nome_cliente: nomeCliente,
        observacoes,
      });
      router.back();
    } catch (falha) {
      Alert.alert('Não foi possível salvar', falha instanceof Error ? falha.message : String(falha));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Lançar atendimento' }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grupo}>
          <Text style={styles.rotulo}>Procedimento</Text>
          {procedimentos.length === 0 ? (
            <Text style={typography.caption}>
              Nenhum procedimento cadastrado. Rode o schema.sql para criar o catálogo inicial.
            </Text>
          ) : (
            procedimentos.map((procedimento) => {
              const ativo = procedimento.id === procedimentoId;
              return (
                <Pressable
                  key={procedimento.id}
                  onPress={() => setProcedimentoId(procedimento.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  style={({ pressed }) => [styles.opcao, ativo && styles.opcaoAtiva, pressed && styles.pressed]}
                >
                  <View style={styles.opcaoTexto}>
                    <Text style={[styles.opcaoNome, ativo && styles.textoAtivo]}>
                      {procedimento.nome}
                    </Text>
                    <Text style={[styles.opcaoDetalhe, ativo && styles.detalheAtivo]}>
                      cliente paga {formatarMoeda(procedimento.valor_cliente)} ·{' '}
                      {Number(procedimento.percentual_profissional)}% para você
                    </Text>
                  </View>
                  <Text style={[styles.opcaoGanho, ativo && styles.textoAtivo]}>
                    {formatarMoeda(
                      Math.round(
                        procedimento.valor_cliente * procedimento.percentual_profissional
                      ) / 100
                    )}
                  </Text>
                </Pressable>
              );
            })
          )}
          {!!erro && <Text style={styles.erro}>{erro}</Text>}
        </View>

        <DateField label="Data do atendimento" value={data} onChange={setData} />

        <TextField
          label="Cliente (opcional)"
          value={nomeCliente}
          onChangeText={setNomeCliente}
          placeholder="Ana Beatriz"
          autoCapitalize="words"
          ajuda="Serve para você reconhecer o lançamento depois."
        />

        <TextField
          label="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Algo que valha registrar sobre o atendimento"
          multiline
        />

        {escolhido && (
          <View style={styles.previa}>
            <Text style={styles.previaRotulo}>Seu ganho neste atendimento</Text>
            <Text style={styles.previaValor}>
              {formatarMoeda(
                Math.round(escolhido.valor_cliente * escolhido.percentual_profissional) / 100
              )}
            </Text>
          </View>
        )}

        <Button label="Lançar atendimento" onPress={salvar} loading={salvando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  grupo: { gap: spacing.sm },
  rotulo: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.6 },
  pressed: { opacity: 0.75 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  opcaoAtiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  opcaoTexto: { flex: 1, gap: 1 },
  opcaoNome: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  opcaoDetalhe: { fontSize: 11.5, color: colors.textMuted },
  opcaoGanho: { fontSize: 15, fontWeight: '700', color: colors.text },
  textoAtivo: { color: colors.textInverse },
  detalheAtivo: { color: colors.accentSoft },
  erro: { fontSize: 12.5, color: colors.danger },
  previa: {
    backgroundColor: colors.onTimeSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  previaRotulo: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.onTime,
  },
  previaValor: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
    marginTop: spacing.xs,
  },
});
