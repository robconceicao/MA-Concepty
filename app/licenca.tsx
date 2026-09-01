import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/constants/theme';
import { useLicenseStore } from '@/store/license';

export default function LicenseScreen() {
  const router = useRouter();
  const entrar = useLicenseStore((state) => state.entrar);
  const entrando = useLicenseStore((state) => state.entrando);
  const erro = useLicenseStore((state) => state.erro);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const validar = async () => {
    if (!email.trim() || !senha) return;
    const ok = await entrar(email, senha);
    if (ok) router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>TADEU APPS</Text>
        <Text style={styles.title}>Ativar licença do MA Concepty</Text>
        <Text style={styles.subtitle}>
          Use a conta da Tadeu Apps em que você ativou o plano Gratuito, Pro ou Premium.
        </Text>

        <Text style={styles.label}>E-mail Tadeu Apps</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholder="seu@email.com"
        />

        <Text style={styles.label}>Senha Tadeu Apps</Text>
        <TextInput
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={styles.input}
          placeholder="Sua senha"
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable
          onPress={() => void validar()}
          disabled={entrando || !email.trim() || !senha}
          style={[styles.botao, (entrando || !email.trim() || !senha) && styles.botaoDesabilitado]}
        >
          {entrando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Validar licença</Text>}
        </Pressable>

        <Text style={styles.nota}>
          Após uma validação online, o aplicativo pode reutilizar a licença por até 24 horas sem conexão.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  card: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 12,
  },
  title: {
    marginTop: 10,
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    color: colors.text,
  },
  erro: {
    marginTop: 14,
    color: '#B42318',
  },
  botao: {
    marginTop: 22,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesabilitado: { opacity: 0.55 },
  botaoTexto: { color: '#fff', fontWeight: '800' },
  nota: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
