import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { formatarData, parseDateOnly, toISODate } from '@/utils/dates';

type Props = {
  label: string;
  /** Data no formato YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
  erro?: string;
  ajuda?: string;
};

/** No app usa o calendario nativo; na web cai num campo dd/mm/aaaa. */
export function DateField({ label, value, onChange, erro, ajuda }: Props) {
  const [aberto, setAberto] = useState(false);
  const [textoWeb, setTextoWeb] = useState(value ? formatarData(value) : '');

  function aplicarTextoWeb(texto: string) {
    const digitos = texto.replace(/\D/g, '').slice(0, 8);
    const mascarado = digitos
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2');
    setTextoWeb(mascarado);

    if (digitos.length === 8) {
      const dia = Number(digitos.slice(0, 2));
      const mes = Number(digitos.slice(2, 4));
      const ano = Number(digitos.slice(4, 8));
      const data = new Date(ano, mes - 1, dia);
      const valida =
        data.getDate() === dia && data.getMonth() === mes - 1 && data.getFullYear() === ano;
      if (valida) onChange(toISODate(data));
    }
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={textoWeb}
          onChangeText={aplicarTextoWeb}
          placeholder="dd/mm/aaaa"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          style={[styles.campo, styles.input, !!erro && styles.erroBorda]}
          accessibilityLabel={label}
        />
        {erro ? <Text style={styles.erro}>{erro}</Text> : ajuda ? <Text style={styles.ajuda}>{ajuda}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatarData(value) : 'não informada'}`}
        style={({ pressed }) => [styles.campo, pressed && styles.pressed, !!erro && styles.erroBorda]}
      >
        <Text style={[styles.valor, !value && styles.placeholder]}>
          {value ? formatarData(value) : 'dd/mm/aaaa'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </Pressable>

      {aberto && (
        <DateTimePicker
          value={value ? parseDateOnly(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(evento, data) => {
            if (Platform.OS === 'android') setAberto(false);
            if (evento.type === 'set' && data) onChange(toISODate(data));
          }}
        />
      )}

      {Platform.OS === 'ios' && aberto && (
        <Pressable onPress={() => setAberto(false)} style={styles.concluir}>
          <Text style={styles.concluirLabel}>Concluir</Text>
        </Pressable>
      )}

      {erro ? <Text style={styles.erro}>{erro}</Text> : ajuda ? <Text style={styles.ajuda}>{ajuda}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.6 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  input: { fontSize: 15.5, color: colors.text },
  pressed: { opacity: 0.75 },
  valor: { fontSize: 15.5, color: colors.text },
  placeholder: { color: colors.textMuted },
  erroBorda: { borderColor: colors.danger },
  erro: { fontSize: 12.5, color: colors.danger },
  ajuda: typography.caption,
  concluir: { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  concluirLabel: { color: colors.primary, fontWeight: '600' },
});
