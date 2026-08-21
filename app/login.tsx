import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { fonts } from '@/constants/fonts';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const entrar = useAuthStore((state) => state.entrar);
  const entrando = useAuthStore((state) => state.entrando);
  const erro = useAuthStore((state) => state.erro);
  const limparErro = useAuthStore((state) => state.limparErro);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [validacao, setValidacao] = useState<{ email?: string; senha?: string }>({});

  async function acessar() {
    const novosErros: typeof validacao = {};
    if (!email.includes('@')) novosErros.email = 'Informe um e-mail válido.';
    if (senha.length < 6) novosErros.senha = 'A senha precisa de ao menos 6 caracteres.';
    setValidacao(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const ok = await entrar(email, senha);
    if (ok) router.replace('/');
  }

  return (
    <View style={styles.tela}>
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <Image
            source={require('../assets/brand/logo-full-white.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="MARCO Concept Beauty"
          />
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={styles.titulo}>Entrar</Text>
            <Text style={typography.caption}>
              Use o e-mail e a senha cadastrados no painel do salão.
            </Text>
          </View>

          <TextField
            label="E-mail"
            value={email}
            onChangeText={(valor) => {
              setEmail(valor);
              if (erro) limparErro();
            }}
            placeholder="voce@salao.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            erro={validacao.email}
          />

          <TextField
            label="Senha"
            value={senha}
            onChangeText={(valor) => {
              setSenha(valor);
              if (erro) limparErro();
            }}
            placeholder="••••••"
            secureTextEntry
            autoCapitalize="none"
            erro={validacao.senha}
          />

          {!!erro && (
            <View style={styles.aviso}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.avisoTexto}>{erro}</Text>
            </View>
          )}

          <Button label="Entrar" onPress={acessar} loading={entrando} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: {
    backgroundColor: colors.ink,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  logo: { width: 210, height: 65, marginTop: spacing.xl },
  form: { padding: spacing.lg, gap: spacing.lg },
  intro: { gap: spacing.xs, marginTop: spacing.sm },
  titulo: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lateSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  avisoTexto: { flex: 1, fontSize: 13.5, color: colors.danger },
});
