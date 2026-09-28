/**
 * Mantém o site atualizado em quem deixa a aba aberta (comum no celular).
 *
 * O service worker novo assume sozinho (autoUpdate), mas a página aberta continua
 * rodando o código antigo, que não conhece rotas novas. Aqui:
 * - ao voltar para a aba, pedimos ao navegador para procurar uma versão nova;
 * - quando uma versão nova assume o controle, recarregamos uma vez. Tudo o que o
 *   jogador fez já está salvo no navegador, então nada se perde.
 */
export function keepUpdated(): void {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  // Na primeira visita não havia versão antiga: nada para recarregar.
  const hadController = !!sw.controller;
  let reloading = false;
  sw.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    void sw
      .getRegistration()
      .then((r) => r?.update())
      .catch(() => undefined);
  });
}
