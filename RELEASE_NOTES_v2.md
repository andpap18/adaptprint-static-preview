# Adapt Print Static Redesign v2 — UI/UX refinement

## Scope
Second-pass UI/UX and visual refinement of the static Adapt Print prototype while preserving the core branding, logo, colors, routes, contact data and lead-generation functionality.

## Key improvements
- Site-wide grid/container system with consistent max width and gutters.
- Unified typography scale using responsive `clamp()` values.
- Refined button system:
  - Primary: `Ζητήστε προσφορά`
  - Secondary: `DTF με το μέτρο` / `Δείτε δείγματα`
  - Contact: phone pills / call buttons
- Reworked compact mobile header and top info bar.
- Modern trust/USP component with lightweight icon badges.
- Rebuilt portfolio/showcase section so CTA belongs to the section header, not orphaned below images.
- Reworked final quote CTA as a composed dark CTA card with nested action panel.
- Added real project imagery density: service cards + mosaic/showcase + portfolio cards.
- Added CSS-only micro-interactions: card lift, image zoom, nav hover states, button transitions.
- Added `prefers-reduced-motion` support.
- Added responsive image variants, dimensions, lazy loading for below-fold images, eager loading for logo/hero.
- Fixed production-safe `tel:` links.

## QA performed
- 12 public pages.
- 5 breakpoints: small mobile, mobile, tablet, desktop, large desktop.
- 60 mechanical viewport checks.
- Verified:
  - no horizontal overflow,
  - one H1 per page,
  - meta description and canonical present,
  - no broken local image loads after scroll/lazy decode,
  - no masked tel hrefs,
  - image width/height attributes present,
  - mobile menu available and compact.
- Visual QA:
  - desktop homepage first fold,
  - full homepage desktop/mobile/tablet,
  - services grid,
  - portfolio desktop,
  - contact desktop,
  - CTA/showcase sections.

## Not final before live
Needs owner confirmation before production:
- real opening hours,
- DTF printable width/pricing/min quantity/VAT/shipping/turnaround/cutoff/file requirements,
- final quote form destination/backend,
- final legal text for privacy and terms,
- SEO migration URL inventory from Search Console / WordPress sitemap.
