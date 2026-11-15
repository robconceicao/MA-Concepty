# CLAUDE.md — MA Concepty

App de gestão de clientes de Mega Hair para a MARCO Concept Beauty: cadastro, prazo de manutenção por técnica, aviso por WhatsApp e fechamento mensal de ganhos. Expo 57 + React Native 0.86 + TypeScript, rotas com expo-router, estado com Zustand, Supabase próprio (Postgres + Auth). Roda em Android, iOS e web. Node 22 LTS.

O licenciamento comercial é feito pelo portal Tadeu Apps (`src/lib/tadeuLicense.ts`).

## Como trabalhar aqui

- Spec antes de código: mudança de comportamento começa em `specs/`, com critérios de aceitação. Só depois o código.
- Mostre o diff e espere o Roberto aprovar antes de qualquer commit. Não faça push, build EAS nem deploy por conta própria.
- Segredos nunca passam pela conversa. Variável nova entra em `.env.example` sem valor.
- No app só entram chaves públicas (`EXPO_PUBLIC_*`, anon/publishable). Service role nunca vai para o app.
- O ambiente dele é Windows com PowerShell.

## Comandos

```powershell
npm install
npm start                       # Expo
npm run web
npm run typecheck
npm test                        # node --test "scripts/*.test.cjs": licença, config e regressões
npm run build:android           # EAS, perfil preview — só com autorização
npm run deploy:web              # exporta e publica — só com autorização
```

O CI (`.github/workflows/quality.yml`) roda `npm run typecheck` e `npm test`. Os testes ficam em `scripts/*.test.cjs` e precisam das dependências instaladas.

## Mapa

```
app/                    rotas (expo-router)
  (tabs)/               Hoje (index), Clientes, Ganhos
  cliente/[id].tsx      cadastro (id = "novo") e edição
  atendimento/novo.tsx, adiantamento/novo.tsx
  login.tsx, licenca.tsx
src/
  core/                 regras puras, sem imports: retorno.ts, financeiro.ts, demoPolicy.ts
  services/             acesso ao Supabase e notificações
  store/                Zustand: auth, clientes, financeiro, license, notificacoes
  lib/                  supabase.ts, tadeuLicense.ts, licenseBuild.ts
  constants/            theme.ts (tokens), techniques.ts (técnicas e prazos)
  utils/                datas, moeda, telefone, WhatsApp
supabase/
  schema.sql            tabelas, view clientes_com_status, RLS
  functions/resumo-diario/  Edge Function do e-mail diário
  cron.sql, seed.sql
scripts/                configuração de build de licença e testes
docs/                   BUILD, SUPABASE, GANHOS, HOMOLOGATION, PUSH-IPHONE, RESUMO-DIARIO
```

## Regras que não se quebram

Regras de negócio
- Prazo de retorno por técnica: Fita Adesiva 45 dias, Ponto Americano 60, Queratina 90, Microesferas 60. O banco calcula `data_retorno`; o app não mantém uma segunda fonte.
- Status: No Prazo (mais de 10 dias), Próximo (10 dias ou menos), Atrasado (data passou). O corte de 10 dias vive em um lugar só.
- `src/core/retorno.ts` e `src/core/financeiro.ts` são compartilhados com a Edge Function: sem React Native e sem imports. Mantenha puros.
- Cálculo de prazo recebe o relógio por parâmetro, para ser testável, e é refeito quando o dia muda e quando o app volta ao primeiro plano.

Lembretes
- Abrir o WhatsApp registra só a tentativa. Marcar o aviso como enviado exige confirmação manual explícita. Cancelamento ou falha de gravação não marca a cliente.
- O app não envia mensagem externa automática.

Demonstração e licença
- Modo demonstração só existe com as três condições juntas: Supabase não configurado, `appEnvironment=homologation` e `EXPO_PUBLIC_DEMO_MODE=true`. Em produção, sem chaves, a tela bloqueia; não vira demo.
- O bypass de licença é embutido no build por `app.config.js` e exige `APP_ENV=homologation`. Não pode depender de flag de conta, resposta de rede ou valor salvo no aparelho.

Supabase
- Toda tabela tem RLS por conta. Tabela nova nasce com RLS e políticas.
- Não aplique SQL em projeto Supabase remoto. Entregue o script; quem aplica é o Roberto.
- Dados de clientes são dados pessoais (nome, telefone). Não coloque dado real em mock, teste, log ou commit.

Interface
- Estilo com `StyleSheet` e tokens de `src/constants/theme.ts`. O projeto não usa NativeWind. Não escreva cor ou espaçamento solto na tela.
- Textos da interface em português.

## Antes de dizer que terminou

1. `npm run typecheck` passou?
2. `npm test` passou? Cole o total de testes e de falhas.
3. Mexeu em prazo, status, lembrete ou fechamento? Há teste cobrindo, incluindo a virada do dia.
4. A mudança funciona nas três plataformas, ou está dito qual não foi verificada?
5. Alguma chave ou dado real de cliente ficou no código ou em log? Remova.
6. Diga o que foi testado de verdade e o que não foi.

## Entrega

Código funcionando, depois até três linhas: o que mudou, como testar localmente, o que ficou pendente.
