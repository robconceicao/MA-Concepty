/**
 * Parte pura do resumo diário: escolher quem entra na lista e montar o e-mail.
 * Fica separada do index.ts para poder ser testada sem subir servidor nem
 * falar com o Supabase.
 */
import {
  TECHNIQUE_BY_ID,
  descreverPrazo,
  diasAteRetorno,
  formatarData,
  linkDoLembrete,
  parseDateOnly,
  statusDoRetorno,
  type ReturnStatus,
  type TechniqueId,
} from '../../../src/core/retorno.ts';

export const FUSO = 'America/Sao_Paulo';

export type Cliente = {
  id: string;
  user_id: string;
  nome: string;
  whatsapp: string;
  tecnica: TechniqueId;
  data_retorno: string;
  ultimo_lembrete_em: string | null;
};

export type Pendente = Cliente & { dias: number; status: ReturnStatus };

const CORES = {
  atrasado: '#C05B5B',
  proximo: '#C9A24B',
  fundo: '#FAF7F5',
  texto: '#1C1614',
  suave: '#8C7A72',
  borda: '#EAE0DB',
};

/** A data de hoje no salão (YYYY-MM-DD), não a do servidor, que roda em UTC. */
export function hojeISONoSalao(agora: Date = new Date()): string {
  return agora.toLocaleDateString('en-CA', { timeZone: FUSO });
}

export function hojeNoSalao(agora: Date = new Date()): Date {
  return parseDateOnly(hojeISONoSalao(agora));
}

/** Em que dia do salão caiu um timestamp. */
export function diaNoSalao(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: FUSO });
}

export function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Quem precisa de aviso hoje: atrasadas e próximas que ainda não receberam o
 * lembrete no dia — a mesma regra da lista "Avisar hoje" do aplicativo.
 */
export function selecionarPendentes(
  clientes: Cliente[],
  agora: Date = new Date()
): Pendente[] {
  const referencia = hojeNoSalao(agora);
  const hoje = hojeISONoSalao(agora);

  return clientes
    .map((cliente) => {
      const dias = diasAteRetorno(cliente.data_retorno, referencia);
      return { ...cliente, dias, status: statusDoRetorno(dias) };
    })
    .filter((c) => c.status !== 'no_prazo')
    .filter((c) => !c.ultimo_lembrete_em || diaNoSalao(c.ultimo_lembrete_em) !== hoje)
    .sort((a, b) => a.dias - b.dias);
}

export function montarAssunto(pendentes: Pendente[]): string {
  const atrasadas = pendentes.filter((c) => c.status === 'atrasado').length;
  return atrasadas > 0
    ? `${pendentes.length} manutenções para avisar (${atrasadas} atrasada${atrasadas === 1 ? '' : 's'})`
    : `${pendentes.length} manutenções para avisar hoje`;
}

export function montarHtml(pendentes: Pendente[], appUrl: string): string {
  const atrasadas = pendentes.filter((c) => c.status === 'atrasado');
  const proximas = pendentes.filter((c) => c.status === 'proximo');

  const linha = (cliente: Pendente) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid ${CORES.borda};">
        <div style="font-size:16px;font-weight:600;color:${CORES.texto};">${escapar(cliente.nome)}</div>
        <div style="font-size:13px;color:${CORES.suave};margin-top:2px;">
          ${escapar(TECHNIQUE_BY_ID[cliente.tecnica].label)} · retorno em ${formatarData(cliente.data_retorno)}
        </div>
        <div style="font-size:13px;font-weight:700;color:${CORES[cliente.status as 'atrasado' | 'proximo']};margin-top:4px;">
          ${descreverPrazo(cliente.dias)}
        </div>
        <a href="${escapar(linkDoLembrete(cliente))}"
           style="display:inline-block;margin-top:10px;background:#0E0E0E;color:#FFFFFF;
                  text-decoration:none;font-size:13px;font-weight:600;
                  padding:9px 16px;border-radius:999px;">
          Enviar lembrete no WhatsApp
        </a>
      </td>
    </tr>`;

  const secao = (titulo: string, lista: Pendente[]) =>
    lista.length === 0
      ? ''
      : `<h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;
                   color:${CORES.suave};margin:28px 0 0;">${titulo} (${lista.length})</h2>
         <table width="100%" cellpadding="0" cellspacing="0">${lista.map(linha).join('')}</table>`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:${CORES.fundo};
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="font-size:26px;letter-spacing:3px;color:${CORES.texto};font-family:Georgia,serif;">MARCO</div>
    <div style="font-size:11px;letter-spacing:4px;color:${CORES.suave};margin-top:2px;">CONCEPT BEAUTY</div>

    <h1 style="font-size:24px;color:${CORES.texto};margin:24px 0 4px;font-family:Georgia,serif;font-weight:normal;">
      Manutenções de hoje
    </h1>
    <p style="font-size:14px;color:${CORES.suave};margin:0;">
      ${atrasadas.length} atrasada${atrasadas.length === 1 ? '' : 's'} ·
      ${proximas.length} próxima${proximas.length === 1 ? '' : 's'}
    </p>

    ${secao('Atrasadas', atrasadas)}
    ${secao('Próximas', proximas)}

    <p style="font-size:12px;color:${CORES.suave};margin-top:32px;line-height:1.5;">
      Enviado pelo <a href="${escapar(appUrl)}" style="color:${CORES.suave};">MARCO Concept Beauty</a>.
      Clientes já avisadas hoje não entram nesta lista.
    </p>
  </div>
</body></html>`;
}

/** Texto curto do aviso que aparece na tela do celular. */
export function montarPush(pendentes: Pendente[]): { titulo: string; corpo: string } {
  const atrasadas = pendentes.filter((c) => c.status === 'atrasado').length;
  const proximas = pendentes.length - atrasadas;

  const partes: string[] = [];
  if (atrasadas > 0) partes.push(`${atrasadas} atrasada${atrasadas === 1 ? '' : 's'}`);
  if (proximas > 0) partes.push(`${proximas} próxima${proximas === 1 ? '' : 's'}`);

  const primeira = pendentes[0];
  return {
    titulo:
      pendentes.length === 1
        ? `${primeira.nome} precisa de aviso`
        : `${pendentes.length} clientes para avisar`,
    corpo: `${partes.join(' · ')} · toque para abrir e enviar os lembretes`,
  };
}
