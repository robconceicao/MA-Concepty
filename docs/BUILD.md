# Instalando o app no celular (EAS Build)

O EAS compila o app na nuvem da Expo e devolve um arquivo instalável — não
precisa de Android Studio nem de Xcode. Para Android funciona de graça; para
iPhone, veja a seção do iOS (precisa de conta paga da Apple).

---

## 1. Uma vez só: preparar

```bash
# na raiz do projeto
npm install
npm install -g eas-cli     # ou use npx eas-cli em cada comando
eas login                  # conta gratuita do expo.dev
eas init                   # cria o projeto no EAS e grava o projectId no app.json
```

O `eas init` acrescenta `extra.eas.projectId` ao `app.json`. **Faça commit dessa
mudança** — é o que amarra o repositório ao projeto no EAS.

---

## 2. Uma vez só: mandar as chaves do Supabase

O `.env` fica só na sua máquina (está no `.gitignore`), e o EAS compila num
servidor. Sem esse passo o app sai do build em modo demonstração.

```bash
eas env:push preview --path .env
eas env:push production --path .env
```

Ou uma variável por vez:

```bash
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value "https://<seu-ref>.supabase.co" \
  --environment preview --environment production --visibility plaintext
```

`plaintext` é o certo aqui: essas duas variáveis são embutidas no aplicativo de
qualquer jeito (é o que o prefixo `EXPO_PUBLIC_` significa), e quem protege os
dados é o RLS. A `service_role` continua fora do app.

Conferir o que está lá: `eas env:list preview`.

---

## 3. Android — o caminho curto

```bash
npm run build:android      # eas build --platform android --profile preview
```

1. Na primeira vez o EAS pergunta se pode gerar a **keystore** de assinatura.
   Responda **sim** — ele guarda e reusa nos próximos builds.
2. O build entra na fila e leva de 10 a 20 minutos. Ao terminar, o terminal
   mostra um link e um QR code.
3. Abra o link no celular, baixe o `.apk` e instale. O Android vai pedir para
   permitir instalação de "fontes desconhecidas" para o navegador — é normal
   para um app fora da Play Store.

Pronto: o ícone MA aparece na sua tela inicial, com notificações funcionando de
verdade (aqui não é Expo Go).

---

## 4. iOS — o que muda

Instalar num iPhone real exige o **Apple Developer Program (US$ 99/ano)**. Não é
limitação do EAS: a Apple só permite instalar fora da App Store com um
certificado de conta paga.

Com a conta:

```bash
eas device:create          # registra o iPhone (mostra um QR para abrir no aparelho)
npm run build:ios          # eas build --platform ios --profile preview
```

O EAS cuida dos certificados. Ao final, abra o link no iPhone e instale.

Sem a conta paga, as opções são:

| Opção | Precisa de | Serve para |
| --- | --- | --- |
| **Versão web na tela de início** | nada | uso real no dia a dia, menos as notificações |
| Simulador do iOS | um Mac | testar tudo, menos notificação push real |
| Expo Go | nada | ver as telas; notificações locais são limitadas |
| TestFlight | conta paga | distribuir para outras pessoas testarem |

A primeira linha costuma resolver: publique a versão web
(`npx expo export --platform web && npx eas deploy`), abra o endereço no Safari
do iPhone e toque em Compartilhar → **Adicionar à Tela de Início**. O app abre
em tela cheia, com o ícone da marca, e o botão do WhatsApp funciona. O que fica
de fora são os avisos no dia do retorno.

Build para o simulador (o perfil `development` já está configurado assim):

```bash
eas build --platform ios --profile development
eas build:run -p ios --latest
```

---

## 5. Build de desenvolvimento (para iterar rápido)

Diferente do build acima, este vem com o **dev client**: você instala uma vez e
depois o código recarrega na hora, como no Expo Go, mas com todos os módulos
nativos do projeto.

```bash
npm run build:dev          # instala o APK/IPA resultante no aparelho
npx expo start --dev-client
```

É o jeito recomendado de testar as **notificações do dia do retorno**, que no
Expo Go têm suporte limitado.

---

## 6. Publicar nas lojas (quando quiser)

```bash
eas build --platform android --profile production   # gera .aab para a Play Store
eas submit --platform android --latest
```

O perfil `production` usa `autoIncrement`, então o número da versão sobe sozinho
a cada build. A versão visível continua vindo do `version` no `app.json`.

---

## Perguntas que costumam aparecer

**Preciso pagar o EAS?** O plano gratuito compila os dois sistemas, com fila
compartilhada (o build demora mais para começar) e um limite mensal de builds.
Para um app de um salão, sobra. Os valores atuais estão em
[expo.dev/pricing](https://expo.dev/pricing).

**Mudei o código, e agora?** Um novo `npm run build:android` gera um novo APK.
Se isso virar rotina, dá para adicionar EAS Update depois e mandar só o
JavaScript, sem refazer o build.

**Trocaram as chaves do Supabase?** Rode o `eas env:push` de novo e refaça o
build — as variáveis entram no aplicativo na hora da compilação.

**O build falhou.** O link que o terminal mostra abre o log completo no site do
EAS. Os tropeços mais comuns são o `projectId` faltando (rode `eas init`) e
variáveis de ambiente não configuradas (passo 2).
