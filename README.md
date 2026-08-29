# MA Concepty

App de gestao de clientes de Mega Hair com aviso automatico de manutencao via WhatsApp.

## Stack

| Camada | Escolha |
| --- | --- |
| App | React Native + Expo (SDK 57), Android/iOS/Web |
| Navegacao | expo-router (rotas por arquivo, tipadas) |
| Estilo | StyleSheet + design tokens em `src/constants/theme.ts` |
| Estado | Zustand |
| Backend | Supabase (Postgres + auth) |
| Datas | date-fns |

> Sobre o estilo: o prompt permitia NativeWind ou StyleSheet. Optei por StyleSheet com
> tokens centralizados porque o NativeWind 4 ainda nao declara suporte ao React Native 0.86
> usado pelo SDK 57 — a troca sairia cara em configuracao de Babel/Metro sem ganho visual.
> A paleta (rosa seco, dourado/bege, branco quente) vive num unico arquivo e pode migrar
> para o `tailwind.config.js` depois, se quisermos.

## Regras de negocio

Intervalo de retorno por tecnica:

| Tecnica | Dias |
| --- | --- |
| Fita Adesiva | 45 |
| Ponto Americano | 60 |
| Queratina | 90 |
| Microesferas | 60 |

Status do retorno: **No Prazo** (verde, mais de 10 dias), **Proximo** (amarelo, 10 dias ou
menos) e **Atrasado** (vermelho, data ja passou).

## Marca

Base preta e branca da logo, com rosa seco e dourado como acento
(`src/constants/theme.ts`). Os icones sao gerados a partir dos arquivos
oficiais enviados pela marca:

| Arquivo | Uso |
| --- | --- |
| `assets/icon.png` | icone do app (monograma MA preto no branco) |
| `assets/android-icon-foreground.png` + `-background` + `-monochrome` | adaptive icon do Android |
| `assets/splash-icon.png` | splash: assinatura branca sobre `#0E0E0E` |
| `assets/favicon.png` | web |
| `assets/brand/*.png` | monograma e assinatura, preto e branco, para uso nas telas |

Os titulos usam Playfair Display (licenca OFL), embarcada em `assets/fonts` e
carregada por `expo-font` no layout raiz.

## Banco de dados

O passo a passo completo, com telas e solucao de problemas, esta em
**[docs/SUPABASE.md](docs/SUPABASE.md)**. Em resumo:

