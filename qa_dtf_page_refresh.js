const fs = require('fs');
const path = require('path');
const page = fs.readFileSync(path.join(__dirname, 'stampes-dtf-me-to-metro', 'index.html'), 'utf8');

function required(fragment, label) {
  if (!page.includes(fragment)) throw new Error(`${label}: missing ${fragment}`);
}
function forbidden(fragment, label) {
  if (page.includes(fragment)) throw new Error(`${label}: stale fragment ${fragment}`);
}

required('class="dtf-quick-guide section-block"', 'compact DTF quick guide');
required('class="dtf-visual-grid"', 'real-work DTF image grid');
required('rola-dtf-me-to-metro-ergastirio.webp', 'production image');
required('dtf-efarmogi-se-skouro-yfasma.webp', 'application image');
required('dtf-paragogi-leptomereia-stampas.webp', 'detail image');
required('class="dtf-compact-process"', 'compact production process');
required('class="dtf-trust-strip"', 'separate trust strip');
required('class="form-section final-panel final-panel-form dtf-quote-panel"', 'distinct quote panel');
forbidden('<section class="social-proof reveal">', 'old dark trust card');
forbidden('<div class="copy-columns">', 'long two-column SEO wall');
console.log('PASS compact visual DTF page assertions');
