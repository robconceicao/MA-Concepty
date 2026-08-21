import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { StatusBadge } from '@/components/StatusBadge';
import { TechniquePicker } from '@/components/TechniquePicker';
import { TextField } from '@/components/TextField';
import { fonts } from '@/constants/fonts';
import { TECHNIQUE_BY_ID, type TechniqueId } from '@/constants/techniques';
import { colors, radius, spacing, statusColors, typography } from '@/constants/theme';
import { useCliente, useClientesStore } from '@/store/clientes';
import {
  calcularDataRetorno,
  descreverPrazo,
  diasAteRetorno,
  formatarData,
  statusDoRetorno,
  toISODate,
} from '@/utils/dates';
import {
  aplicarMascaraTelefone,
  doFormatoBanco,
  paraFormatoBanco,
  telefoneValido,
} from '@/utils/phone';

type Erros = Partial<Record<'nome' | 'whatsapp' | 'tecnica' | 'data', string>>;

export default function ClienteFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const novo = id === 'novo';

  const encontrada = useCliente(id);
  const cliente = novo ? undefined : encontrada;
  const criar = useClientesStore((state) => state.criar);
  const atualizar = useClientesStore((state) => state.atualizar);
  const remover = useClientesStore((state) => state.remover);

  const [nome, setNome] = useState(cliente?.nome ?? '');
  const [whatsapp, setWhatsapp] = useState(cliente ? doFormatoBanco(cliente.whatsapp) : '');
  const [tecnica, setTecnica] = useState<TechniqueId | null>(cliente?.tecnica ?? null);
  const [ultimaAplicacao, setUltimaAplicacao] = useState(
    cliente?.ultima_aplicacao ?? toISODate(new Date())
  );
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? '');
  const [erros, setErros] = useState<Erros>({});

  /** Previsao do retorno enquanto a ficha e preenchida. */
  const previsao = useMemo(() => {
    if (!tecnica || !ultimaAplicacao) return null;
    const dataRetorno = calcularDataRetorno(ultimaAplicacao, tecnica);
    const dias = diasAteRetorno(dataRetorno);
    return { dataRetorno, dias, status: statusDoRetorno(dias) };
  }, [tecnica, ultimaAplicacao]);

  function validar(): boolean {
    const novosErros: Erros = {};
    if (nome.trim().length < 2) novosErros.nome = 'Informe o nome completo.';
    if (!telefoneValido(whatsapp)) novosErros.whatsapp = 'Informe DDD e número.';
    if (!tecnica) novosErros.tecnica = 'Escolha a técnica aplicada.';
    if (!ultimaAplicacao) novosErros.data = 'Informe a data da última aplicação.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function salvar() {
    if (!validar() || !tecnica) return;

    const dados = {
      nome,
      whatsapp: paraFormatoBanco(whatsapp),
      tecnica,
      ultima_aplicacao: ultimaAplicacao,
      observacoes,
    };

    if (novo) criar(dados);
    else atualizar(id, dados);

    router.back();
  }

  function confirmarExclusao() {
    Alert.alert('Excluir cliente', `Remover ${cliente?.nome} da lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          remover(id);
          router.back();
        },
      },
    ]);
  }

  if (!novo && !cliente) {
    return (
      <View style={styles.vazio}>
        <Stack.Screen options={{ title: 'Cliente' }} />
        <Text style={typography.subtitle}>Cliente não encontrada</Text>
        <Button label="Voltar" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: novo ? 'Nova cliente' : 'Editar cliente' }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextField
          label="Nome completo"
          value={nome}
          onChangeText={setNome}
          placeholder="Ana Beatriz Moraes"
          autoCapitalize="words"
          erro={erros.nome}
        />

        <TextField
          label="WhatsApp"
          value={whatsapp}
          onChangeText={(valor) => setWhatsapp(aplicarMascaraTelefone(valor))}
          placeholder="(11) 98765-4321"
          keyboardType="phone-pad"
          erro={erros.whatsapp}
          ajuda="DDD + número. O DDI 55 entra automaticamente."
        />

        <TechniquePicker value={tecnica} onChange={setTecnica} erro={erros.tecnica} />

        <DateField
          label="Última aplicação"
          value={ultimaAplicacao}
          onChange={setUltimaAplicacao}
          erro={erros.data}
        />

        {previsao && (
          <View style={[styles.previsao, { backgroundColor: statusColors[previsao.status].bg }]}>
            <View style={styles.previsaoTopo}>
              <Ionicons name="calendar" size={16} color={statusColors[previsao.status].fg} />
              <Text style={[styles.previsaoTitulo, { color: statusColors[previsao.status].fg }]}>
                Retorno ideal
              </Text>
              <StatusBadge status={previsao.status} compact />
            </View>
            <Text style={styles.previsaoData}>{formatarData(previsao.dataRetorno)}</Text>
            <Text style={styles.previsaoDetalhe}>
              {descreverPrazo(previsao.dias)} · {tecnica ? TECHNIQUE_BY_ID[tecnica].label : ''} a cada{' '}
              {tecnica ? TECHNIQUE_BY_ID[tecnica].maintenanceDays : 0} dias
            </Text>
          </View>
        )}

        <TextField
          label="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Preferências, cor, comprimento, cuidados..."
          multiline
        />

        <View style={styles.acoes}>
          <Button label={novo ? 'Cadastrar cliente' : 'Salvar alterações'} onPress={salvar} />
          {!novo && (
            <Button
              label="Excluir cliente"
              variant="danger"
              onPress={confirmarExclusao}
              icon={<Ionicons name="trash-outline" size={16} color={colors.danger} />}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  previsao: { borderRadius: radius.lg, padding: spacing.lg, gap: 2 },
  previsaoTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previsaoTitulo: {
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  previsaoData: { fontFamily: fonts.display, fontSize: 26, color: colors.text, marginTop: spacing.xs },
  previsaoDetalhe: typography.caption,
  acoes: { gap: spacing.sm, marginTop: spacing.sm },
});
