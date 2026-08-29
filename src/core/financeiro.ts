/**
 * Fechamento mensal dos ganhos: quanto entrou, quanto e do profissional, quanto
 * ja foi adiantado e em que dia o saldo cai na conta.
 *
 * Sem imports, como o retorno.ts, para poder rodar tanto no app quanto numa
 * Edge Function.
 */

export type Atendimento = {
  data: string; // YYYY-MM-DD
  valor_cliente: number;
  valor_profissional: number;
};

export type Adiantamento = {
  data: string; // YYYY-MM-DD
  valor: number;
};

export type Fechamento = {
  /** Quanto as clientes pagaram no total. */
  bruto: number;
  /** A parte do profissional. */
  ganho: number;
  /** Quanto ja foi adiantado no mes. */
  adiantado: number;
  /** O que ainda ha de receber: ganho - adiantado. Pode ficar negativo. */
  liquido: number;
  atendimentos: number;
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Centavos, sempre: somar float direto acumula erro. */
function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}

function deCentavos(centavos: number): number {
  return centavos / 100;
}

export function formatarMoeda(valor: number): string {
  const negativo = valor < 0;
  const inteiro = Math.floor(Math.abs(valor));
  const centavos = Math.round((Math.abs(valor) - inteiro) * 100);
  const milhar = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}R$ ${milhar},${String(centavos).padStart(2, '0')}`;
}

export function nomeDoMes(mes: number): string {
  return MESES[mes] ?? '';
}

export function rotuloDoMes(ano: number, mes: number): string {
  const nome = nomeDoMes(mes);
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

function iso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function primeiroDiaDoMes(ano: number, mes: number): string {
  return iso(ano, mes, 1);
}

export function ultimoDiaDoMes(ano: number, mes: number): string {
  return iso(ano, mes, new Date(ano, mes + 1, 0).getDate());
}

/** Domingo de Pascoa (algoritmo de Meeus/Jones/Butcher). */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes, dia);
}

function somarDias(data: Date, dias: number): Date {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function paraISO(data: Date): string {
  return iso(data.getFullYear(), data.getMonth(), data.getDate());
}

/**
 * Dias em que nao ha compensacao bancaria no Brasil.
 * Carnaval e Corpus Christi nao sao feriado nacional na lei, mas banco nao abre
 * — e o que importa aqui e quando o dinheiro cai.
 */
export function feriadosBancarios(ano: number): string[] {
  const domingoDePascoa = pascoa(ano);

  return [
    iso(ano, 0, 1), // Confraternização Universal
    paraISO(somarDias(domingoDePascoa, -48)), // segunda de carnaval
    paraISO(somarDias(domingoDePascoa, -47)), // terça de carnaval
    paraISO(somarDias(domingoDePascoa, -2)), // Sexta-feira Santa
    iso(ano, 3, 21), // Tiradentes
    iso(ano, 4, 1), // Dia do Trabalho
    paraISO(somarDias(domingoDePascoa, 60)), // Corpus Christi
    iso(ano, 8, 7), // Independência
    iso(ano, 9, 12), // Nossa Senhora Aparecida
    iso(ano, 10, 2), // Finados
    iso(ano, 10, 15), // Proclamação da República
    iso(ano, 10, 20), // Consciência Negra
    iso(ano, 11, 25), // Natal
  ];
}

export function ehDiaUtil(data: Date, feriados: string[] = feriadosBancarios(data.getFullYear())): boolean {
  const diaDaSemana = data.getDay();
  if (diaDaSemana === 0 || diaDaSemana === 6) return false;
  return !feriados.includes(paraISO(data));
}

/** O n-esimo dia util de um mes. */
export function diaUtilDoMes(ano: number, mes: number, posicao: number): Date {
  const feriados = feriadosBancarios(ano);
  const data = new Date(ano, mes, 1);
  let encontrados = 0;

  while (data.getMonth() === mes) {
    if (ehDiaUtil(data, feriados)) {
      encontrados += 1;
      if (encontrados === posicao) return new Date(data);
    }
    data.setDate(data.getDate() + 1);
  }

  // Mes sem dias uteis suficientes nao existe no calendario real, mas o tipo
  // pede um retorno: devolvemos o ultimo dia do mes.
  return new Date(ano, mes + 1, 0);
}

/**
 * Quando o fechamento de um mes cai na conta: quinto dia util do mes seguinte.
 * O mes so pode ser pago depois de fechado.
 */
export function dataDePagamento(ano: number, mes: number): Date {
  const anoPagamento = mes === 11 ? ano + 1 : ano;
  const mesPagamento = mes === 11 ? 0 : mes + 1;
  return diaUtilDoMes(anoPagamento, mesPagamento, 5);
}

/** Soma o mes inteiro. Os valores entram em centavos para nao acumular erro. */
export function calcularFechamento(
  atendimentos: Atendimento[],
  adiantamentos: Adiantamento[]
): Fechamento {
  const bruto = atendimentos.reduce((total, a) => total + emCentavos(a.valor_cliente), 0);
  const ganho = atendimentos.reduce((total, a) => total + emCentavos(a.valor_profissional), 0);
  const adiantado = adiantamentos.reduce((total, a) => total + emCentavos(a.valor), 0);

  return {
    bruto: deCentavos(bruto),
    ganho: deCentavos(ganho),
    adiantado: deCentavos(adiantado),
    liquido: deCentavos(ganho - adiantado),
    atendimentos: atendimentos.length,
  };
}

/** Quanto o profissional ganha num procedimento, com o arredondamento do banco. */
export function ganhoDoProcedimento(valorCliente: number, percentual: number): number {
  return Math.round(valorCliente * percentual) / 100;
}
