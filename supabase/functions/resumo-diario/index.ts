/**
 * Resumo diário por e-mail: lista as clientes que precisam de aviso hoje,
 * com o link do WhatsApp já pronto ao lado de cada uma.
 *
 * Disparado uma vez por dia pelo pg_cron — veja supabase/cron.sql e
 * docs/RESUMO-DIARIO.md.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  montarAssunto,
  montarHtml,
  selecionarPendentes,
  type Cliente,
} from './resumo.ts';

const CAMPOS = 'id, user_id, nome, whatsapp, tecnica, data_retorno, ultimo_lembrete_em';

async function enviarEmail(para: string, assunto: string, html: string) {
  const chave = Deno.env.get('RESEND_API_KEY');
  // Sem domínio próprio, a Resend só entrega a partir deste remetente e
  // apenas para o e-mail dono da conta — que é justamente o caso aqui.
  const remetente = Deno.env.get('EMAIL_REMETENTE') ?? 'MARCO <onboarding@resend.dev>';
  if (!chave) throw new Error('RESEND_API_KEY não configurada');

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: remetente, to: [para], subject: assunto, html }),
  });

  if (!resposta.ok) {
    throw new Error(`Resend respondeu ${resposta.status}: ${await resposta.text()}`);
  }
  return await resposta.json();
}

Deno.serve(async (req) => {
  // Só o cron (ou você, com o segredo em mãos) pode disparar isto.
  const segredo = Deno.env.get('CRON_SECRET');
  if (!segredo || req.headers.get('x-cron-secret') !== segredo) {
    return new Response(JSON.stringify({ erro: 'não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const appUrl = Deno.env.get('APP_URL') ?? 'https://ma-concepty.expo.app';

  const { data: contas, error: erroContas } = await supabase.auth.admin.listUsers();
  if (erroContas) {
    return new Response(JSON.stringify({ erro: erroContas.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const relatorio: Record<string, unknown>[] = [];

  for (const conta of contas.users) {
    if (!conta.email) continue;

    const { data, error } = await supabase
      .from('clientes')
      .select(CAMPOS)
      .eq('user_id', conta.id)
      .eq('ativo', true)
      .order('data_retorno', { ascending: true });

    if (error) {
      relatorio.push({ conta: conta.email, erro: error.message });
      continue;
    }

    const pendentes = selecionarPendentes(data as Cliente[]);

    // Nada para avisar: não manda e-mail. Um resumo vazio todo dia vira ruído
    // e a pessoa para de abrir.
    if (pendentes.length === 0) {
      relatorio.push({ conta: conta.email, pendentes: 0, enviado: false });
      continue;
    }

    try {
      await enviarEmail(conta.email, montarAssunto(pendentes), montarHtml(pendentes, appUrl));
      relatorio.push({ conta: conta.email, pendentes: pendentes.length, enviado: true });
    } catch (erro) {
      relatorio.push({ conta: conta.email, erro: String(erro) });
    }
  }

  return new Response(JSON.stringify({ executado_em: new Date().toISOString(), relatorio }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
