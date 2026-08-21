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
supabase/               scripts SQL (Etapa 2)
assets/                 icones e splash
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
- [ ] **Etapa 2** — modelagem do banco no Supabase (script SQL)
- [ ] **Etapa 3** — telas com dados mockados
- [ ] **Etapa 4** — calculo de datas e integracao Supabase
- [ ] **Etapa 5** — disparo do WhatsApp via `Linking`
