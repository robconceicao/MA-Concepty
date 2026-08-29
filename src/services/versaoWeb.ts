/**
 * Descobre se o site já está servindo uma versão mais nova do que a que está
 * aberta no aparelho.
 *
 * O truque: o Expo escreve o bundle com o hash do conteúdo no nome
 * (entry-<hash>.js) e o index.html aponta para ele. Se o index.html publicado
 * aponta para outro hash, saiu build novo. Assim não precisa de arquivo de
 * versão para manter atualizado nem de passo extra no deploy.
 */
import { Platform } from 'react-native';

const PADRAO_BUNDLE = /entry-([a-z0-9]+)\.js/i;

/** Tira a impressão digital do build a partir de um HTML (ou de um src). */
export function extrairVersao(html: string): string | null {
  const achado = html.match(PADRAO_BUNDLE);
  return achado ? achado[1] : null;
}

/**
 * A versão que está rodando agora, lida das tags <script> da página.
 *
 * Devolve null no aplicativo nativo e no modo de desenvolvimento — lá o bundle
 * é servido sem hash no nome, então não existe o que comparar.
 */
export function versaoCarregada(): string | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

  for (const script of Array.from(document.querySelectorAll('script[src]'))) {
    const versao = extrairVersao(script.getAttribute('src') ?? '');
    if (versao) return versao;
  }
  return null;
}

/** Busca o index.html publicado, sem passar por cache, e lê a versão dele. */
export async function buscarVersaoPublicada(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const endereco = new URL('/', window.location.href);
  // A querystring é só para escapar de algum cache no caminho que ignore o
  // cabeçalho; o "no-store" já resolve no navegador.
  endereco.searchParams.set('_versao', String(Date.now()));

  const resposta = await fetch(endereco.toString(), {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache' },
  });
  if (!resposta.ok) return null;

  return extrairVersao(await resposta.text());
}
