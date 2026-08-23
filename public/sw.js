/**
 * Service worker do MARCO Concept Beauty.
 *
 * Só existe para receber o aviso de retorno quando o app está na tela de
 * início. Não faz cache de nada: o app é servido pelo EAS Hosting e cache
 * agressivo aqui só criaria versão velha presa no aparelho.
 */

// Assume o controle sem esperar o usuário fechar todas as abas.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('push', (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { titulo: 'MARCO Concept Beauty', corpo: evento.data ? evento.data.text() : '' };
  }

  const titulo = dados.titulo || 'MARCO Concept Beauty';
  const opcoes = {
    body: dados.corpo || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    // Reusar a mesma tag faz o aviso do dia substituir o anterior,
    // em vez de empilhar vários na tela.
    tag: dados.tag || 'retornos',
    data: { url: dados.url || '/' },
  };

  evento.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || '/';

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      // Se o app já está aberto, traz para frente em vez de abrir outra janela.
      for (const janela of janelas) {
        if ('focus' in janela) {
          janela.navigate?.(destino);
          return janela.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
