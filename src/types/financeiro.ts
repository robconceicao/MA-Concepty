/** Catalogo: quanto o procedimento custa e quanto fica com o profissional. */
export type Procedimento = {
  id: string;
  user_id: string;
  nome: string;
  valor_cliente: number;
  percentual_profissional: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

/** Procedimento realizado. Guarda a copia do valor e do percentual da data. */
export type Atendimento = {
  id: string;
  user_id: string;
  procedimento_id: string;
  cliente_id: string | null;
  nome_cliente: string | null;
  data: string; // YYYY-MM-DD
  valor_cliente: number;
  percentual_profissional: number;
  valor_profissional: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  /** Vem do join com o catalogo. */
  procedimentos?: { nome: string } | null;
};

/** Dinheiro adiantado, descontado no fechamento do mes. */
export type Adiantamento = {
  id: string;
  user_id: string;
  data: string;
  valor: number;
  descricao: string | null;
  created_at: string;
  updated_at: string;
};

export type AtendimentoInput = {
  procedimento_id: string;
  cliente_id?: string | null;
  nome_cliente?: string | null;
  data: string;
  observacoes?: string | null;
};

export type AdiantamentoInput = {
  data: string;
  valor: number;
  descricao?: string | null;
};
