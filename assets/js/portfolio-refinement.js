/* Portfolio alone owns filtering and progressive display. All cards remain
   available without JS; inline display keeps the shared lightbox in sync with
   the currently displayed filtered subset. Existing global handlers untouched. */
(() => {
  const root = document.querySelector('main.portfolio-refined');
  if (!root) return;
  const buttons = [...root.querySelectorAll('.portfolio-filter')];
  const cards = [...root.querySelectorAll('.work-card')];
  const count = root.querySelector('#filterCount');
  const empty = root.querySelector('#portfolioEmpty');
  const more = root.querySelector('#portfolioMore');
  const pageSize = 24;
  let limit = pageSize;
  let current;
  function render() {
    const filter = current.dataset.filter;
    let matches = 0;
    let shown = 0;
    cards.forEach(card => {
      const categories = (card.dataset.categories || card.dataset.category || '').split('|');
      const match = filter === 'Όλα' || categories.includes(filter);
      const show = match && matches++ < limit;
      card.hidden = !show;
      card.style.display = show ? 'flex' : 'none';
      if (show) {
        card.style.removeProperty('visibility');
        shown++;
      }
    });
    count.textContent = `${shown} από ${matches} δείγματα${filter === 'Όλα' ? '' : ' · ' + filter}`;
    empty.hidden = matches !== 0;
    if (more) more.hidden = shown >= matches;
  }
  function applyFilter(button) {
    current = button;
    limit = pageSize;
    buttons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render();
  }
  more?.addEventListener('click', () => {
    const previous = cards.filter(card => !card.hidden).length;
    limit += pageSize;
    render();
    // Move keyboard focus into the newly revealed batch (also when the last
    // activation removes the button), never leave focus on a hidden control.
    cards.filter(card => !card.hidden)[previous]?.querySelector('.work-open')?.focus({preventScroll: true});
  });
  buttons.forEach(button => button.addEventListener('click', () => applyFilter(button)));
  const requested = new URLSearchParams(location.search).get('category');
  if (buttons.length) applyFilter(buttons.find(button => button.dataset.filter === requested) || buttons.find(button => button.classList.contains('active')) || buttons[0]);
})();
