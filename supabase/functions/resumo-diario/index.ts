/**
 * Resumo diário por e-mail: lista as clientes que precisam de aviso hoje,
 * com o link do WhatsApp já pronto ao lado de cada uma.
 *
 * Disparado uma vez por dia pelo pg_cron — veja supabase/cron.sql e
 * docs/RESUMO-DIARIO.md.
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import {
  montarAssunto,
  montarHtml,
  montarPush,
  selecionarPendentes,
  type Cliente,
  type Pendente,
} from './resumo.ts';

const CAMPOS = 'id, user_id, nome, whatsapp, tecnica, data_retorno, ultimo_lembrete_em';

type Assinatura = { id: string; endpoint: string; p256dh: string; auth: string };

/** As chaves VAPID identificam este app para os servidores de push. */
function configurarPush(): boolean {
  const publica = Deno.env.get('VAPID_PUBLIC_KEY');
  const privada = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!publica || !privada) return false;

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:avisos@maconcepty.app',
    publica,
    privada
  );
  return true;
}

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

/**
 * Manda o aviso para cada aparelho autorizado. Endereço que o servidor de push
 * já não reconhece (404/410) é apagado: o aparelho desinstalou o app ou revogou
 * a permissão, e insistir nele só gera erro todo dia.
 */
async function enviarPush(
  supabase: SupabaseClient,
  userId: string,
  pendentes: Pendente[],
  appUrl: string
): Promise<{ enviados: number; removidos: number }> {
  const { data } = await supabase
    .from('push_assinaturas')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  const assinaturas = (data ?? []) as Assinatura[];
  if (assinaturas.length === 0) return { enviados: 0, removidos: 0 };

  const { titulo, corpo, total } = montarPush(pendentes);
  const conteudo = JSON.stringify({ titulo, corpo, total, url: appUrl, tag: 'retornos' });

  let enviados = 0;
  const expiradas: string[] = [];

  for (const assinatura of assinaturas) {
    try {
      await webpush.sendNotification(
        {
          endpoint: assinatura.endpoint,
          keys: { p256dh: assinatura.p256dh, auth: assinatura.auth },
        },
        conteudo
      );
      enviados += 1;
    } catch (erro) {
      const status = (erro as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) expiradas.push(assinatura.id);
    }
  }

  if (expiradas.length > 0) {
    await supabase.from('push_assinaturas').delete().in('id', expiradas);
  }
  if (enviados > 0) {
    await supabase
      .from('push_assinaturas')
      .update({ ultimo_envio_em: new Date().toISOString() })
      .eq('user_id', userId);
  }

  return { enviados, removidos: expiradas.length };
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
  const pushConfigurado = configurarPush();

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

    const resultado: Record<string, unknown> = { conta: conta.email, pendentes: pendentes.length };

    try {
      await enviarEmail(conta.email, montarAssunto(pendentes), montarHtml(pendentes, appUrl));
      resultado.enviado = true;
    } catch (erro) {
      resultado.erro_email = String(erro);
    }

    // O push é independente do e-mail: se um falhar, o outro ainda chega.
    if (pushConfigurado) {
      try {
        const push = await enviarPush(supabase, conta.id, pendentes, appUrl);
        resultado.push_enviados = push.enviados;
        if (push.removidos > 0) resultado.push_removidos = push.removidos;
      } catch (erro) {
        resultado.erro_push = String(erro);
      }
    }

    relatorio.push(resultado);
  }

  return new Response(JSON.stringify({ executado_em: new Date().toISOString(), relatorio }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
