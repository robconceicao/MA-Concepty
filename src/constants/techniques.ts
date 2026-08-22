/**
 * As tecnicas e os prazos moram em src/core/retorno.ts, que e compartilhado com
 * a Edge Function do resumo diario. Aqui fica so o reexport para as telas.
 */
export {
  SOON_THRESHOLD_DAYS,
  TECHNIQUES,
  TECHNIQUE_BY_ID,
  type Technique,
  type TechniqueId,
} from '@/core/retorno';
