/** Utilitarios de telefone. O banco guarda so digitos com DDI (5511987654321). */

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Mascara de digitacao: (11) 98765-4321.
 * Aceita fixo (8 digitos) e celular (9 digitos).
 */
export function aplicarMascaraTelefone(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  const ddd = `(${d.slice(0, 2)})`;
  const resto = d.slice(2);
  if (resto.length <= 4) return `${ddd} ${resto}`;
  const corte = resto.length > 8 ? 5 : 4;
  return `${ddd} ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** Formato aceito pelo banco: DDI + DDD + numero, so digitos. */
export function paraFormatoBanco(valor: string, ddi = '55'): string {
  const d = apenasDigitos(valor);
  if (d.startsWith(ddi) && d.length > 11) return d;
  return `${ddi}${d}`;
}

/** Do banco (5511987654321) de volta para a mascara de exibicao. */
export function doFormatoBanco(valor: string): string {
  const d = apenasDigitos(valor);
  return aplicarMascaraTelefone(d.startsWith('55') && d.length > 11 ? d.slice(2) : d);
}

/** DDD + 8 ou 9 digitos. */
export function telefoneValido(valor: string): boolean {
  const d = apenasDigitos(valor);
  return d.length === 10 || d.length === 11;
}
