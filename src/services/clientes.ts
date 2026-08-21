import { supabase, traduzirErro } from '@/lib/supabase';
import type { Cliente, ClienteInput } from '@/types/cliente';

const TABELA = 'clientes';

/**
 * Campos que o banco preenche sozinho e que nunca vao no payload:
 * id, user_id (default auth.uid()), data_retorno (coluna gerada),
 * created_at e updated_at (default + trigger).
 */
function paraLinha(input: ClienteInput) {
  return {
    nome: input.nome.trim(),
    whatsapp: input.whatsapp,
    tecnica: input.tecnica,
    ultima_aplicacao: input.ultima_aplicacao,
    observacoes: input.observacoes?.trim() ? input.observacoes.trim() : null,
  };
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from(TABELA)
    .select('*')
    .eq('ativo', true)
    .order('data_retorno', { ascending: true });

  if (error) throw new Error(traduzirErro(error));
  return (data ?? []) as Cliente[];
}

export async function criarCliente(input: ClienteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from(TABELA)
    .insert(paraLinha(input))
    .select('*')
    .single();

  if (error) throw new Error(traduzirErro(error));
  return data as Cliente;
}

export async function atualizarCliente(id: string, input: ClienteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from(TABELA)
    .update(paraLinha(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(traduzirErro(error));
  return data as Cliente;
}

export async function removerCliente(id: string): Promise<void> {
  const { error } = await supabase.from(TABELA).delete().eq('id', id);
  if (error) throw new Error(traduzirErro(error));
}

/** Marca que o lembrete acabou de ser disparado no WhatsApp. */
export async function registrarLembrete(id: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from(TABELA)
    .update({ ultimo_lembrete_em: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(traduzirErro(error));
  return data as Cliente;
}
