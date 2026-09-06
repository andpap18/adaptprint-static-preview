# Adapt Print — MyIP quote-form deployment

## What this adds

- `api/quote.php`: same-origin PHP endpoint for the production quote forms.
- Validates name plus email/phone and optional HTTP(S) file link.
- Captures service, portfolio project, DTF quantity/dimensions and visitor comments.
- Uses an Origin allowlist, a hidden honeypot field and an IP rate limit (5 submissions / 10 minutes).
- Sends a plain-text email to `adaptprintsales@gmail.com` through the MyIP/cPanel PHP mail transport.
- Keeps the current `mailto:` handoff on GitHub Pages preview; the JSON endpoint is used only at `adaptprint.gr` / `www.adaptprint.gr`.

## Required MyIP setup before production test

1. In cPanel, create the mailbox `website@adaptprint.gr` (or choose an existing domain mailbox).
2. Upload `api/quote.php` under the final document root as `public_html/api/quote.php`.
3. Outside `public_html`, create `private/adaptprint-quote-config.php` from `deploy/private/adaptprint-quote-config.example.php`.
4. In that private file, set `from` to the actual mailbox created in step 1. Keep the `recipient` as `adaptprintsales@gmail.com` unless Adapt Print changes it.
5. Ensure PHP is enabled for the domain and that outgoing `mail()` is available on the MyIP account.
6. Upload the updated `assets/js/main.js` with the production site. Do not upload `deploy/private/` into `public_html`.

## Mandatory live test

After the domain resolves to the production site, send one test submission from `https://adaptprint.gr/contact-us/` using a unique test name. Verify:

- browser displays the success state;
- exactly one email arrives at `adaptprintsales@gmail.com`;
- Reply-To is the submitted email when an email was provided;
- service/project/DTF details are present;
- invalid contact and invalid file-link fields are blocked in the browser;
- a direct GET to `/api/quote.php` returns JSON 405 and never exposes config.

Do not state that delivery is reliable until that real MyIP test completes.
