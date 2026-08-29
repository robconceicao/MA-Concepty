import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { TextField } from '@/components/TextField';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatarMoeda } from '@/core/financeiro';
import { useFinanceiroStore } from '@/store/financeiro';
import { toISODate } from '@/utils/dates';
import { aplicarMascaraMoeda, moedaParaNumero } from '@/utils/moeda';

export default function NovoAdiantamentoScreen() {
  const router = useRouter();
  const criar = useFinanceiroStore((state) => state.criarAdiantamento);

  const [valor, setValor] = useState('');
  const [data, setData] = useState(toISODate(new Date()));
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const numero = moedaParaNumero(valor);

  async function salvar() {
    if (numero <= 0) {
      setErro('Informe o valor adiantado.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await criar({ data, valor: numero, descricao });
      router.back();
    } catch (falha) {
      Alert.alert('Não foi possível salvar', falha instanceof Error ? falha.message : String(falha));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Registrar adiantamento' }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aviso}>
          <Text style={typography.caption}>
            O adiantamento é um valor que você já recebeu. Ele entra como débito e é descontado do
            fechamento do mês.
          </Text>
        </View>

        <TextField
          label="Valor"
          value={valor}
          onChangeText={(texto) => setValor(aplicarMascaraMoeda(texto))}
          placeholder="0,00"
          keyboardType="number-pad"
          erro={erro ?? undefined}
        />

        <DateField label="Data do adiantamento" value={data} onChange={setData} />

        <TextField
          label="Descrição (opcional)"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Adiantamento em dinheiro"
        />

        {numero > 0 && (
          <View style={styles.previa}>
            <Text style={styles.previaRotulo}>Será descontado do mês</Text>
            <Text style={styles.previaValor}>- {formatarMoeda(numero)}</Text>
          </View>
        )}

        <Button label="Registrar adiantamento" onPress={salvar} loading={salvando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  aviso: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  previa: { backgroundColor: colors.lateSoft, borderRadius: radius.lg, padding: spacing.lg },
  previaRotulo: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.late,
  },
  previaValor: { fontSize: 26, fontWeight: '700', color: colors.late, marginTop: spacing.xs },
});
