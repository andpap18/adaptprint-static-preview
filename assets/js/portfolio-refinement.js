/* Portfolio owns filtering; .portfolio-filter deliberately opts out of both
   legacy .filter-btn controllers in main.js. Keep display in sync with hidden
   because the shared lightbox uses inline display to select its gallery. */
(() => {
  const root = document.querySelector('main.portfolio-refined');
  if (!root) return;
  const buttons = [...root.querySelectorAll('.portfolio-filter')];
  const cards = [...root.querySelectorAll('.work-card')];
  const count = root.querySelector('#filterCount');
  const empty = root.querySelector('#portfolioEmpty');
  function applyFilter(button) {
    const filter = button.dataset.filter;
    let visible = 0;
    buttons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    cards.forEach(card => {
      const categories = (card.dataset.categories || card.dataset.category || '').split('|');
      const show = filter === 'Όλα' || categories.includes(filter);
      card.hidden = !show;
      card.style.display = show ? 'flex' : 'none';
      // Reveal observers may leave offscreen matches visibility:hidden.
      // Filtering must expose every matching card, not only viewport entries.
      if (show) {
        card.style.removeProperty('visibility');
        visible++;
      }
    });
    count.textContent = `${visible} ${visible === 1 ? 'δείγμα' : 'δείγματα'}${filter === 'Όλα' ? '' : ' · ' + filter}`;
    empty.hidden = visible !== 0;
  }
  buttons.forEach(button => button.addEventListener('click', () => applyFilter(button)));
  if (buttons.length) applyFilter(buttons.find(button => button.classList.contains('active')) || buttons[0]);
})();
