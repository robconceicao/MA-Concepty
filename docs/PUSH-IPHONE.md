# Aviso na tela do iPhone (Web Push)

Desde o iOS 16.4 um site adicionado à tela de início pode receber notificação
push — sem App Store e sem a assinatura anual da Apple. É o mais perto que dá
para chegar do app nativo sem pagar por ele.

O aviso chega junto com o resumo diário, às 8h: *"4 clientes para avisar — 2
atrasadas · 2 próximas"*. Tocar nele abre o app direto na lista.

> **Diferença em relação ao app instalado no Android:** lá cada cliente tem sua
> própria notificação, às 9h do dia do retorno, agendada dentro do aparelho.
> Aqui é um aviso por dia, com o resumo, disparado pelo servidor. Mesma
> promessa, granularidade diferente.

---

## 1. Gerar as chaves VAPID

As chaves identificam o seu app para os servidores de push da Apple e do Google.
Gere no seu computador — **a chave privada não deve ser colada em lugar nenhum
além do Supabase**:

```powershell
npx web-push generate-vapid-keys
```

Saem duas linhas, `Public Key` e `Private Key`. Guarde as duas.

---

## 2. Criar a tabela das assinaturas

O `supabase/schema.sql` ganhou a tabela `push_assinaturas`, onde cada aparelho
autorizado guarda o próprio endereço de entrega.

SQL Editor → cole o `schema.sql` inteiro → Run. Ele é feito para rodar de novo
sem quebrar: acrescenta o que falta e não toca nas clientes já cadastradas.

---

## 3. Configurar o servidor

```powershell
supabase secrets set VAPID_PUBLIC_KEY="<a-chave-publica>"
supabase secrets set VAPID_PRIVATE_KEY="<a-chave-privada>"
supabase secrets set VAPID_SUBJECT="mailto:<seu-email>"
supabase functions deploy resumo-diario
```

Sem essas três variáveis a função continua funcionando — só manda o e-mail e
pula o push.

---

## 4. Configurar o app

No `.env` da raiz do projeto, acrescente **a chave pública** (a privada nunca):

```
EXPO_PUBLIC_VAPID_PUBLIC_KEY=<a-chave-publica>
```

E publique de novo:

```powershell
npx expo export --platform web
npx eas deploy --prod
```

---

## 5. Ligar no iPhone

1. Abra `https://ma-concepty.expo.app` no **Safari**.
2. Compartilhar → **Adicionar à Tela de Início**.
3. **Feche o Safari e abra o app pelo ícone da tela de início.** Este passo é
   obrigatório: no iPhone o push só existe nesse modo, e o app sabe disso — se
   você abrir pelo navegador, o botão aparece desativado com um aviso.
4. Na tela inicial, ligue **"Avisos no dia do retorno"**.
5. O iPhone pergunta se permite notificações: **Permitir**.

No Android e no computador funciona igual, direto no navegador, sem precisar
adicionar à tela de início.

---

## 6. Testar

```powershell
curl.exe -X POST "https://<seu-ref>.supabase.co/functions/v1/resumo-diario" -H "x-cron-secret: <seu-CRON_SECRET>"
```

A resposta agora traz também a contagem de push:

```json
{"relatorio":[{"conta":"...","pendentes":4,"enviado":true,"push_enviados":1}]}
```

`push_enviados: 1` e o aviso aparece na tela do iPhone em segundos.

---

## Se algo der errado

| O que acontece | O que costuma ser |
| --- | --- |
| O botão fica desativado no iPhone | Você abriu pelo Safari, não pelo ícone da tela de início |
| `push_enviados: 0` | Nenhum aparelho assinou ainda, ou a assinatura foi apagada |
| Nada aparece, mas `push_enviados: 1` | Confira Ajustes → Notificações → MARCO no iPhone |
| O botão não aparece nem no Android | Faltou a `EXPO_PUBLIC_VAPID_PUBLIC_KEY` no build |
| Parou de chegar do nada | Se você removeu o app da tela de início, a assinatura morre. Adicione de novo e ligue outra vez |

Assinatura que o servidor de push recusa com 404 ou 410 é apagada
automaticamente na próxima execução — aparelho trocado ou permissão revogada
não deixa lixo acumulado.

---

## O que dá para esperar

O push do iOS via web é confiável, mas não é idêntico ao nativo: o sistema pode
atrasar a entrega para poupar bateria, e um aparelho desligado recebe quando
voltar. Para "avise que hoje tem retorno", isso é mais que suficiente.

O e-mail continua chegando em paralelo — se um dia o push falhar, a lista está
lá do mesmo jeito.
