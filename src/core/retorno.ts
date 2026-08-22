/**
 * Nucleo das regras de retorno: calculo de datas, status e a mensagem do
 * lembrete. Sem React Native, sem npm e sem nenhum import: este arquivo roda em
 * dois lugares muito diferentes — no aplicativo (Metro) e na Edge Function do
 * resumo diario (Deno) — e ficar autossuficiente evita qualquer surpresa de
 * resolucao de modulo entre os dois.
 */
export type ReturnStatus = 'no_prazo' | 'proximo' | 'atrasado';

export type TechniqueId = 'fita_adesiva' | 'ponto_americano' | 'queratina' | 'microesferas';

export type Technique = {
  id: TechniqueId;
  label: string;
  /** Dias entre a ultima aplicacao e o retorno ideal. */
  maintenanceDays: number;
};

/** Regra de negocio: intervalo ideal de manutencao por tecnica. */
export const TECHNIQUES: Technique[] = [
  { id: 'fita_adesiva', label: 'Fita Adesiva', maintenanceDays: 45 },
  { id: 'ponto_americano', label: 'Ponto Americano', maintenanceDays: 60 },
  { id: 'queratina', label: 'Queratina', maintenanceDays: 90 },
  { id: 'microesferas', label: 'Microesferas', maintenanceDays: 60 },
];

export const TECHNIQUE_BY_ID: Record<TechniqueId, Technique> = TECHNIQUES.reduce(
  (acc, technique) => ({ ...acc, [technique.id]: technique }),
  {} as Record<TechniqueId, Technique>
);

/** Faltando 10 dias ou menos para o retorno, a cliente entra em "Proximo". */
export const SOON_THRESHOLD_DAYS = 10;

/** Dados minimos para calcular prazo e montar a mensagem. */
export type ClienteLembrete = {
  nome: string;
  whatsapp: string;
  tecnica: TechniqueId;
  /** ISO date, YYYY-MM-DD. */
  data_retorno: string;
  status?: ReturnStatus;
};

const UM_DIA = 24 * 60 * 60 * 1000;

/**
 * 'YYYY-MM-DD' vira Date no fuso local.
 * new Date('2026-08-21') cairia em UTC e voltaria um dia no Brasil.
 */
export function parseDateOnly(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function toISODate(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Meia-noite de hoje, no fuso de quem esta rodando. */
export function hoje(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

/** Data ideal de retorno = ultima aplicacao + dias da tecnica. */
export function calcularDataRetorno(ultimaAplicacao: string | Date, tecnica: TechniqueId): Date {
  const base = typeof ultimaAplicacao === 'string' ? parseDateOnly(ultimaAplicacao) : ultimaAplicacao;
  const retorno = new Date(base);
  retorno.setDate(retorno.getDate() + TECHNIQUE_BY_ID[tecnica].maintenanceDays);
  return retorno;
}

/** Positivo = ainda falta; negativo = ja passou; 0 = e hoje. */
export function diasAteRetorno(dataRetorno: string | Date, referencia: Date = hoje()): number {
  const alvo = typeof dataRetorno === 'string' ? parseDateOnly(dataRetorno) : dataRetorno;
  const zerado = new Date(alvo.getFullYear(), alvo.getMonth(), alvo.getDate());
  const base = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  return Math.round((zerado.getTime() - base.getTime()) / UM_DIA);
}

export function statusDoRetorno(dias: number): ReturnStatus {
  if (dias < 0) return 'atrasado';
  if (dias <= SOON_THRESHOLD_DAYS) return 'proximo';
  return 'no_prazo';
}

export function formatarData(data: string | Date): string {
  const date = typeof data === 'string' ? parseDateOnly(data) : data;
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${date.getFullYear()}`;
}

/** Texto curto do prazo: "faltam 5 dias", "e hoje", "atrasada ha 12 dias". */
export function descreverPrazo(dias: number): string {
  if (dias === 0) return 'O retorno é hoje';
  if (dias === 1) return 'Falta 1 dia';
  if (dias > 1) return `Faltam ${dias} dias`;
  if (dias === -1) return 'Atrasada há 1 dia';
  return `Atrasada há ${Math.abs(dias)} dias`;
}

/** "Ana Beatriz Moraes" -> "Ana": a mensagem fica mais natural com o primeiro nome. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Formato aceito pelo banco e pelo link: DDI + DDD + numero, so digitos. */
export function paraFormatoBanco(valor: string, ddi = '55'): string {
  const d = apenasDigitos(valor);
  if (d.startsWith(ddi) && d.length > 11) return d;
  return `${ddi}${d}`;
}

/**
 * Mensagem pre-moldada do lembrete. Para quem ja passou da data o texto muda:
 * "esta chegando a hora" nao faz sentido para uma cliente atrasada.
 */
export function montarMensagem(cliente: ClienteLembrete): string {
  const tecnica = TECHNIQUE_BY_ID[cliente.tecnica].label;
  const nome = primeiroNome(cliente.nome);
  const data = formatarData(cliente.data_retorno);
  const status = cliente.status ?? statusDoRetorno(diasAteRetorno(cliente.data_retorno));

  if (status === 'atrasado') {
    return (
      `Olá, ${nome}! ✨ Passando para lembrar que passou da hora da manutenção ` +
      `do seu Mega Hair (${tecnica}). Seu retorno ideal era até o dia ${data}. ` +
      `Vamos remarcar? 🥰`
    );
  }

  return (
    `Olá, ${nome}! ✨ Passando para lembrar que está chegando a hora ` +
    `da manutenção do seu Mega Hair (${tecnica}). Seu retorno ideal é até o dia ` +
    `${data}. Vamos agendar? 🥰`
  );
}

/**
 * Link universal do WhatsApp. Preferimos wa.me ao esquema whatsapp://
 * porque o Android 11+ exige declarar o esquema no manifesto para abri-lo,
 * enquanto o wa.me e um app link ja verificado pelo proprio WhatsApp.
 */
export function montarLinkWhatsApp(whatsapp: string, mensagem: string): string {
  const numero = apenasDigitos(paraFormatoBanco(whatsapp));
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/** Link pronto do lembrete daquela cliente. */
export function linkDoLembrete(cliente: ClienteLembrete): string {
  return montarLinkWhatsApp(cliente.whatsapp, montarMensagem(cliente));
}
