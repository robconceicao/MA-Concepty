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

Paleta preta e branca da logo, com rosa seco e dourado como acento
(`src/constants/theme.ts`).

Os arquivos em `assets/` sao uma **recriacao vetorial** da identidade
(monograma MA e assinatura MARCO Concept Beauty), desenhada a partir da
Playfair Display (licenca OFL) por `scripts/build-brand-assets.py`:

| Arquivo | Uso |
| --- | --- |
| `assets/icon.png` | icone do app (monograma preto no branco) |
| `assets/android-icon-foreground.png` + `-background` + `-monochrome` | adaptive icon do Android |
| `assets/splash-icon.png` | splash (assinatura branca sobre `#0E0E0E`) |
| `assets/favicon.png` | web |
| `assets/brand/*.svg` | monograma e assinatura em vetor, preto e branco |

Para trocar pelos arquivos oficiais, basta substituir os PNGs mantendo os
nomes e as dimensoes (1024x1024 nos icones) — nada muda no `app.json`.

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
  lib/supabase.ts       cliente Supabase
  store/                estado global (Zustand)
  types/cliente.ts      tipos do dominio
  utils/                datas, telefone, WhatsApp
supabase/
  schema.sql            tabela, view de status, RLS (Etapa 2)
  seed.sql              clientes de exemplo (opcional)
assets/                 icones, splash e vetores da marca
scripts/                gerador dos assets da marca
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
- [ ] **Etapa 3** — telas com dados mockados
- [ ] **Etapa 4** — calculo de datas e integracao Supabase
- [ ] **Etapa 5** — disparo do WhatsApp via `Linking`
