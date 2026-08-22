import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateOnly } from '@/core/retorno';

/**
 * O calculo de datas e status vive em src/core/retorno.ts, que roda tanto aqui
 * quanto na Edge Function do resumo diario. Este arquivo so reexporta o que as
 * telas usam e acrescenta o que depende do date-fns.
 */
export {
  calcularDataRetorno,
  descreverPrazo,
  diasAteRetorno,
  formatarData,
  hoje,
  parseDateOnly,
  statusDoRetorno,
  toISODate,
} from '@/core/retorno';

/** "22 de agosto" — so o cabecalho do inicio usa, e depende do locale. */
export function formatarDataExtensa(data: string | Date): string {
  const date = typeof data === 'string' ? parseDateOnly(data) : data;
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

/** O timestamp caiu no dia de hoje, no fuso do aparelho? */
export function foiHoje(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return false;
  const agora = new Date();
  return (
    data.getFullYear() === agora.getFullYear() &&
    data.getMonth() === agora.getMonth() &&
    data.getDate() === agora.getDate()
  );
}
