import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvisoErro } from '@/components/AvisoErro';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { ClienteCard } from '@/components/ClienteCard';
import { EmptyState } from '@/components/EmptyState';
import { SummaryCard } from '@/components/SummaryCard';
import { fonts } from '@/constants/fonts';
import { colors, spacing, typography } from '@/constants/theme';
import { MODO_DEMO } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useClientesStore, useResumo, type FiltroStatus } from '@/store/clientes';
import { enviarLembrete } from '@/utils/whatsapp';

const MAX_AVISOS = 4;

export default function DashboardScreen() {
  const router = useRouter();
  const resumo = useResumo();
  const setFiltro = useClientesStore((state) => state.setFiltro);
  const carregar = useClientesStore((state) => state.carregar);
  const carregando = useClientesStore((state) => state.carregando);
  const atualizando = useClientesStore((state) => state.atualizando);
  const erro = useClientesStore((state) => state.erro);
  const sair = useAuthStore((state) => state.sair);

  function abrirLista(filtro: FiltroStatus) {
    setFiltro(filtro);
    router.push('/clientes');
  }

  const avisos = resumo.avisos.slice(0, MAX_AVISOS);
  const dataExtensa = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const hoje = dataExtensa.charAt(0).toUpperCase() + dataExtensa.slice(1);

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
        <View style={styles.header}>
          <View style={styles.headerTopo}>
            <BrandMark width={132} />
            {!MODO_DEMO && (
              <Pressable
                onPress={sair}
                accessibilityRole="button"
                accessibilityLabel="Sair da conta"
                hitSlop={10}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Text style={styles.data}>{hoje}</Text>
        </View>

        <Text style={styles.titulo}>Manutenções</Text>

        {!!erro && <AvisoErro mensagem={erro} onTentarDeNovo={() => carregar()} />}

        <View style={styles.resumo}>
          <SummaryCard valor={resumo.total} label="Clientes" onPress={() => abrirLista('todas')} />
          <SummaryCard
            valor={resumo.proximas}
            label="Próximas"
            cor={colors.soon}
            fundo={colors.soonSoft}
            onPress={() => abrirLista('proximo')}
          />
          <SummaryCard
            valor={resumo.atrasadas}
            label="Atrasadas"
            cor={colors.late}
            fundo={colors.lateSoft}
            onPress={() => abrirLista('atrasado')}
          />
        </View>

        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoTitulo}>Avisar hoje</Text>
            {resumo.avisos.length > MAX_AVISOS && (
              <Text style={styles.secaoContador}>
                {MAX_AVISOS} de {resumo.avisos.length}
              </Text>
            )}
          </View>

          {carregando ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : avisos.length === 0 ? (
            <EmptyState
              titulo={resumo.total === 0 ? 'Nenhuma cliente ainda' : 'Tudo em dia'}
              descricao={
                resumo.total === 0
                  ? 'Cadastre a primeira cliente na aba Clientes.'
                  : 'Nenhuma cliente entra na janela de retorno nos próximos 10 dias.'
              }
            />
          ) : (
            <View style={styles.lista}>
              {avisos.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onPress={() => router.push(`/cliente/${cliente.id}`)}
                  onEnviarLembrete={() => enviarLembrete(cliente)}
                />
              ))}
            </View>
          )}
        </View>

        <Button
          label="Ver todas as clientes"
          variant="outline"
          onPress={() => abrirLista('todas')}
          icon={<Ionicons name="people-outline" size={17} color={colors.text} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { gap: spacing.xs },
  headerTopo: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pressed: { opacity: 0.6 },
  data: typography.caption,
  titulo: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginTop: spacing.xs },
  resumo: { flexDirection: 'row', gap: spacing.sm },
  secao: { gap: spacing.md },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secaoTitulo: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.text },
  secaoContador: typography.caption,
  spinner: { marginVertical: spacing.xl },
  lista: { gap: spacing.md },
});
