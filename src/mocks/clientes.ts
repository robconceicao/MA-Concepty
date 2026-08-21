import type { TechniqueId } from '@/constants/techniques';
import type { Cliente } from '@/types/cliente';
import { calcularDataRetorno, toISODate } from '@/utils/dates';

type MockSpec = {
  nome: string;
  whatsapp: string;
  tecnica: TechniqueId;
  /** Ha quantos dias foi a ultima aplicacao. */
  diasAtras: number;
  observacoes?: string;
};

const SPECS: MockSpec[] = [
  { nome: 'Patrícia Nunes', whatsapp: '5541991112233', tecnica: 'fita_adesiva', diasAtras: 60, observacoes: 'Pele sensível à fita, usar hipoalergênica.' },
  { nome: 'Marina Lopes', whatsapp: '5531976543210', tecnica: 'microesferas', diasAtras: 72, observacoes: 'Avisar sempre pela manhã.' },
  { nome: 'Carolina Prado', whatsapp: '5511912345678', tecnica: 'ponto_americano', diasAtras: 55, observacoes: 'Cabelo 60cm, cor 8.1.' },
  { nome: 'Juliana Ferraz', whatsapp: '5521998877665', tecnica: 'queratina', diasAtras: 85 },
  { nome: 'Bianca Rezende', whatsapp: '5511955443322', tecnica: 'fita_adesiva', diasAtras: 45 },
  { nome: 'Ana Beatriz Moraes', whatsapp: '5511987654321', tecnica: 'fita_adesiva', diasAtras: 5, observacoes: 'Prefere horário à tarde.' },
  { nome: 'Renata Aguiar', whatsapp: '5551988776655', tecnica: 'queratina', diasAtras: 10 },
  { nome: 'Larissa Camargo', whatsapp: '5511964738291', tecnica: 'microesferas', diasAtras: 20, observacoes: 'Indicada pela Ana Beatriz.' },
];

function diasAtrasParaISO(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return toISODate(data);
}

/**
 * Clientes de exemplo para validar o visual (Etapa 3).
 * As datas sao relativas a hoje, entao os tres status sempre aparecem.
 * Na Etapa 4 isso da lugar aos dados do Supabase.
 */
export const CLIENTES_MOCK: Cliente[] = SPECS.map((spec, index) => {
  const ultimaAplicacao = diasAtrasParaISO(spec.diasAtras);
  const agora = new Date().toISOString();
  return {
    id: `mock-${index + 1}`,
    user_id: 'mock-user',
    nome: spec.nome,
    whatsapp: spec.whatsapp,
    tecnica: spec.tecnica,
    ultima_aplicacao: ultimaAplicacao,
    observacoes: spec.observacoes ?? null,
    ativo: true,
    data_retorno: toISODate(calcularDataRetorno(ultimaAplicacao, spec.tecnica)),
    created_at: agora,
    updated_at: agora,
  };
});
