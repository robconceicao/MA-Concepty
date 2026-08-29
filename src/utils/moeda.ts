/** Entrada de dinheiro: a pessoa digita só números e a máscara cuida do resto. */

/** "12345" -> "123,45"; a vírgula anda sozinha conforme digita. */
export function aplicarMascaraMoeda(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 9);
  if (!digitos) return '';

  const centavos = digitos.padStart(3, '0');
  const inteiro = centavos.slice(0, -2).replace(/^0+(?=\d)/, '');
  const decimais = centavos.slice(-2);
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${comMilhar},${decimais}`;
}

/** "1.234,56" -> 1234.56 */
export function moedaParaNumero(valor: string): number {
  const digitos = valor.replace(/\D/g, '');
  return digitos ? Number(digitos) / 100 : 0;
}
