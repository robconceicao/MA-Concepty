# Resumo diário por e-mail

Todo dia de manhã chega um e-mail com as clientes que precisam de aviso — as
atrasadas e as que entram na janela de 10 dias — e, ao lado de cada nome, um
botão que abre o WhatsApp com a mensagem já escrita.

Quem já recebeu o lembrete naquele dia não aparece na lista, igual à tela
"Avisar hoje" do aplicativo. E se não houver ninguém para avisar, o e-mail não
é enviado: um resumo vazio todo dia vira ruído e a pessoa para de abrir.

**Por que isso existe:** as notificações no aparelho só funcionam no app
instalado (Android). Quem usa a versão web no iPhone recebe o resumo por
e-mail no lugar.

---

## 1. Criar a conta na Resend

1. Acesse [resend.com](https://resend.com) e crie uma conta gratuita.
2. Em **API Keys**, clique em **Create API Key**, dê o nome `ma-concepty` e
   copie o valor (ele só aparece uma vez).

O plano gratuito cobre folgadamente um e-mail por dia.

> **Sem domínio próprio**, a Resend envia a partir de `onboarding@resend.dev` e
> **só entrega para o e-mail dono da conta** — que é exatamente o nosso caso.
> Se um dia quiser enviar para outros endereços, aí é preciso verificar um
> domínio em Domains e ajustar a variável `EMAIL_REMETENTE`.

---

## 2. Instalar a CLI do Supabase e publicar a função

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU-REF        # o ref está na URL do painel
supabase functions deploy resumo-diario --no-verify-jwt
```

O `--no-verify-jwt` é necessário porque quem chama a função é o agendador do
banco, não um usuário logado. No lugar do JWT, a função exige um segredo
próprio — o `CRON_SECRET` do passo seguinte.

---

## 3. Configurar os segredos da função

Invente uma senha longa para o `CRON_SECRET` (qualquer texto aleatório serve):

```bash
supabase secrets set \
  RESEND_API_KEY="re_sua_chave_da_resend" \
  CRON_SECRET="um-texto-aleatorio-bem-longo" \
  APP_URL="https://ma-concepty.expo.app"
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente dentro
das Edge Functions — não precisa configurá-las.

Opcional, só depois de verificar um domínio na Resend:

```bash
supabase secrets set EMAIL_REMETENTE="MARCO <avisos@seudominio.com.br>"
```

---

## 4. Testar antes de agendar

```bash
curl -X POST https://SEU-REF.supabase.co/functions/v1/resumo-diario \
  -H "x-cron-secret: o-mesmo-texto-do-CRON_SECRET"
```

A resposta é um JSON dizendo, para cada conta, quantas pendências havia e se o
e-mail saiu:

```json
{"executado_em":"...","relatorio":[{"conta":"voce@email.com","pendentes":3,"enviado":true}]}
```

- `"pendentes":0,"enviado":false` → está funcionando; é que não há ninguém para
  avisar hoje. Cadastre uma cliente com data de aplicação antiga e teste de novo.
- `401` → o `x-cron-secret` não bate com o `CRON_SECRET` da função.
- Erro citando a Resend → chave errada, ou você tentou enviar para um e-mail
  diferente do dono da conta sem ter verificado um domínio.

---

## 5. Agendar

1. Abra `supabase/cron.sql`, troque as duas linhas marcadas com **TROQUE**
   (a URL do seu projeto e o mesmo `CRON_SECRET`).
2. Cole no **SQL Editor** do Supabase e rode.

Pronto: todo dia às 8h da manhã (horário de Brasília) o resumo chega.

Para conferir depois:

```sql
select jobname, schedule, active from cron.job;
select * from cron.job_run_details order by start_time desc limit 10;
```

Para mudar o horário, rode o `cron.sql` de novo com outro valor — lembrando que
o cron do banco trabalha em UTC: `0 11 * * *` é 8h da manhã aqui.

---

## O que fica de fora

Isto **não** manda mensagem automática para as clientes. O e-mail é para você;
cada lembrete continua saindo pelo seu toque no botão do WhatsApp. É de
propósito: disparo automático em massa pelo WhatsApp exige a API oficial da
Meta (número dedicado, conta business verificada, modelo de mensagem aprovado)
e, pelos caminhos não oficiais, arrisca o banimento do número do salão.
