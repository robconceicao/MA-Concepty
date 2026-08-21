import { differenceInCalendarDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SOON_THRESHOLD_DAYS, TECHNIQUE_BY_ID, type TechniqueId } from '@/constants/techniques';
import type { ReturnStatus } from '@/types/cliente';

/**
 * Converte 'YYYY-MM-DD' em Date no fuso local.
 * new Date('2026-08-21') cairia em UTC e voltaria um dia no Brasil.
 */
export function parseDateOnly(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function hoje(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
  return differenceInCalendarDays(alvo, referencia);
}

export function statusDoRetorno(dias: number): ReturnStatus {
  if (dias < 0) return 'atrasado';
  if (dias <= SOON_THRESHOLD_DAYS) return 'proximo';
  return 'no_prazo';
}

export function formatarData(data: string | Date): string {
  const date = typeof data === 'string' ? parseDateOnly(data) : data;
  return format(date, 'dd/MM/yyyy');
}

export function formatarDataExtensa(data: string | Date): string {
  const date = typeof data === 'string' ? parseDateOnly(data) : data;
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

/** Texto curto do prazo: "faltam 5 dias", "e hoje", "atrasada ha 12 dias". */
export function descreverPrazo(dias: number): string {
  if (dias === 0) return 'O retorno é hoje';
  if (dias === 1) return 'Falta 1 dia';
  if (dias > 1) return `Faltam ${dias} dias`;
  if (dias === -1) return 'Atrasada há 1 dia';
  return `Atrasada há ${Math.abs(dias)} dias`;
}
