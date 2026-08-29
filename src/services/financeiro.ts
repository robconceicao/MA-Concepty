import { supabase, traduzirErro } from '@/lib/supabase';
import type {
  Adiantamento,
  AdiantamentoInput,
  Atendimento,
  AtendimentoInput,
  Procedimento,
} from '@/types/financeiro';

const CAMPOS_ATENDIMENTO =
  'id, user_id, procedimento_id, cliente_id, nome_cliente, data, valor_cliente, ' +
  'percentual_profissional, valor_profissional, observacoes, created_at, updated_at, ' +
  'procedimentos(nome)';

export async function listarProcedimentos(): Promise<Procedimento[]> {
  const { data, error } = await supabase
    .from('procedimentos')
    .select('*')
    .eq('ativo', true)
    .order('nome');

  if (error) throw new Error(traduzirErro(error));
  return (data ?? []) as Procedimento[];
}

export async function listarAtendimentos(de: string, ate: string): Promise<Atendimento[]> {
  const { data, error } = await supabase
    .from('atendimentos')
    .select(CAMPOS_ATENDIMENTO)
    .gte('data', de)
    .lte('data', ate)
    .order('data', { ascending: false });

  if (error) throw new Error(traduzirErro(error));
  return (data ?? []) as unknown as Atendimento[];
}

export async function listarAdiantamentos(de: string, ate: string): Promise<Adiantamento[]> {
  const { data, error } = await supabase
    .from('adiantamentos')
    .select('*')
    .gte('data', de)
    .lte('data', ate)
    .order('data', { ascending: false });

  if (error) throw new Error(traduzirErro(error));
  return (data ?? []) as Adiantamento[];
}

/**
 * O valor e o percentual sao copiados do catalogo aqui, na hora do lancamento.
 * Alterar o preco depois nao mexe no que ja foi lancado.
 */
export async function criarAtendimento(
  input: AtendimentoInput,
  procedimento: Procedimento
): Promise<Atendimento> {
  const { data, error } = await supabase
    .from('atendimentos')
    .insert({
      procedimento_id: procedimento.id,
      cliente_id: input.cliente_id ?? null,
      nome_cliente: input.nome_cliente?.trim() ? input.nome_cliente.trim() : null,
      data: input.data,
      valor_cliente: procedimento.valor_cliente,
      percentual_profissional: procedimento.percentual_profissional,
      observacoes: input.observacoes?.trim() ? input.observacoes.trim() : null,
    })
    .select(CAMPOS_ATENDIMENTO)
    .single();

  if (error) throw new Error(traduzirErro(error));
  return data as unknown as Atendimento;
}

export async function removerAtendimento(id: string): Promise<void> {
  const { error } = await supabase.from('atendimentos').delete().eq('id', id);
  if (error) throw new Error(traduzirErro(error));
}

export async function criarAdiantamento(input: AdiantamentoInput): Promise<Adiantamento> {
  const { data, error } = await supabase
    .from('adiantamentos')
    .insert({
      data: input.data,
      valor: input.valor,
      descricao: input.descricao?.trim() ? input.descricao.trim() : null,
    })
    .select('*')
    .single();

  if (error) throw new Error(traduzirErro(error));
  return data as Adiantamento;
}

export async function removerAdiantamento(id: string): Promise<void> {
  const { error } = await supabase.from('adiantamentos').delete().eq('id', id);
  if (error) throw new Error(traduzirErro(error));
}
