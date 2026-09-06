# Adapt Print — production handoff (AP-19, AP-20, AP-27, AP-30)

## Τι έχει επιβεβαιωθεί

- Το GitHub Pages preview εξυπηρετεί HTTPS και `Strict-Transport-Security`.
- Το GitHub Pages preview δεν ελέγχει από αυτό το repository CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`/`X-Frame-Options` ή cache policy μεγαλύτερη από `max-age=600`.
- Το production asset `https://adaptprint.gr/assets/images/og-adaptprint.jpg` επιστρέφει 404.
- Το preview asset `/adaptprint-static-preview/assets/images/home-preview-logo.webp` επιστρέφει 200 με `image/webp`.

## Απαιτούμενα πριν το production go-live

1. **Public assets**
   - Ανεβάζονται στο τελικό production origin μία πραγματική 1200×630 OG εικόνα και το πραγματικό logo.
   - Επιβεβαιώνονται με `200` και image content type για κάθε `og:image`, schema `image` και schema `logo`.

2. **Routes and redirects**
   - Δημιουργούνται όλες οι canonical service routes που δηλώνει το production sitemap.
   - Χαρτογραφούνται οι παλιές σημαντικές URLs σε μία τελική URL η καθεμία, χωρίς redirect chain.
   - Ο production build δεν πρέπει να έχει `noindex` ή `Disallow: /` κατά λάθος.

3. **Security headers, αφού οριστικοποιηθούν τα production origins**
   - `Content-Security-Policy` με συγκεκριμένα `default-src`, `img-src`, `style-src`, `script-src`, `connect-src` και `frame-src` για Google Maps μόνο εφόσον χρησιμοποιείται.
   - `frame-ancestors 'self'` ή ισοδύναμο, μετά από έλεγχο τυχόν πραγματικών embeds.
   - `X-Content-Type-Options: nosniff`.
   - `Referrer-Policy: strict-origin-when-cross-origin` ή επιλογή που εγκρίνει ο host/security reviewer.
   - Περιοριστική `Permissions-Policy` μόνο για features που δεν χρησιμοποιούνται.
   - Re-test: εικόνες, γραμματοσειρές, φόρμες mailto, Maps on-demand, WhatsApp και κάθε embedded resource.

4. **Caching/versioning**
   - HTML: σύντομη cache ή revalidation.
   - μεταβλημένα CSS/JS: content-hashed names (π.χ. `main.<hash>.js`) και long immutable cache.
   - αμετάβλητες εικόνες/γραμματοσειρές: versioned URLs + long immutable cache.
   - Καμία αλλαγή asset να μη διατηρεί stale παλιά συμπεριφορά μετά από deploy.

## Ασφαλής έλεγχος go-live

- Ένας automated HTTP crawl των canonical, sitemap URLs, redirect source URLs και OG/schema assets.
- Έλεγχος headers σε production response.
- Rich preview validation αφού ανανεωθούν οι caches της κάθε πλατφόρμας.
- Επιβεβαίωση ότι το preview παραμένει `noindex,follow` και το production είναι indexable μόνο όταν έχει ολοκληρωθεί το παραπάνω checklist.
