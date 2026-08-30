# Adapt Print static migration notes

## Do not launch before
- Full WordPress files + database backup.
- Confirm exact opening hours with owner.
- Confirm DTF production facts: printable width, pricing/costing, VAT, minimum, cutoff, turnaround, shipping and file rules.
- Decide live form backend: mailto prototype, PHP handler, Google Sheet/CRM, or external form.
- Verify every existing indexed URL in GSC before cutover.

## Initial route strategy
Keep current core paths where possible: `/`, `/about-us/`, `/services/`, `/portfolio/`, `/contact-us/`, `/χονδρική-2/`, `/terms-and-conditions/`, `/privacy-policy/`. Add `/dtf-me-to-metro/` and service pages.

## Redirect draft
```apache
# Adapt Print static migration draft
# Preserve existing WordPress readable URLs where possible by publishing same paths.
# Redirect old query-style internal menu links to final clean paths if server supports it:
RewriteEngine On
RewriteCond %{QUERY_STRING} ^page_id=149$
RewriteRule ^$ /about-us/? [R=301,L]
RewriteCond %{QUERY_STRING} ^page_id=150$
RewriteRule ^$ /services/? [R=301,L]
RewriteCond %{QUERY_STRING} ^page_id=152$
RewriteRule ^$ /portfolio/? [R=301,L]
RewriteCond %{QUERY_STRING} ^page_id=151$
RewriteRule ^$ /contact-us/? [R=301,L]
Redirect 301 /wp-sitemap.xml /sitemap.xml
Redirect 301 /author/adaptprintsalesgmail-com/ /
```
