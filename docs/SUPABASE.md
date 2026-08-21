# Configurando o Supabase — passo a passo

Tempo total: uns 10 minutos. Tudo isso cabe no plano gratuito.

---

## 1. Criar a conta e o projeto

1. Acesse [supabase.com](https://supabase.com) e entre com GitHub ou e-mail.
2. No painel, clique em **New project**.
3. Preencha:
   - **Name:** `marco-concept-beauty`
   - **Database Password:** gere uma senha forte e **guarde num lugar seguro**.
     Ela não é a senha do app — é a do banco, usada só em ferramentas externas.
     Se perder, dá para redefinir depois em Settings → Database.
   - **Region:** `South America (São Paulo)`. É a mais próxima, o app fica
     visivelmente mais rápido do que numa região dos EUA.
   - **Plan:** Free.
4. **Create new project** e espere de 1 a 2 minutos até sair de "Setting up".

---

## 2. Criar as tabelas

1. Menu lateral → **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` deste repositório, copie **tudo** e cole
   no editor.
3. **Run** (ou Ctrl/Cmd + Enter).
4. O esperado é `Success. No rows returned`. As mensagens que começam com
   `NOTICE: ... does not exist, skipping` são normais — o script é feito para
   poder rodar mais de uma vez sem quebrar.

Para conferir: menu lateral → **Table Editor**. A tabela `clientes` deve estar
lá, com as colunas `data_retorno`, `tecnica`, `ultima_aplicacao` e companhia.

---

## 3. Criar o seu usuário

O app pede login, e cada conta enxerga apenas as próprias clientes.

1. Menu lateral → **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. Informe o e-mail e uma senha de **no mínimo 6 caracteres**.
3. **Marque a opção de confirmar o e-mail automaticamente**
   (*Auto Confirm User* / *Confirm email*). Sem isso o login devolve
   "Confirme o e-mail antes de entrar".
4. **Create user**.

> Se preferir não lidar com confirmação de e-mail nunca mais:
> Authentication → **Sign In / Providers** → Email → desligue
> **Confirm email** → Save.

---

## 4. (Opcional) Clientes de exemplo

Só se quiser ver o app populado antes de cadastrar as clientes de verdade.

1. Abra `supabase/seed.sql` e troque `troque-pelo-seu@email.com` pelo e-mail
   que você acabou de cadastrar.
2. SQL Editor → New query → cole → **Run**.

São 6 clientes cobrindo os três status. Para apagá-las depois, é só selecionar
as linhas no Table Editor e excluir.

---

## 5. Pegar as chaves

1. Ícone de engrenagem (**Project Settings**) → **API**
   (em contas mais novas o caminho é Settings → **API Keys**).
2. Copie os dois valores:
   - **Project URL** — algo como `https://abcdefghijk.supabase.co`
   - a chave pública — aparece como **anon public** ou como
     **Publishable key** (`sb_publishable_...`). Qualquer uma das duas serve.

⚠️ **Não use a `service_role` / `secret key` no app.** Ela ignora todas as
regras de segurança. A chave pública é feita para ficar embutida no aplicativo;
quem protege os dados é o RLS que o `schema.sql` criou.

---

## 6. Ligar o app às chaves

Na raiz do projeto, crie um arquivo chamado `.env` (o `.gitignore` já impede
que ele vá para o GitHub):

```bash
cp .env.example .env
```

E preencha:

```
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=cole-a-chave-publica-aqui
```

Reinicie o Expo **limpando o cache** — as variáveis entram no bundle na hora do
build, então sem isso ele continua com os valores antigos:

```bash
npx expo start -c
```

---

## 7. Conferir se funcionou

1. Abra o app. Agora ele deve mostrar a **tela de login** (antes do `.env` ele
   abria direto, em modo demonstração).
2. Entre com o e-mail e a senha do passo 3.
3. Cadastre uma cliente de teste.
4. Volte ao Supabase → **Table Editor** → `clientes`. A linha deve estar lá com
   o `data_retorno` já preenchido — quem calcula essa data é o banco.

---

## Se algo der errado

| O que aparece | O que costuma ser |
| --- | --- |
| "E-mail ou senha incorretos" | Usuário não criado, ou criado sem confirmar o e-mail (passo 3). |
| "Sem conexão com o servidor" | URL do projeto errada, ou o celular sem internet. |
| Login entra mas a lista fica vazia | Normal numa conta nova. Se rodou o seed, confira se o e-mail no `seed.sql` é o mesmo com que você entrou — o RLS mostra só as clientes daquela conta. |
| Mudei o `.env` e nada mudou | Faltou reiniciar com `npx expo start -c`. |
| "WhatsApp inválido: informe DDD e número" | O banco só aceita dígitos com DDI. O app já converte, mas linhas inseridas na mão pelo painel precisam do formato `5511987654321`. |
