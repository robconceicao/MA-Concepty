import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClienteCard } from '@/components/ClienteCard';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips, type ChipOption } from '@/components/FilterChips';
import { SearchField } from '@/components/SearchField';
import { fonts } from '@/constants/fonts';
import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import { useClientesFiltradas, useClientesStore, useResumo } from '@/store/clientes';
import { enviarLembrete } from '@/utils/whatsapp';

export default function ClientesScreen() {
  const router = useRouter();
  const clientes = useClientesFiltradas();
  const resumo = useResumo();
  const busca = useClientesStore((state) => state.busca);
  const filtro = useClientesStore((state) => state.filtro);
  const setBusca = useClientesStore((state) => state.setBusca);
  const setFiltro = useClientesStore((state) => state.setFiltro);

  const filtros: ChipOption[] = [
    { id: 'todas', label: 'Todas', count: resumo.total },
    { id: 'atrasado', label: 'Atrasadas', count: resumo.atrasadas, cor: colors.late },
    { id: 'proximo', label: 'Próximas', count: resumo.proximas, cor: colors.soon },
    { id: 'no_prazo', label: 'No prazo', count: resumo.noPrazo, cor: colors.onTime },
  ];

  const semCadastro = resumo.total === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={clientes}
        keyExtractor={(cliente) => cliente.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.titulo}>Clientes</Text>
            <Text style={styles.subtitulo}>
              {resumo.total} {resumo.total === 1 ? 'cadastrada' : 'cadastradas'}
            </Text>
            <SearchField value={busca} onChangeText={setBusca} />
            <FilterChips options={filtros} value={filtro} onChange={setFiltro} />
          </View>
        }
        renderItem={({ item }) => (
          <ClienteCard
            cliente={item}
            onPress={() => router.push(`/cliente/${item.id}`)}
            onEnviarLembrete={() => enviarLembrete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={
          semCadastro ? (
            <EmptyState
              icon="person-add-outline"
              titulo="Nenhuma cliente ainda"
              descricao="Toque no botão + para cadastrar a primeira."
            />
          ) : (
            <EmptyState
              icon="search-outline"
              titulo="Nada por aqui"
              descricao="Nenhuma cliente combina com a busca e o filtro selecionados."
            />
          )
        }
      />

      <Pressable
        onPress={() => router.push('/cliente/novo')}
        accessibilityRole="button"
        accessibilityLabel="Cadastrar nova cliente"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={26} color={colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 96 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  titulo: { fontFamily: fonts.display, fontSize: 30, color: colors.text },
  subtitulo: { ...typography.caption, marginTop: -spacing.sm },
  separador: { height: spacing.md },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  fabPressed: { opacity: 0.8 },
});
