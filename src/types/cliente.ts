import type { TechniqueId } from '@/constants/techniques';

export type ReturnStatus = 'on_time' | 'soon' | 'late';

/** Registro da cliente como armazenado no Supabase (snake_case). */
export type Cliente = {
  id: string;
  nome: string;
  whatsapp: string;
  tecnica: TechniqueId;
  ultima_aplicacao: string; // ISO date (YYYY-MM-DD)
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

/** Payload de criacao/edicao vindo do formulario. */
export type ClienteInput = {
  nome: string;
  whatsapp: string;
  tecnica: TechniqueId;
  ultima_aplicacao: string;
  observacoes?: string | null;
};

/** Cliente + campos calculados em runtime (Etapa 4). */
export type ClienteComRetorno = Cliente & {
  dataRetorno: Date;
  diasRestantes: number;
  status: ReturnStatus;
};
