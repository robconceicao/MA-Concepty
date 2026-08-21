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

1. Crie o projeto em [supabase.com](https://supabase.com) (plano free).
2. SQL Editor > New query > cole `supabase/schema.sql` > Run.
3. Authentication > Users > Add user (e-mail e senha do salao).
4. Opcional: `supabase/seed.sql` (troque o e-mail no topo) para popular exemplos.
5. Project Settings > API: copie a URL e a anon key para o seu `.env`.

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
  cliente/[id].tsx      Cadastro (id = "novo") e edicao
src/
  components/           componentes de UI reutilizaveis
  constants/theme.ts    cores, espacamentos, tipografia
  constants/techniques.ts  tecnicas e prazos de manutencao
  lib/supabase.ts       cliente Supabase, modo demo e traducao de erros
  services/clientes.ts  queries de cliente (select/insert/update/delete)
  store/auth.ts         sessao e login
  store/                estado global (Zustand)
  types/cliente.ts      tipos do dominio
  mocks/clientes.ts     clientes de exemplo (Etapa 3)
  utils/                datas, telefone, WhatsApp
supabase/
  schema.sql            tabela, view de status, RLS (Etapa 2)
  seed.sql              clientes de exemplo (opcional)
assets/                 icones, splash, fontes e logos da marca
```

## Rodando

```bash
npm install
cp .env.example .env    # preencha depois da Etapa 2
npm start               # QR code para o Expo Go
npm run android         # ou ios / web
npm run typecheck
```

## Etapas

- [x] **Etapa 1** — estrutura do projeto e dependencias
- [x] **Etapa 2** — modelagem do banco no Supabase (`supabase/schema.sql`)
- [x] **Etapa 3** — telas (Dashboard, lista com busca e filtros, cadastro) com dados mockados
- [x] **Etapa 4** — calculo de datas e integracao Supabase (login, CRUD e RLS)
- [ ] **Etapa 5** — disparo do WhatsApp via `Linking`

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