1. Crie o projeto em [supabase.com](https://supabase.com) (plano free, regiao Sao Paulo).
2. SQL Editor > New query > cole `supabase/schema.sql` > Run.
3. Authentication > Users > Add user, confirmando o e-mail automaticamente.
4. Opcional: `supabase/seed.sql` (troque o e-mail no topo) para popular exemplos.
5. Project Settings > API: copie a URL e a chave publica para o seu `.env`.

O que o script cria:

- enum `tecnica_mega_hair` e a funcao `dias_manutencao()` com os prazos da marca;
- tabela `clientes`, com `data_retorno` calculada pelo proprio banco;
- view `clientes_com_status`, que devolve `dias_restantes` e `status`
  (`no_prazo` / `proximo` / `atrasado`, com o corte em 10 dias);
- trigger de `updated_at`, indices de busca e RLS por conta.

## Estrutura

```
app/                    rotas (expo-router)
  _layout.tsx           stack raiz + tema
  (tabs)/_layout.tsx    abas Dashboard / Clientes
  (tabs)/index.tsx      Dashboard
  (tabs)/clientes.tsx   Lista de clientes
  (tabs)/ganhos.tsx     Fechamento do mes e lancamentos
  cliente/[id].tsx      Cadastro (id = "novo") e edicao
  atendimento/novo.tsx  Lancar procedimento realizado
  adiantamento/novo.tsx Registrar adiantamento
src/
  core/retorno.ts       regras de retorno e texto do lembrete (compartilhado
                        com a Edge Function; sem React Native e sem imports)
  core/financeiro.ts    fechamento do mes, dias uteis e feriados bancarios
  components/           componentes de UI reutilizaveis
  constants/theme.ts    cores, espacamentos, tipografia
  constants/techniques.ts  tecnicas e prazos de manutencao
  lib/supabase.ts       cliente Supabase, modo demo e traducao de erros
  services/clientes.ts  queries de cliente (select/insert/update/delete)
  services/notificacoes.ts  agendamento dos avisos no aparelho (app instalado)
  services/pushWeb.ts   assinatura de Web Push (versao web)
  store/auth.ts         sessao e login
  store/                estado global (Zustand)
  types/cliente.ts      tipos do dominio
  mocks/clientes.ts     clientes de exemplo (Etapa 3)
  utils/                datas, telefone, WhatsApp
supabase/
  schema.sql            tabela, view de status, RLS (Etapa 2)
  seed.sql              clientes de exemplo (opcional)
  cron.sql              agendamento do resumo diario
  functions/resumo-diario/  Edge Function que envia o e-mail
eas.json                perfis de build (development, preview, production)
assets/                 icones, splash, fontes e logos da marca
```

## Rodando

Requer Node 20.19+ (a 22 LTS e a recomendada).

```bash
npm install
cp .env.example .env    # preencha depois da Etapa 2
npm start               # QR code para o Expo Go
npm run android         # ou ios / web
npm run typecheck
```

## Instalando no celular

O passo a passo esta em **[docs/BUILD.md](docs/BUILD.md)**. Resumo:

```bash
eas login && eas init          # uma vez
eas env:push preview --path .env
npm run build:android          # APK para instalar direto
npm run build:ios              # precisa do Apple Developer Program
npm run build:dev              # build com dev client, para iterar
```

Perfis em `eas.json`:

| Perfil | Para que serve |
| --- | --- |
| `development` | build com dev client; Android em APK, iOS no simulador |
| `preview` | o app de verdade, instalado fora da loja (APK / ad hoc) |
| `production` | `.aab` para a Play Store, com `autoIncrement` da versao |

Nas notificacoes vale usar o `preview` ou o `development`: no Expo Go o suporte
e limitado.

## Etapas

- [x] **Etapa 1** — estrutura do projeto e dependencias
- [x] **Etapa 2** — modelagem do banco no Supabase (`supabase/schema.sql`)
- [x] **Etapa 3** — telas (Dashboard, lista com busca e filtros, cadastro) com dados mockados
- [x] **Etapa 4** — calculo de datas e integracao Supabase (login, CRUD e RLS)
- [x] **Etapa 5** — disparo do WhatsApp via `Linking`

## Telas

- **Hoje** — resumo (total, proximas, atrasadas) e as clientes que precisam de
  aviso, da mais urgente para a menos. Os cartoes do resumo levam para a lista
  ja filtrada.
- **Clientes** — busca por nome (sem diferenciar acento ou maiuscula) e filtros
  por status, com contador em cada chip.
- **Cadastro/edicao** — nome, WhatsApp com mascara, tecnica, data da ultima
  aplicacao e observacoes. A data de retorno aparece em tempo real conforme a
  tecnica e a data mudam.

## Dados e login

Com as chaves no `.env`, o app pede login (e-mail e senha criados em
Authentication > Users) e todo o resto vem do Supabase:

- `src/store/auth.ts` guarda a sessao e escuta `onAuthStateChange`; a sessao
  fica no AsyncStorage, entao o login sobrevive a fechar o app;
- `app/_layout.tsx` protege as rotas: sem sessao vai para `/login`, com sessao
  volta para o inicio, e a lista so e buscada depois que existe sessao;
- `src/services/clientes.ts` faz as queries. O payload nunca inclui `id`,
  `user_id`, `data_retorno`, `created_at` nem `updated_at`: quem preenche esses
  campos e o banco;
- o status (`no_prazo` / `proximo` / `atrasado`) e recalculado no app a cada
  render, em `src/utils/dates.ts`, para virar sozinho na virada do dia. A view
  `clientes_com_status` continua util para consultas SQL e relatorios.

**Modo demonstracao:** sem `.env`, o app abre direto (sem login) com os clientes
de exemplo de `src/mocks/clientes.ts`, em memoria. Serve para navegar pelas
telas antes de configurar o Supabase.

## Lembrete no WhatsApp

O botao "Enviar lembrete" abre o WhatsApp ja na conversa da cliente, com a
mensagem pronta (`src/utils/whatsapp.ts`):

> Ola, [Nome]! ✨ Passando para lembrar que esta chegando a hora da manutencao
> do seu Mega Hair ([Tecnica]). Seu retorno ideal e ate o dia [Data]. Vamos
> agendar? 🥰

O link usado e `https://wa.me/<numero>?text=<mensagem>`, e nao o esquema
`whatsapp://`: a partir do Android 11 abrir um esquema de outro app exige
declara-lo no manifesto, enquanto o `wa.me` e um app link ja verificado pelo
proprio WhatsApp. Com o app instalado ele abre a conversa; sem o app, cai no
WhatsApp Web. O esquema `whatsapp://` continua como segunda tentativa.

## Controle de lembretes enviados

Cada disparo grava o horario em `clientes.ultimo_lembrete_em`. A partir dai:

- o botao da cliente vira **"Avisada hoje"**, e um novo toque pede confirmacao
  antes de mandar de novo;
- quem ja foi avisada sai da lista **"Avisar hoje"** do inicio, que passa a
  mostrar quantas ja receberam o lembrete;
- a virada do dia usa o fuso do aparelho (`foiHoje()` em `src/utils/dates.ts`);
  a view `clientes_com_status` faz o mesmo calculo em `America/Sao_Paulo`,
  porque o banco do Supabase roda em UTC.

Se o registro falhar (a internet caiu depois que o WhatsApp abriu), o app marca
localmente assim mesmo: o lembrete ja saiu, e travar a tela por causa disso
seria pior.

## Ganhos

A aba **Ganhos** fecha o mes: quanto as clientes pagaram, quanto e do
profissional, quanto ja foi adiantado e quanto sobra para receber — no 5o dia
util do mes seguinte, pulando fim de semana e feriado bancario.

O catalogo comeca com Combo Mecha (R$ 650, 15%), Mega Hair Fita Adesiva
(R$ 100, 15%) e Progressiva (R$ 100, 15%). Cada atendimento guarda uma copia do
valor e do percentual do dia, entao mudar o preco nao reescreve o historico.

Detalhes, incluindo o que ainda nao faz, em **[docs/GANHOS.md](docs/GANHOS.md)**.

## Resumo diario por e-mail

Todo dia as 8h chega um e-mail com quem precisa de aviso — atrasadas e proximas —
e um botao por cliente que abre o WhatsApp com a mensagem pronta. Quem ja foi
avisada no dia nao entra, e sem pendencias o e-mail nao e enviado.

E o substituto das notificacoes para quem usa a versao web no iPhone. O passo a
passo esta em **[docs/RESUMO-DIARIO.md](docs/RESUMO-DIARIO.md)**: Edge Function
no Supabase, envio pela Resend e agendamento com `pg_cron`.

O texto do lembrete nao esta duplicado: a funcao importa o mesmo
`src/core/retorno.ts` que o aplicativo usa, entao mudar a mensagem num lugar
muda nos dois.

## Aviso na tela do iPhone (Web Push)

Site adicionado a tela de inicio recebe notificacao push a partir do iOS 16.4,
sem App Store e sem a assinatura da Apple. O aviso sai junto com o resumo das
8h, pela mesma Edge Function, e tocar nele abre o app.

Junto com o aviso, o icone ganha um badge com quantas clientes esperam — ele so
sai quando o app e aberto, mesmo que a notificacao seja dispensada.

Passo a passo em **[docs/PUSH-IPHONE.md](docs/PUSH-IPHONE.md)**: chaves VAPID,
tabela `push_assinaturas`, segredos, como ligar no aparelho e como fazer o
banner ficar parado ate voce agir. O service worker que recebe o aviso e o
`public/sw.js`.

## Avisos no dia do retorno

O card no inicio liga notificacoes **locais**, agendadas no proprio aparelho
para as 9h do dia do retorno de cada cliente (`src/services/notificacoes.ts`).
Tocar na notificacao abre a ficha da cliente.

Escolhemos notificacao local, e nao push por servidor, porque resolve o mesmo
problema sem nenhuma infraestrutura: nada de tokens, servidor de envio ou cron.
A troca e que os avisos vivem no aparelho onde o app esta instalado — se o salao
quiser receber em varios aparelhos, ou com o app desinstalado, ai sim seria
preciso um servidor (Edge Function + `pg_cron` + Expo Push).

A lista e reagendada do zero sempre que as clientes mudam, entao editar uma data
ou excluir uma cliente nunca deixa aviso orfao. Sao agendados os 40 retornos mais
proximos — o iOS guarda no maximo 64 notificacoes locais por app.

> **Expo Go:** o agendamento local funciona, mas o Expo avisa que o suporte a
> notificacoes no Expo Go e limitado (no Android, principalmente). Para o
> comportamento definitivo, gere um dev build (`npx expo run:android`) ou um
> build pelo EAS.

## Usando pelo navegador (iPhone e Android)

A versao web e uma SPA e roda no Safari e no Chrome do celular. Da para
adicionar a tela de inicio: `public/manifest.json` e as meta tags de
`public/index.html` fazem o app abrir em tela cheia, com o monograma MA como
icone (`public/apple-touch-icon.png` e os icones 192/512, inclusive o maskable
do Android).

Para colocar no ar:

```bash
npx expo export --platform web
npx eas deploy                # EAS Hosting; Netlify ou Vercel servem igual
```

Os caminhos do manifesto e dos icones sao absolutos (`/manifest.json`), entao o
site precisa ficar na raiz do dominio.

**O que muda em relacao ao app instalado:** o aviso no dia do retorno vira um
push diario disparado pelo servidor, em vez de uma notificacao por cliente
agendada no aparelho (veja a secao de Web Push), e o seletor de data vira um
campo `dd/mm/aaaa`. Login, cadastro, busca, filtros e o botao do WhatsApp funcionam
igual — o link `wa.me` abre o aplicativo do WhatsApp normalmente.

## Versao web

`app.json` usa `web.output: "single"`, ou seja, a web e uma SPA: o app roda
inteiro no navegador, sem render no servidor. Com o `"static"` anterior o Metro
executava as telas dentro do Node antes de mandar o HTML, e isso trazia dois
problemas que a SPA elimina:

- em Node abaixo da 22 nao existe `WebSocket` global, e o `createClient` do
  Supabase (que monta o cliente de Realtime na hora, mesmo sem a gente usar)
  estourava com "Node.js detected but native WebSocket not found";
- o HTML gerado no servidor nao batia com o do navegador (as datas sao
  calculadas na hora), o que gerava avisos de hidratacao do React.

Por seguranca o `src/lib/supabase.ts` tambem passa um `transport` de Realtime
quando nao ha `WebSocket` global, entao o cliente monta em qualquer runtime.
Nada disso afeta Android e iOS.

## Atualizando a versao web

Nao existe CI/CD: `git push` nao publica nada. O site so muda quando alguem
roda, na raiz do projeto:

```bash
npm run deploy:web
# equivale a: expo export --platform web && eas deploy --prod
```

Depois do deploy, quem ja estava com o app aberto nao troca de versao sozinho —
principalmente no iPhone, onde o app da tela de inicio fica suspenso na memoria
com a pagina antiga. Para isso existe a faixa de aviso
(`src/components/AvisoDeAtualizacao.tsx`).

Como ela sabe que saiu build novo: o Expo poe o hash do conteudo no nome do
bundle (`entry-<hash>.js`) e o `index.html` aponta para ele. O app le esse hash
das proprias tags `<script>` e compara com o hash do `index.html` publicado,
buscado com `cache: 'no-store'`. Se mudou, saiu versao nova. Nao existe arquivo
de versao para lembrar de atualizar, e nao ha passo extra no deploy.

Quando a comparacao acontece (`src/hooks/useNovaVersao.ts`):

- ao voltar para o app (`visibilitychange`) — e o caso do iPhone reabrindo da
  memoria;
- a cada 30 minutos, com o app aberto e visivel;
- nunca duas vezes no mesmo minuto, e nunca com a aba escondida.

A faixa nao some sozinha: ou a pessoa toca em **Atualizar** (que chama
`location.reload()`) ou fecha no **x**. Em desenvolvimento o bundle e servido
sem hash no nome, entao `versaoCarregada()` devolve `null` e a verificacao fica
desligada — no aplicativo nativo tambem.

O `public/sw.js` de proposito nao faz cache de nada, entao nao ha risco de
sobrar versao velha presa no aparelho depois do reload.

### O que nao se atualiza sozinho

Os dados (clientes, atendimentos) sao buscados quando a tela abre e no
"puxar para atualizar", mas o app nao usa Realtime. Lancar um atendimento no
computador nao aparece no celular ate recarregar aquela tela.
