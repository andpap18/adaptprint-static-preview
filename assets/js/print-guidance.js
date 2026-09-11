/* Native disclosure works without JS; deep links additionally reveal it. */
(() => {
  'use strict';
  const guidance = document.getElementById('artwork-guidance');
  if (!guidance) return;
  const revealAnchor = () => {
    if (window.location.hash !== '#artwork-guidance') return;
    guidance.open = true;
    requestAnimationFrame(() => guidance.scrollIntoView({ block: 'start' }));
  };
  window.addEventListener('hashchange', revealAnchor);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const target = new URL(link.href, window.location.href);
    if (target.origin === window.location.origin && target.pathname === window.location.pathname && target.hash === '#artwork-guidance') {
      guidance.open = true;
      requestAnimationFrame(() => guidance.scrollIntoView({ block: 'start' }));
    }
  });
  revealAnchor();
})();
