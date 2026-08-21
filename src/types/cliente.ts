import type { TechniqueId } from '@/constants/techniques';

/** Mesmos valores que a view clientes_com_status devolve. */
export type ReturnStatus = 'no_prazo' | 'proximo' | 'atrasado';

/** Linha da tabela public.clientes (snake_case, como vem do Supabase). */
export type Cliente = {
  id: string;
  user_id: string;
  nome: string;
  /** Apenas digitos, com DDI. Ex: 5511987654321. */
  whatsapp: string;
  tecnica: TechniqueId;
  ultima_aplicacao: string; // date (YYYY-MM-DD)
  observacoes: string | null;
  ativo: boolean;
  /** Momento do ultimo lembrete disparado no WhatsApp. */
  ultimo_lembrete_em: string | null;
  /** Coluna gerada pelo banco: ultima_aplicacao + dias da tecnica. */
  data_retorno: string; // date (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
};

/** Linha da view public.clientes_com_status. */
export type ClienteComStatus = Cliente & {
  dias_restantes: number;
  status: ReturnStatus;
  avisada_hoje: boolean;
};

/** Payload de criacao/edicao vindo do formulario. */
export type ClienteInput = {
  nome: string;
  whatsapp: string;
  tecnica: TechniqueId;
  ultima_aplicacao: string;
  observacoes?: string | null;
};
