from pathlib import Path
import json, html, re

ROOT = Path(__file__).parent
SITE = 'https://adaptprint.gr'
AS = '/assets/images/'

CONTACT = {
    'phone1_label': '211 21 81 704', 'phone1_href': 'tel:+302112181704',
    'phone2_label': '698 28 48 330', 'phone2_href': 'tel:+306982848330',
    'whatsapp': 'https://wa.me/306982848330',
    'email': 'adaptprintsales@gmail.com', 'email_href': 'mailto:adaptprintsales@gmail.com',
    'address': 'Μακεδονίας 81, Πειραιάς 18545',
    'maps': 'https://www.google.com/maps/search/?api=1&query=%CE%9C%CE%B1%CE%BA%CE%B5%CE%B4%CE%BF%CE%BD%CE%AF%CE%B1%CF%82%2081%2C%20%CE%A0%CE%B5%CE%B9%CF%81%CE%B1%CE%B9%CE%AC%CF%82%2018545'
}
HOURS = [
    ('Δευτέρα', '10:00–15:00'), ('Τρίτη', '10:00–14:00 & 17:30–21:00'),
    ('Τετάρτη', '10:00–15:00'), ('Πέμπτη', '10:00–14:00 & 18:00–21:00'),
    ('Παρασκευή', '10:00–14:00 & 17:30–21:00'), ('Σάββατο', '10:00–15:00'), ('Κυριακή', 'Κλειστά')]

def asset(num):
    stem = f'adaptprint-source-{num:02d}'
    for suffix in ['', '-1200', '-800', '-480']:
        candidate = ROOT / 'assets' / 'images' / f'{stem}{suffix}.webp'
        if candidate.exists():
            return AS + candidate.name
    return AS + f'{stem}.webp'

img = {f's{i:02d}': asset(i) for i in range(1, 25)}
img.update({
    'logo': AS + 'adaptprint-logo-header-transparent.png',
    'og': SITE + '/assets/images/og-adaptprint.jpg',
})

pages = []

def add(path, title, desc, h1, body, priority='0.8', legal=False):
    pages.append({'path': path, 'title': title, 'desc': desc, 'h1': h1, 'body': body, 'priority': priority, 'legal': legal})

NAV_ITEMS = [
    ('/dtf-me-to-metro/', 'DTF με το μέτρο'), ('/services/', 'Εκτυπώσεις'),
    ('/portfolio/', 'Portfolio'), ('/χονδρική-2/', 'Χονδρική'),
    ('/about-us/', 'Η εταιρεία'), ('/contact-us/', 'Επικοινωνία')]

def esc(s): return html.escape(str(s), quote=True)

def current_path(p):
    if p == 'index.html': return '/'
    return '/' + p.replace('index.html', '')

def nav(current):
    return ''.join(f'<a class="nav-link {"active" if href == current else ""}" href="{href}">{label}</a>' for href, label in NAV_ITEMS)

def contact_buttons(extra=''):
    return f'''<div class="action-row {extra}">
        <a class="btn btn-primary" href="/dtf-me-to-metro/#quote">DTF προσφορά <span aria-hidden="true">→</span></a>
        <a class="btn btn-secondary" href="/contact-us/#quote">Ζητήστε προσφορά <span aria-hidden="true">→</span></a>
        <a class="btn btn-quiet" href="{CONTACT['whatsapp']}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    </div>'''

def quote_form(service=''):
    return f'''<form class="quote-form" id="quote" action="mailto:{CONTACT['email']}" method="post" enctype="text/plain" aria-label="Φόρμα προσφοράς">
        <div class="form-grid">
            <label>Ονοματεπώνυμο ή εταιρεία<input name="name" required autocomplete="name"></label>
            <label>Τηλέφωνο ή email<input name="contact" required autocomplete="email"></label>
            <label>Υπηρεσία<select name="service_select"><option>{esc(service or 'Επιλέξτε υπηρεσία')}</option><option>DTF με το μέτρο</option><option>Μπλουζάκια / επαγγελματική ένδυση</option><option>Κούπες / προσωποποιημένα δώρα</option><option>Διαφημιστικά είδη</option><option>Χονδρική συνεργασία</option></select></label>
            <label>Ποσότητα / μέτρα / τεμάχια<input name="quantity" placeholder="π.χ. 5 μέτρα DTF ή 30 μπλουζάκια"></label>
            <label>Πότε το χρειάζεστε;<input name="deadline" placeholder="π.χ. μέχρι Παρασκευή ή δεν γνωρίζω"></label>
            <label>Link αρχείου, αν υπάρχει<input name="file_link" placeholder="WeTransfer / Drive / Dropbox link"></label>
            <label class="wide">Σχόλια<textarea name="message" rows="5" placeholder="Περιγράψτε σχέδιο, διαστάσεις, υλικό, χρώμα προϊόντος ή άλλη λεπτομέρεια."></textarea></label>
        </div>
        <p class="form-note">Με την υποβολή ανοίγει νέο email με τα στοιχεία της προσφοράς, ώστε να τα ελέγξετε πριν τα στείλετε στην Adapt Print.</p>
        <button class="btn btn-primary" type="submit">Άνοιγμα email προσφοράς <span aria-hidden="true">→</span></button>
    </form>'''

def final_cta(legal=False):
    if legal:
        return f'''<section class="final-panel final-panel-quiet"><p class="kicker">Adapt Print</p><h2>Χρήσιμες πληροφορίες</h2><p>Για παραγγελίες και προσφορές χρησιμοποιήστε τα στοιχεία επικοινωνίας ή τη σελίδα προσφοράς.</p><a class="btn btn-secondary" href="/contact-us/">Επικοινωνία</a></section>'''
    return f'''<section class="final-panel"><div><p class="kicker">Από ιδέα σε εκτύπωση</p><h2>Έχετε σχέδιο, προϊόν ή ποσότητα; Στείλτε μας τα βασικά.</h2><p>Θα σας καθοδηγήσουμε για αρχείο, τεχνική, ποσότητα και χρόνο παραγωγής χωρίς περιττά βήματα.</p></div>{contact_buttons('compact')}</section>'''

def service_tile(title, tag, text, image, url, accent='cyan'):
    return f'''<article class="service-tile reveal" data-accent="{accent}"><a href="{url}" aria-label="{esc(title)}">
        <figure><img src="{image}" alt="{esc(title)}" loading="lazy"></figure>
        <div class="tile-copy"><span class="micro-label">{tag}</span><h3>{title}</h3><p>{text}</p><span class="inline-arrow">Δείτε λεπτομέρειες →</span></div>
    </a></article>'''

services = [
    ('DTF με το μέτρο', 'Παραγωγή / B2B', 'Στάμπες DTF σε ρολό για εφαρμογή σε ρούχα και υφάσματα.', img['s12'], '/dtf-me-to-metro/', 'cyan'),
    ('Μπλουζάκια & ένδυση', 'Ύφασμα / ομάδα / brand', 'Μπλουζάκια, ποδιές, εταιρικά ρούχα και προσωποποιημένη ένδυση.', img['s02'], '/ektyposeis-se-mplouzakia/', 'magenta'),
    ('Κούπες & δώρα', 'Προσωποποίηση', 'Κούπες, θερμός και δώρα με φωτογραφία, μήνυμα ή λογότυπο.', img['s03'], '/ektyposeis-se-koupes/', 'yellow'),
    ('Διαφημιστικά είδη', 'UV / αντικείμενα', 'Στυλό, αναπτήρες, USB, ιμάντες, tote bags και εταιρικά αντικείμενα.', img['s06'], '/diafimistika-eidi/', 'ink')]

def service_grid():
    return '<div class="service-catalog">' + ''.join(service_tile(*s) for s in services) + '</div>'

def process_path():
    steps = [
        ('01', 'Στέλνετε αρχείο', 'PNG/PDF ή άλλο αρχείο στην τελική διάσταση, ιδανικά με διαφάνεια όπου χρειάζεται.'),
        ('02', 'Έλεγχος παραγωγής', 'Ελέγχουμε διαστάσεις, κενά, ανάλυση, τοποθέτηση και πιθανές διορθώσεις πριν την εκτύπωση.'),
        ('03', 'Προσφορά', 'Η τελική τιμή δίνεται βάσει πραγματικών μέτρων/τεμαχίων και επιβεβαιωμένων προδιαγραφών.'),
        ('04', 'Εκτύπωση & παραλαβή', 'Η παραγωγή ξεκινά μετά την έγκριση και ολοκληρώνεται σύμφωνα με τον συμφωνημένο χρόνο.')]
    return '<div class="process-roll">' + ''.join(f'<article class="process-step reveal"><span>{n}</span><h3>{t}</h3><p>{d}</p></article>' for n,t,d in steps) + '</div>'

def faq(items):
    return '<div class="faq-list">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q,a in items) + '</div>'

def page_hero(kicker, title, text, image, dark=False, extra=''):
    cls = 'page-hero page-hero-dark' if dark else 'page-hero'
    return f'''<section class="{cls} reveal"><div class="page-hero-copy"><span class="kicker">{kicker}</span><h1>{title}</h1><p>{text}</p>{extra}</div><figure class="page-hero-media"><img src="{image}" alt="{esc(title)}"></figure></section>'''

# Home
add('index.html', 'Εκτυπώσεις σε Μπλουζάκια, Κούπες & DTF | Adapt Print',
    'Εκτυπώσεις σε μπλουζάκια, κούπες, DTF με το μέτρο και διαφημιστικά είδη στον Πειραιά. Ζητήστε προσφορά από την Adapt Print.',
    'Εκτυπώσεις σε μπλουζάκια, κούπες και DTF με το μέτρο', f'''
<section class="hero hero-ink reveal" aria-label="Adapt Print hero">
    <div class="hero-copy">
        <span class="kicker">Adapt Print · Πειραιάς · DTF / UV / Sublimation</span>
        <h1>Εκτυπώσεις με χρώμα, υφή και επαγγελματικό τελείωμα.</h1>
        <p>DTF στάμπες με το μέτρο, εκτυπώσεις σε ένδυση, κούπες και διαφημιστικά είδη για ιδιώτες και επαγγελματίες σε Πειραιά, Αθήνα και όλη την Ελλάδα.</p>
        {contact_buttons()}
        <div class="trust-strip" aria-label="Στοιχεία εμπιστοσύνης">
            <span><b class="counter" data-count="5.0" data-decimals="1">5,0</b>/5 Google Maps</span><span><b class="counter" data-count="101">101</b> δημόσιες κριτικές</span><span><b>Μακεδονίας 81</b> Πειραιάς</span>
        </div>
    </div>
    <div class="print-composition" aria-label="Σύνθεση πραγματικών προϊόντων Adapt Print">
        <span class="registration-mark mark-a" aria-hidden="true"></span><span class="registration-mark mark-b" aria-hidden="true"></span>
        <figure class="product product-shirt"><img src="{img['s02']}" alt="Εκτύπωση σε επαγγελματική ένδυση"></figure>
        <figure class="product product-roll"><img src="{img['s12']}" alt="DTF ρολό παραγωγής"></figure>
        <figure class="product product-mug"><img src="{img['s24']}" alt="Εκτύπωση σε κούπα"></figure>
        <div class="cmy-layers" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>
</section>
<section class="ink-band reveal"><div><span class="micro-label">Κύρια υπηρεσία</span><h2>DTF με το μέτρο, χωρίς να χάνεται η λεπτομέρεια της στάμπας.</h2></div><p>Η υπηρεσία DTF παρουσιάζεται καθαρά: αρχείο, έλεγχος, προσφορά και εκτύπωση, με έμφαση στη λεπτομέρεια της στάμπας και στη σωστή εφαρμογή.</p><a class="btn btn-light" href="/dtf-me-to-metro/">Άνοιγμα DTF σελίδας →</a></section>
<section class="section-block"><div class="section-head"><span class="kicker">Υπηρεσίες</span><h2>Οπτικός κατάλογος εκτυπώσεων</h2><p>Κάθε κατηγορία έχει δικό της προϊόν, εικόνα και καθαρή διαδρομή προς προσφορά.</p></div>{service_grid()}</section>
<section class="selected-work reveal"><div class="section-head"><span class="kicker">Πραγματικά δείγματα</span><h2>Οι εκτυπώσεις μπαίνουν μπροστά, όχι οι κάρτες.</h2><p>Στο portfolio οι φωτογραφίες αποκτούν διαφορετικές αναλογίες, φίλτρα και lightbox για εξέταση λεπτομέρειας.</p></div><div class="mini-masonry"><figure><img src="{img['s09']}" alt="DTF εφαρμογή σε μπλουζάκι" loading="lazy"><figcaption>Ένδυση</figcaption></figure><figure><img src="{img['s10']}" alt="Εκτύπωση σε κούπες" loading="lazy"><figcaption>Δώρα</figcaption></figure><figure><img src="{img['s23']}" alt="Λεπτομέρεια παραγωγής" loading="lazy"><figcaption>Παραγωγή</figcaption></figure></div><a class="btn btn-secondary" href="/portfolio/">Δείτε το portfolio →</a></section>
{final_cta()}''', '1.0')

# DTF
add('dtf-me-to-metro/index.html', 'Εκτύπωση DTF με το Μέτρο - Στάμπες | Adapt Print',
    'Στάμπες DTF με το μέτρο από την Adapt Print στον Πειραιά. Δείτε προδιαγραφές αρχείου, παραγωγή και ζητήστε προσφορά.',
    'Εκτύπωση DTF με το μέτρο', f'''
{page_hero('DTF παραγωγή', 'Εκτύπωση DTF με το μέτρο', 'Στάμπες DTF σε ρολό για επαγγελματίες που θέλουν να εφαρμόσουν τα σχέδιά τους με θερμοπρέσα. Στείλτε αρχείο και ποσότητα για έλεγχο προδιαγραφών και προσφορά.', img['s12'], True, '<div class="action-row"><a class="btn btn-primary" href="#quote">Ζητήστε προσφορά DTF</a><a class="btn btn-light" href="tel:+302112181704">Καλέστε για προδιαγραφές</a></div>')}
<section class="production-strip reveal"><figure><img src="{img['s23']}" alt="Λεπτομέρεια DTF παραγωγής" loading="lazy"></figure><div><span class="micro-label">Ρολό / στάμπα / εφαρμογή</span><h2>Από το ψηφιακό αρχείο στην έτοιμη στάμπα DTF.</h2><p>Βλέπετε τα βασικά στάδια παραγωγής με απλό τρόπο: προετοιμασία αρχείου, έλεγχος λεπτομερειών, εκτύπωση και παραλαβή.</p></div></section>
<section class="section-block"><div class="section-head"><span class="kicker">Διαδικασία</span><h2>Από το αρχείο στο έτοιμο DTF</h2></div>{process_path()}</section>
<section class="info-cluster"><article><h2>Για ποιους είναι</h2><p>Για επαγγελματίες ένδυσης, ομάδες, εργαστήρια, brands και καταστήματα που χρειάζονται στάμπες έτοιμες για εφαρμογή.</p></article><article><h2>Τι πρέπει να ξέρουμε</h2><p>Ποσότητα, τελικές διαστάσεις, τύπο αρχείου, προθεσμία και αν υπάρχει ανάγκη παραλαβής ή αποστολής.</p></article><article><h2>Τι επιβεβαιώνεται</h2><p>Στην προσφορά επιβεβαιώνονται οι τεχνικές προδιαγραφές, η τελική ποσότητα, ο χρόνος παραγωγής και ο τρόπος παραλαβής ή αποστολής.</p></article></section>
<section class="faq-section"><div class="section-head"><span class="kicker">FAQ</span><h2>Συχνές ερωτήσεις για DTF</h2></div>{faq([('Πόσο κοστίζει το DTF με το μέτρο;', 'Η τιμή δίνεται μετά τον έλεγχο του αρχείου, της ποσότητας, των διαστάσεων και των τυχόν πρόσθετων απαιτήσεων της παραγγελίας.'), ('Υπάρχει ελάχιστη ποσότητα;', 'Η ελάχιστη ποσότητα εξαρτάται από την εργασία και επιβεβαιώνεται στην προσφορά πριν ξεκινήσει η παραγωγή.'), ('Μπορώ να στείλω αρχείο με link;', 'Ναι. Μπορείτε να στείλετε σύνδεσμο από WeTransfer, Drive ή άλλο ασφαλές μέσο, ώστε να γίνει ο αρχικός έλεγχος.')])}</section>
<section class="form-section"><div class="section-head"><span class="kicker">Προσφορά DTF</span><h2 id="quote-title">Ζητήστε προσφορά DTF</h2><p>Στείλτε μας αρχείο, ποσότητα και βασικές διαστάσεις για να ελέγξουμε την εργασία και να σας απαντήσουμε με προσφορά.</p></div>{quote_form('DTF με το μέτρο')}</section>''', '0.95')

# Services page
add('services/index.html', 'Υπηρεσίες Εκτύπωσης | DTF, Κούπες & UV | Adapt Print',
    'Δείτε υπηρεσίες εκτύπωσης της Adapt Print για ένδυση, κούπες, DTF και διαφημιστικά είδη.',
    'Υπηρεσίες εκτύπωσης για ιδιώτες και επαγγελματίες', f'''
{page_hero('Κατάλογος υπηρεσιών', 'Εκτυπώσεις για ιδιώτες και επαγγελματίες', 'Από DTF στάμπες και ένδυση μέχρι κούπες και διαφημιστικά είδη, κάθε υπηρεσία έχει ξεκάθαρη περιγραφή, εικόνα προϊόντος και γρήγορη διαδρομή προς προσφορά.', img['s07'], False, '<a class="btn btn-primary" href="/contact-us/#quote">Στείλτε αίτημα προσφοράς</a>')}
<section class="section-block"><div class="section-head"><span class="kicker">Υπηρεσίες</span><h2>Επιλέξτε κατηγορία εκτύπωσης</h2></div>{service_grid()}</section>
<section class="ink-band reveal"><div><span class="micro-label">Πριν την παραγωγή</span><h2>Καθαρό brief σημαίνει πιο καθαρή προσφορά.</h2></div><p>Προϊόν, ποσότητα, αρχείο, προθεσμία και τρόπος παραλαβής είναι τα βασικά στοιχεία που βοηθούν να δοθεί γρήγορα σωστή προσφορά.</p></section>{final_cta()}''')

# Individual service pages
service_pages = [
('ektyposeis-se-mplouzakia/index.html','Εκτυπώσεις σε Μπλουζάκια & Ένδυση | Adapt Print','Εκτυπώσεις σε μπλουζάκια και επαγγελματική ένδυση','Μπλουζάκια, ποδιές, εταιρικά ρούχα και προσωποποιημένα σχέδια για ομάδες, επαγγελματίες και δώρα.',img['s22'],[img['s02'],img['s09'],img['s14']],'Ύφασμα / στάμπα / εφαρμογή'),
('ektyposeis-se-koupes/index.html','Εκτυπώσεις σε Κούπες | Adapt Print','Εκτυπώσεις σε κούπες και προσωποποιημένα δώρα','Κούπες με φωτογραφία, μήνυμα ή εταιρικό λογότυπο για δώρα, εκδηλώσεις και επαγγελματικές χρήσεις.',img['s03'],[img['s03'],img['s10'],img['s24']],'Κούπες / δώρα / φωτεινή παρουσίαση'),
('diafimistika-eidi/index.html','Διαφημιστικά Είδη με Λογότυπο | Adapt Print','Διαφημιστικά είδη και προσωποποιημένα εταιρικά δώρα','UV και άλλες τεχνικές για διαφημιστικά προϊόντα, στυλό, αναπτήρες, USB, ιμάντες, tote bags και εταιρικά αντικείμενα.',img['s05'],[img['s05'],img['s06'],img['s08'],img['s11']],'Ποικιλία αντικειμένων / B2B')]
for path,title,h1,text,hero,gallery,kicker in service_pages:
    add(path, title, text, h1, f'''
{page_hero(kicker, h1, text, hero, False, '<div class="action-row"><a class="btn btn-primary" href="/contact-us/#quote">Ζητήστε προσφορά</a><a class="btn btn-secondary" href="/portfolio/">Δείτε δείγματα</a></div>')}
<section class="product-detail-grid">{''.join(f'<figure class="reveal"><img src="{g}" alt="{esc(h1)}" loading="lazy"></figure>' for g in gallery)}</section>
<section class="info-cluster"><article><h2>Τι βοηθά στην προσφορά</h2><p>Ποσότητα, χρήση, υλικό, προθεσμία και αν υπάρχει έτοιμο σχέδιο.</p></article><article><h2>Για επαγγελματίες</h2><p>Μπορεί να συνδεθεί με χονδρική ή επαναλαμβανόμενες παραγγελίες.</p></article><article><h2>Για ιδιώτες</h2><p>Καθαρή καθοδήγηση για δώρα, εκδηλώσεις και προσωποποιημένες ιδέες.</p></article></section>{final_cta()}''')

# Portfolio
portfolio_items = [
    ('p1', 'Ένδυση', 'Πραγματική εφαρμογή σε ύφασμα', img['s02'], 'real tall'),
    ('p2', 'Κούπες', 'Σετ προσωποποιημένων δώρων', img['s03'], 'real'),
    ('p3', 'Διαφημιστικά', 'Notebook / εταιρικό αντικείμενο', img['s04'], 'real wide'),
    ('p4', 'Διαφημιστικά', 'Στυλό με λογότυπο', img['s05'], 'real'),
    ('p5', 'UV', 'Αναπτήρες / αντικείμενα', img['s06'], 'real tall'),
    ('p6', 'Ένδυση', 'Tote bag και ύφασμα', img['s07'], 'real'),
    ('p7', 'Διαφημιστικά', 'Ιμάντες / lanyards', img['s08'], 'real wide'),
    ('p8', 'Ένδυση', 'DTF εφαρμογή σε μπλουζάκι', img['s09'], 'real'),
    ('p9', 'Κούπες', 'Δείγμα κούπας', img['s10'], 'real tall'),
    ('p10', 'Παρουσίαση', 'Μακέτα υπηρεσίας / όχι έργο πελάτη', img['s14'], 'mockup'),
    ('p11', 'Παρουσίαση', 'Οδηγός επιλογών εκτύπωσης', img['s15'], 'mockup wide'),
    ('p12', 'Παραγωγή', 'Εκτυπωτικό / DTF ρολό', img['s12'], 'real wide')]
filters = ['Όλα', 'Ένδυση', 'Κούπες', 'Διαφημιστικά', 'UV', 'Παραγωγή', 'Παρουσίαση']
portfolio_html = ''.join(f'''<article class="work-card {classes}" data-category="{cat}" tabindex="0"><button type="button" class="work-open" aria-label="Άνοιγμα εικόνας: {esc(title)}" data-src="{image}" data-title="{esc(title)}" data-note="{esc(note)}"><img src="{image}" alt="{esc(title)}" loading="lazy"><span class="work-meta"><b>{title}</b><small>{note}</small></span></button><a class="work-cta" href="/contact-us/#quote">Θέλω αντίστοιχη εκτύπωση</a></article>''' for _,cat,title,image,classes in portfolio_items for note in [cat if classes == 'mockup' else ('Πραγματικό δείγμα / χρήση προϊόντος' if 'real' in classes else 'Δείγμα')])
add('portfolio/index.html', 'Δείγματα Εκτυπώσεων & Έργα | Adapt Print',
    'Δείτε πραγματικές εργασίες εκτύπωσης σε ένδυση, κούπες και διαφημιστικά είδη από την Adapt Print.',
    'Δείγματα εκτυπώσεων από την Adapt Print', f'''
{page_hero('Portfolio', 'Οι πραγματικές εκτυπώσεις στο κέντρο της εμπειρίας', 'Φίλτρα, διαφορετικές αναλογίες εικόνων και lightbox για να εξετάζεται η λεπτομέρεια κάθε εφαρμογής. Οι μακέτες υπηρεσιών διαχωρίζονται από τα πραγματικά δείγματα.', img['s09'], True)}
<section class="portfolio-section"><div class="filter-bar" role="toolbar" aria-label="Φίλτρα portfolio">{''.join(f'<button type="button" class="filter-btn {"active" if f=="Όλα" else ""}" data-filter="{f}">{f}</button>' for f in filters)}</div><div class="portfolio-grid" id="portfolioGrid">{portfolio_html}</div></section>{final_cta()}
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Προβολή εικόνας portfolio" hidden><button class="lightbox-close" type="button" aria-label="Κλείσιμο">×</button><button class="lightbox-prev" type="button" aria-label="Προηγούμενη εικόνα">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lightbox-next" type="button" aria-label="Επόμενη εικόνα">›</button></div>''')

# Wholesale
add('χονδρική-2/index.html', 'Εκτυπώσεις Χονδρικής & B2B Συνεργασίες | Adapt Print',
    'Συνεργαστείτε με την Adapt Print για εκτυπώσεις χονδρικής. Περιγράψτε υπηρεσία, ποσότητα και ανάγκες παραγωγής.',
    'Εκτυπώσεις χονδρικής για επαγγελματίες', f'''
{page_hero('B2B συνεργασία', 'Εκτυπώσεις χονδρικής για επαγγελματίες', 'Για επαγγελματίες της διαφήμισης, ένδυσης και προσωποποιημένων προϊόντων που χρειάζονται σταθερή επικοινωνία, καθαρές προδιαγραφές και επαναληπτικές παραγγελίες.', img['s08'], True, '<a class="btn btn-primary" href="#quote">Αίτημα συνεργασίας</a>')}
<section class="info-cluster"><article><h2>DTF παραγωγή</h2><p>Με το μέτρο και με έλεγχο αρχείου πριν την παραγωγή, όταν επιβεβαιωθούν οι τεχνικοί όροι.</p></article><article><h2>Επαναληπτικές εργασίες</h2><p>Κατάλληλο για συνεργάτες που στέλνουν συχνά σχέδια και ποσότητες.</p></article><article><h2>Πρώτη προσφορά</h2><p>Η φόρμα ζητά υπηρεσία, ποσότητα και ένα βασικό κανάλι επικοινωνίας αντί για περιττά πεδία.</p></article></section><section class="form-section"><div class="section-head"><span class="kicker">Χονδρική</span><h2>Αίτημα συνεργασίας</h2></div>{quote_form('Χονδρική συνεργασία')}</section>''')

# About / Contact / Legal
add('about-us/index.html', 'Σχετικά με την Adapt Print | Εκτυπώσεις στον Πειραιά',
    'Γνωρίστε την Adapt Print, τις τεχνικές εκτύπωσης και το κατάστημά μας στον Πειραιά.',
    'Η Adapt Print στον Πειραιά', f'''
{page_hero('Η εταιρεία', 'Η Adapt Print στον Πειραιά', 'Μια σύγχρονη επιχείρηση ψηφιακών εκτυπώσεων στον Πειραιά, με υπηρεσίες για ένδυση, δώρα, DTF και διαφημιστικά είδη.', img['s21'], False)}
<section class="about-collage"><figure><img src="{img['s21']}" alt="Κατάστημα Adapt Print στον Πειραιά" loading="lazy"></figure><div><span class="kicker">Κατάστημα και παραγωγή</span><h2>Πραγματική εικόνα από την καθημερινή δουλειά.</h2><p>Η Adapt Print συνδυάζει παραγωγή, εξυπηρέτηση και πρακτική καθοδήγηση, ώστε κάθε εκτύπωση να ξεκινά με σωστό αρχείο και να καταλήγει σε καθαρό αποτέλεσμα.</p></div><figure><img src="{img['s24']}" alt="Παραγωγή εκτύπωσης σε κούπα" loading="lazy"></figure></section>{final_cta('Μιλήστε με την Adapt Print')}''')

add('contact-us/index.html', 'Επικοινωνία & Προσφορά Εκτύπωσης | Adapt Print',
    'Επικοινωνήστε με την Adapt Print στη Μακεδονίας 81, Πειραιάς. Καλέστε ή στείλτε αίτημα προσφοράς.',
    'Επικοινωνήστε με την Adapt Print', f'''
<section class="contact-hero reveal"><div><span class="kicker">Επικοινωνία</span><h1>Πείτε μας τι θέλετε να τυπώσουμε.</h1><p>Επιλέξτε τον πιο άμεσο τρόπο επικοινωνίας: τηλέφωνο, WhatsApp, email, επίσκεψη στο κατάστημα ή σύντομο αίτημα προσφοράς.</p><div class="contact-methods"><a href="{CONTACT['phone1_href']}"><b>{CONTACT['phone1_label']}</b><span>Σταθερό</span></a><a href="{CONTACT['phone2_href']}"><b>{CONTACT['phone2_label']}</b><span>Κινητό</span></a><a href="{CONTACT['whatsapp']}" target="_blank" rel="noopener noreferrer"><b>WhatsApp</b><span>Γρήγορη αποστολή</span></a><a href="{CONTACT['email_href']}"><b>{CONTACT['email']}</b><span>Email</span></a></div></div><aside class="shop-card"><h2>Κατάστημα</h2><p>{CONTACT['address']}</p><a class="btn btn-secondary" href="{CONTACT['maps']}" target="_blank" rel="noopener noreferrer">Άνοιγμα χάρτη</a><h3>Ωράριο*</h3><ul class="hours-list">{''.join(f'<li><span>{d}</span><b>{h}</b></li>' for d,h in HOURS)}</ul><p class="small">*Το ωράριο μπορεί να διαφοροποιείται σε αργίες ή περιόδους αυξημένης παραγωγής. Καλέστε πριν την επίσκεψη για άμεση επιβεβαίωση.</p></aside></section>
<section class="form-section"><div class="section-head"><span class="kicker">Προσφορά</span><h2 id="quote-title">Ζητήστε προσφορά</h2></div>{quote_form('')}</section>''')

legal_terms = '<section class="legal-page"><span class="kicker">Νομικά</span><h1>Όροι χρήσης και συναλλαγών</h1><p>Οι παραγγελίες εκτυπώσεων επιβεβαιώνονται πριν την παραγωγή, με βάση το προϊόν, την ποσότητα, το αρχείο, τη μακέτα και τον συμφωνημένο χρόνο ολοκλήρωσης. Για ειδικούς όρους συναλλαγής ή προσωποποιημένες εργασίες, επικοινωνήστε με την Adapt Print πριν την παραγγελία.</p></section>'
legal_privacy = '<section class="legal-page"><span class="kicker">Νομικά</span><h1>Πολιτική απορρήτου και προσωπικών δεδομένων</h1><p>Τα στοιχεία που στέλνετε μέσω email ή φόρμας προσφοράς χρησιμοποιούνται για την επικοινωνία σχετικά με την εργασία σας, την προετοιμασία προσφοράς και την παραγωγή της παραγγελίας. Μην αποστέλλετε ευαίσθητα προσωπικά δεδομένα αν δεν είναι απαραίτητα για την εκτύπωση.</p></section>'
add('terms-and-conditions/index.html', 'Όροι Χρήσης & Συναλλαγών | Adapt Print', 'Διαβάστε τους όρους χρήσης και συναλλαγών της Adapt Print.', 'Όροι χρήσης και συναλλαγών', legal_terms, '0.4', True)
add('privacy-policy/index.html', 'Πολιτική Απορρήτου | Adapt Print', 'Ενημερωθείτε για την επεξεργασία προσωπικών δεδομένων από την Adapt Print.', 'Πολιτική απορρήτου και προσωπικών δεδομένων', legal_privacy, '0.4', True)

CSS = r'''
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;520;650;760;840&family=IBM+Plex+Sans+Condensed:wght@600;700&display=swap');
:root{
  --ink:#111820; --ink-2:#182434; --ink-soft:#253242; --paper:#fffaf2; --paper-2:#f7f1e6; --surface:#ffffff;
  --cyan:#00a8e8; --magenta:#ec297b; --yellow:#f7c600; --accent:#f47b20; --accent-dark:#9d3d00;
  --text:#17202a; --muted:#647083; --line:#e6e0d7; --line-dark:rgba(255,255,255,.16);
  --radius-s:10px; --radius-m:18px; --radius-l:28px; --radius-xl:42px;
  --max:1180px; --gutter:clamp(18px,3vw,36px); --header-h:74px;
  --shadow-soft:0 14px 48px rgba(17,24,32,.10); --shadow-ink:0 30px 90px rgba(17,24,32,.22);
  --ease:cubic-bezier(.2,.7,.2,1); --t-fast:180ms; --t-med:520ms;
}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:calc(var(--header-h) + 32px)}body{margin:0;font-family:Manrope,Arial,sans-serif;color:var(--text);background:var(--paper);line-height:1.58;-webkit-font-smoothing:antialiased;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(17,24,32,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(17,24,32,.028) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.65),transparent 55%);z-index:-1}img{display:block;max-width:100%;height:auto}a{color:inherit}.skip{position:absolute;left:-999px;top:1rem;z-index:99;background:white;padding:.75rem 1rem;border-radius:999px}.skip:focus{left:1rem}.kicker,.micro-label{text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;font-weight:840;color:var(--accent-dark)}h1,h2,h3{margin:0 0 .7rem;line-height:.98;letter-spacing:-.045em;color:var(--ink)}h1{font-family:'IBM Plex Sans Condensed',Manrope,sans-serif;font-size:clamp(2.8rem,5.8vw,5.75rem);font-weight:700}h2{font-size:clamp(2rem,4vw,4.2rem)}h3{font-size:1.32rem;line-height:1.08}p{margin:.35rem 0 1rem;color:var(--muted)}section{max-width:var(--max);margin:0 auto;padding:clamp(54px,8vw,112px) var(--gutter)}.topbar{background:var(--ink);color:white;font-size:.82rem}.topbar-inner{max-width:var(--max);margin:auto;padding:.42rem var(--gutter);display:flex;gap:1rem;justify-content:center;align-items:center;flex-wrap:wrap}.topbar a{text-decoration:none}.topbar span{white-space:nowrap;color:rgba(255,255,255,.82)}.site-header{position:sticky;top:0;z-index:70;background:rgba(255,250,242,.88);backdrop-filter:blur(18px);border-bottom:1px solid rgba(17,24,32,.10)}.site-header.scrolled{box-shadow:0 12px 32px rgba(17,24,32,.08)}.header-inner{max-width:var(--max);margin:auto;padding:.55rem var(--gutter);display:grid;grid-template-columns:auto 1fr auto;gap:1rem;align-items:center}.logo{display:flex;align-items:center;width:178px;min-width:150px}.logo img{width:100%;height:auto}.nav{display:flex;justify-content:center;align-items:center;gap:.16rem}.nav-link{text-decoration:none;padding:.55rem .62rem;border-radius:999px;font-size:.86rem;font-weight:820;color:var(--ink-soft);white-space:nowrap;transition:background var(--t-fast) var(--ease),color var(--t-fast) var(--ease),transform var(--t-fast) var(--ease)}.nav-link:hover,.nav-link.active{background:#fff0db;color:var(--accent-dark);transform:translateY(-1px)}.header-actions{display:flex;gap:.45rem;align-items:center}.menu-toggle{display:none!important}.btn{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;text-decoration:none;border:1px solid transparent;border-radius:999px;padding:.82rem 1.08rem;font-weight:880;line-height:1;cursor:pointer;transition:transform var(--t-fast) var(--ease),box-shadow var(--t-fast) var(--ease),background var(--t-fast) var(--ease),border-color var(--t-fast) var(--ease)}.btn span{transition:transform var(--t-fast) var(--ease)}.btn:hover span{transform:translateX(3px)}.btn:hover{transform:translateY(-2px)}.btn-primary{background:var(--accent);color:white;box-shadow:0 14px 28px rgba(244,123,32,.24)}.btn-primary:hover{background:#e66d14}.btn-secondary{background:white;color:var(--ink);border-color:rgba(17,24,32,.16)}.btn-secondary:hover{border-color:var(--ink);box-shadow:var(--shadow-soft)}.btn-light{background:white;color:var(--ink)}.btn-quiet,.btn-ghost{background:transparent;border-color:rgba(17,24,32,.14);color:var(--ink)}.action-row{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-top:1.25rem}.action-row.compact{margin-top:0}.hero{max-width:calc(var(--max) + 70px);display:grid;grid-template-columns:minmax(0,.96fr) minmax(410px,1.05fr);gap:clamp(22px,4vw,54px);align-items:center;min-height:calc(100svh - 115px);padding-top:clamp(26px,5vw,70px);padding-bottom:clamp(34px,6vw,72px)}.hero-copy p{font-size:clamp(1.05rem,1.5vw,1.28rem);max-width:660px}.trust-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:.55rem;margin-top:1.2rem}.trust-strip span{border-left:3px solid var(--accent);padding:.55rem .65rem;background:rgba(255,255,255,.66);font-size:.82rem;color:var(--muted)}.trust-strip b{display:inline-block;color:var(--ink)}.trust-strip span{white-space:normal}.print-composition{min-height:570px;position:relative;isolation:isolate}.print-composition::before{content:"";position:absolute;inset:6% 4% 4% 10%;background:linear-gradient(145deg,var(--ink),#223448);border-radius:32px;box-shadow:var(--shadow-ink);transform:skewY(-2deg);z-index:-3}.cmy-layers i{position:absolute;inset:11% 8% 9% 12%;border:2px solid;border-radius:28px;mix-blend-mode:screen;opacity:.9;animation:alignLayer .72s var(--ease) both}.cmy-layers i:nth-child(1){border-color:var(--cyan);transform:translate(-18px,12px)}.cmy-layers i:nth-child(2){border-color:var(--magenta);animation-delay:.08s;transform:translate(16px,-10px)}.cmy-layers i:nth-child(3){border-color:var(--yellow);animation-delay:.16s;transform:translate(8px,18px)}@keyframes alignLayer{to{transform:translate(0,0)}}.product{position:absolute;margin:0;overflow:hidden;background:white;border:1px solid rgba(255,255,255,.22);box-shadow:0 16px 46px rgba(0,0,0,.24)}.product img{width:100%;height:100%;object-fit:cover}.product-shirt{left:5%;top:7%;width:48%;height:58%;border-radius:26px}.product-roll{right:0;top:0;width:46%;height:44%;border-radius:18px}.product-mug{right:11%;bottom:5%;width:50%;height:47%;border-radius:30px}.registration-mark{position:absolute;width:48px;height:48px;border:1px solid rgba(255,255,255,.55);border-radius:50%;z-index:3}.registration-mark::before,.registration-mark::after{content:"";position:absolute;background:rgba(255,255,255,.7)}.registration-mark::before{width:1px;height:64px;left:23px;top:-8px}.registration-mark::after{height:1px;width:64px;left:-8px;top:23px}.mark-a{left:0;bottom:20%}.mark-b{right:1%;top:53%}.section-head{max-width:770px;margin-bottom:1.7rem}.section-head p{font-size:1.04rem}.ink-band{background:var(--ink);color:white;border-radius:0;max-width:none;margin:0;padding:clamp(42px,6vw,72px) max(var(--gutter),calc((100vw - var(--max))/2));display:grid;grid-template-columns:1.25fr .95fr auto;align-items:center;gap:2rem;position:relative;overflow:hidden}.ink-band::after{content:"";position:absolute;inset:auto 0 0; height:8px;background:linear-gradient(90deg,var(--cyan),var(--magenta),var(--yellow),var(--accent))}.ink-band h2,.ink-band p{color:white}.ink-band p{color:rgba(255,255,255,.74)}.service-catalog{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.service-tile a{display:grid;grid-template-rows:220px 1fr;height:100%;background:white;text-decoration:none;border:1px solid var(--line);position:relative;overflow:hidden;box-shadow:0 8px 24px rgba(17,24,32,.055);transition:transform .22s var(--ease),box-shadow .22s var(--ease),border-color .22s var(--ease)}.service-tile:nth-child(even) a{margin-top:2.2rem}.service-tile figure{margin:0;overflow:hidden;background:#eee}.service-tile img{width:100%;height:100%;object-fit:cover;transition:transform .55s var(--ease)}.service-tile:hover img{transform:scale(1.045)}.service-tile a::before{content:"";position:absolute;top:0;left:0;width:44px;height:5px;background:var(--cyan);z-index:2}.service-tile[data-accent="magenta"] a::before{background:var(--magenta)}.service-tile[data-accent="yellow"] a::before{background:var(--yellow)}.service-tile[data-accent="ink"] a::before{background:var(--ink)}.tile-copy{padding:1.15rem}.inline-arrow{font-weight:880;color:var(--accent-dark)}.service-tile:hover a{transform:translateY(-5px);box-shadow:0 20px 44px rgba(17,24,32,.13)}.selected-work{display:grid;grid-template-columns:.72fr 1.28fr;gap:2rem;align-items:end}.mini-masonry{display:grid;grid-template-columns:1.1fr .85fr;grid-auto-rows:190px;gap:.8rem}.mini-masonry figure{margin:0;position:relative;overflow:hidden;background:var(--ink)}.mini-masonry figure:first-child{grid-row:span 2}.mini-masonry img{width:100%;height:100%;object-fit:cover}.mini-masonry figcaption{position:absolute;left:.75rem;bottom:.75rem;color:white;background:rgba(17,24,32,.72);padding:.35rem .55rem;font-weight:820}.final-panel{max-width:calc(var(--max) - 70px);display:grid;grid-template-columns:1fr auto;align-items:center;gap:1.2rem;background:linear-gradient(135deg,var(--ink),#223044);color:white;margin-bottom:clamp(42px,7vw,86px);border-radius:2px;padding:clamp(34px,5vw,58px)}.final-panel h2,.final-panel p{color:white}.final-panel p{color:rgba(255,255,255,.74)}.final-panel-quiet{background:white;color:var(--ink);border:1px solid var(--line)}.final-panel-quiet h2{color:var(--ink)}.final-panel-quiet p{color:var(--muted)}.page-hero,.contact-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,.72fr);gap:2rem;align-items:center;padding-top:clamp(42px,7vw,84px)}.page-hero-dark{background:var(--ink);max-width:none;color:white;padding-left:max(var(--gutter),calc((100vw - var(--max))/2));padding-right:max(var(--gutter),calc((100vw - var(--max))/2));overflow:hidden}.page-hero-dark h1,.page-hero-dark p{color:white}.page-hero-dark p{color:rgba(255,255,255,.76)}.page-hero-media{margin:0;min-height:420px;overflow:hidden;position:relative;background:#ddd}.page-hero-media::after{content:"";position:absolute;inset:12px;border:1px solid rgba(255,255,255,.38);pointer-events:none}.page-hero-media img{width:100%;height:100%;min-height:420px;object-fit:cover}.production-strip{display:grid;grid-template-columns:1.05fr .95fr;gap:2rem;align-items:center}.production-strip figure{margin:0;overflow:hidden;max-height:440px;border-radius:0;background:#eee}.production-strip img{width:100%;height:100%;object-fit:cover}.process-roll{display:grid;grid-template-columns:repeat(4,1fr);gap:0;position:relative;background:white;border:1px solid var(--line);overflow:hidden}.process-roll::before{content:"";position:absolute;left:0;right:0;top:0;height:8px;background:linear-gradient(90deg,var(--cyan),var(--magenta),var(--yellow),var(--accent));transform-origin:left;animation:rollReveal .72s var(--ease) both}@keyframes rollReveal{from{transform:scaleX(0)}to{transform:scaleX(1)}}.process-step{padding:1.4rem;border-right:1px solid var(--line)}.process-step:last-child{border-right:0}.process-step span{font-family:'IBM Plex Sans Condensed';font-size:2rem;font-weight:700;color:var(--accent)}.info-cluster{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.info-cluster article{background:white;border:1px solid var(--line);padding:1.4rem}.faq-list{display:grid;gap:.7rem}.faq-list details{background:white;border:1px solid var(--line);padding:1rem 1.15rem}.faq-list summary{font-weight:880;cursor:pointer}.form-section{scroll-margin-top:calc(var(--header-h) + 36px)}.quote-form{background:white;border:1px solid var(--line);padding:clamp(1rem,3vw,1.8rem);box-shadow:var(--shadow-soft)}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}.quote-form label{display:grid;gap:.42rem;font-weight:780;color:var(--ink)}.quote-form input,.quote-form select,.quote-form textarea{width:100%;min-height:46px;border:1px solid #d7dbe0;border-radius:12px;padding:.78rem .85rem;font:inherit;background:#fff;color:var(--text)}.quote-form textarea{resize:vertical}.quote-form .wide{grid-column:1/-1}.form-note{font-size:.88rem;background:var(--paper-2);border-left:3px solid var(--accent);padding:.7rem .85rem}.product-detail-grid{display:grid;grid-template-columns:1.1fr .9fr 1fr;gap:1rem}.product-detail-grid figure{margin:0;overflow:hidden;min-height:360px}.product-detail-grid figure:nth-child(2){margin-top:3rem}.product-detail-grid img{width:100%;height:100%;object-fit:cover}.portfolio-section{padding-top:40px}.filter-bar{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.3rem}.filter-btn{min-height:42px;border:1px solid var(--line);background:white;padding:.62rem .9rem;border-radius:999px;font-weight:820;cursor:pointer}.filter-btn.active,.filter-btn:hover{background:var(--ink);color:white;border-color:var(--ink)}.portfolio-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:185px;gap:.9rem}.work-card{position:relative;overflow:hidden;background:var(--ink);grid-row:span 2}.work-card.wide{grid-column:span 2}.work-card.tall{grid-row:span 3}.work-card.mockup{outline:1px dashed rgba(236,41,123,.45);outline-offset:-8px}.work-open{display:block;width:100%;height:100%;padding:0;border:0;background:transparent;color:white;text-align:left;cursor:pointer}.work-open img{width:100%;height:100%;object-fit:cover;transition:transform .45s var(--ease),filter .25s var(--ease)}.work-card:hover img,.work-card:focus-within img{transform:scale(1.045);filter:saturate(1.08)}.work-meta{position:absolute;inset:auto .7rem 2.9rem .7rem;background:rgba(17,24,32,.72);backdrop-filter:blur(8px);padding:.65rem;color:white}.work-meta b,.work-meta small{display:block}.work-meta small{opacity:.8}.work-cta{position:absolute;left:.7rem;right:.7rem;bottom:.7rem;text-decoration:none;background:white;color:var(--ink);font-weight:860;padding:.5rem .65rem;text-align:center}.lightbox{position:fixed;inset:0;background:rgba(17,24,32,.92);z-index:100;display:grid;place-items:center;padding:2rem}.lightbox[hidden]{display:none}.lightbox figure{margin:0;max-width:min(980px,82vw);max-height:84vh}.lightbox img{max-height:78vh;width:auto;margin:auto}.lightbox figcaption{color:white;text-align:center;margin-top:.8rem}.lightbox button{position:absolute;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:white;border-radius:999px;width:46px;height:46px;font-size:2rem;cursor:pointer}.lightbox-close{top:1rem;right:1rem}.lightbox-prev{left:1rem}.lightbox-next{right:1rem}.contact-hero{align-items:start}.contact-methods{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:1.2rem}.contact-methods a{display:grid;text-decoration:none;background:white;border:1px solid var(--line);padding:1rem;min-height:86px}.contact-methods b{color:var(--ink)}.contact-methods span{color:var(--muted);font-size:.88rem}.shop-card{background:var(--ink);color:white;padding:1.4rem}.shop-card h2,.shop-card h3,.shop-card p{color:white}.shop-card p,.shop-card .small{color:rgba(255,255,255,.72)}.hours-list{list-style:none;margin:1rem 0 0;padding:0;display:grid;gap:.35rem}.hours-list li{display:grid;grid-template-columns:110px 1fr;gap:.75rem;align-items:start;border-bottom:1px solid var(--line-dark);padding:.4rem 0}.hours-list span{color:rgba(255,255,255,.72)}.about-collage{display:grid;grid-template-columns:1fr .9fr .8fr;gap:1rem;align-items:center}.about-collage figure{margin:0;overflow:hidden;min-height:360px}.about-collage img{width:100%;height:100%;object-fit:cover}.legal-page{max-width:820px;background:white;margin-top:clamp(36px,6vw,80px);margin-bottom:clamp(36px,6vw,80px);padding:clamp(34px,6vw,70px);border:1px solid var(--line)}.site-footer{background:var(--ink);color:white;position:relative;overflow:hidden}.site-footer::before{content:"";position:absolute;left:0;right:0;top:0;height:9px;background:linear-gradient(90deg,var(--cyan),var(--magenta),var(--yellow),var(--accent))}.footer-inner{max-width:var(--max);margin:auto;padding:clamp(42px,6vw,70px) var(--gutter) 1.4rem;display:grid;grid-template-columns:1.2fr .85fr .75fr .65fr;gap:1.4rem}.footer-logo{max-width:185px;background:white;padding:.55rem;margin-bottom:1rem}.footer-inner h2,.footer-inner h3,.footer-inner p{color:white}.footer-inner p,.footer-inner a,.footer-inner li{color:rgba(255,255,255,.75)}.footer-inner ul{list-style:none;margin:0;padding:0;display:grid;gap:.34rem}.footer-inner a{text-decoration:none}.footer-inner a:hover{color:white}.social-row{display:flex;gap:.5rem;margin-top:.8rem}.social-row a{width:36px;height:36px;border:1px solid var(--line-dark);display:grid;place-items:center;border-radius:50%;font-weight:900}.footer-bottom{max-width:var(--max);margin:auto;padding:1rem var(--gutter);border-top:1px solid var(--line-dark);display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;font-size:.85rem;color:rgba(255,255,255,.65)}.reveal{opacity:0;transform:translateY(18px);transition:opacity var(--t-med) var(--ease),transform var(--t-med) var(--ease)}.reveal.visible{opacity:1;transform:none}
@media(max-width:1120px){.header-inner{grid-template-columns:auto auto}.nav{grid-column:1/-1;justify-content:flex-start;overflow:auto;padding-bottom:.2rem}.header-actions{justify-self:end}.hero{grid-template-columns:1fr;min-height:0}.print-composition{min-height:560px;max-width:760px;width:100%;justify-self:center}.service-catalog{grid-template-columns:repeat(2,1fr)}.portfolio-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:820px){:root{--header-h:62px}.topbar-inner{justify-content:flex-start;overflow:auto;flex-wrap:nowrap}.topbar span:nth-child(2){display:none}.header-inner{display:flex;min-height:62px}.logo{width:142px;min-width:142px}.header-actions{display:none}.menu-toggle{display:inline-flex!important;margin-left:auto}.nav{position:absolute;top:100%;left:var(--gutter);right:var(--gutter);display:grid;gap:.25rem;background:white;border:1px solid var(--line);padding:.65rem;border-radius:18px;box-shadow:var(--shadow-soft);transform-origin:top;transform:scaleY(.96) translateY(-6px);opacity:0;pointer-events:none;transition:opacity .18s var(--ease),transform .18s var(--ease);overflow:visible}.nav.open{opacity:1;pointer-events:auto;transform:none}.nav-link{padding:.85rem 1rem}.hero,.page-hero,.contact-hero,.production-strip,.selected-work,.about-collage{grid-template-columns:1fr}.hero{padding-top:32px}.hero h1,.page-hero h1,.contact-hero h1{font-size:clamp(2.35rem,14vw,4.8rem);line-height:1.02}.trust-strip{grid-template-columns:1fr}.print-composition{min-height:455px}.product-shirt{width:56%;height:55%;left:0}.product-roll{width:49%;height:38%;right:0}.product-mug{width:58%;height:41%;right:4%;bottom:4%}.ink-band{grid-template-columns:1fr}.service-catalog{grid-template-columns:1fr}.service-tile:nth-child(even) a{margin-top:0}.service-tile a{grid-template-rows:235px 1fr}.info-cluster,.process-roll,.form-grid,.contact-methods{grid-template-columns:1fr}.process-step{border-right:0;border-bottom:1px solid var(--line)}.product-detail-grid{grid-template-columns:1fr}.product-detail-grid figure:nth-child(2){margin-top:0}.portfolio-grid{grid-template-columns:1fr 1fr;grid-auto-rows:170px}.work-card.wide{grid-column:span 2}.final-panel{grid-template-columns:1fr;border-radius:0}.footer-inner{grid-template-columns:1fr 1fr}.page-hero-media,.page-hero-media img{min-height:360px}.hours-list li{grid-template-columns:92px 1fr;gap:.5rem}.btn{width:auto}.action-row .btn{flex:1 1 180px}.quote-form .btn{width:100%}}
@media(max-width:460px){:root{--gutter:15px}.btn{width:100%;padding:.82rem .9rem}.topbar{display:none}.hero h1,.page-hero h1,.contact-hero h1{font-size:2.45rem}.hero-copy p{font-size:1rem}.print-composition{min-height:385px}.service-tile a{grid-template-rows:210px 1fr}.portfolio-grid{grid-template-columns:1fr;grid-auto-rows:260px}.work-card.wide{grid-column:auto}.work-card.tall{grid-row:span 1}.footer-inner{grid-template-columns:1fr}.footer-bottom{display:grid}.hours-list li{grid-template-columns:1fr;gap:.05rem}.contact-methods{grid-template-columns:1fr}.legal-page{padding:28px 18px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.reveal{opacity:1;transform:none}}
'''

CSS += r'''
/* v2 visual/motion upgrade: immediate readability, print-inspired depth */
.section-block:nth-of-type(odd), .faq-section{background:linear-gradient(135deg,rgba(255,255,255,.70),rgba(247,198,0,.07));border-top:1px solid rgba(17,24,32,.045);border-bottom:1px solid rgba(17,24,32,.045)}
.section-block:nth-of-type(even){background:radial-gradient(circle at 8% 12%,rgba(0,168,232,.10),transparent 28%),radial-gradient(circle at 92% 0,rgba(236,41,123,.08),transparent 28%)}
.hero{background:radial-gradient(circle at 68% 20%,rgba(0,168,232,.11),transparent 24%),radial-gradient(circle at 90% 60%,rgba(244,123,32,.10),transparent 25%)}
.reveal{opacity:1;transform:translateY(7px);transition:opacity 240ms var(--ease),transform 300ms var(--ease)}
.reveal.visible{opacity:1;transform:none}.reveal:not(.visible){opacity:.96}
.print-composition{perspective:1200px;animation:heroBreathe 5.8s ease-in-out infinite alternate}.product{transition:transform 220ms var(--ease),box-shadow 220ms var(--ease),filter 220ms var(--ease)}.product:hover{transform:translateY(-6px) rotate(.35deg);box-shadow:0 24px 70px rgba(17,24,32,.30);filter:saturate(1.06)}.product-shirt{animation:productIn .55s var(--ease) both .05s, floatA 6.5s ease-in-out infinite alternate .8s}.product-roll{animation:productIn .55s var(--ease) both .16s, floatB 7s ease-in-out infinite alternate .9s}.product-mug{animation:productIn .55s var(--ease) both .27s, floatC 6s ease-in-out infinite alternate .9s}.registration-mark{animation:markPulse 3s ease-in-out infinite}.cmy-layers i{animation:alignLayer .42s var(--ease) both, layerPulse 4.6s ease-in-out infinite alternate .7s}
@keyframes productIn{from{opacity:.72;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}@keyframes floatA{to{transform:translate3d(-4px,5px,18px)}}@keyframes floatB{to{transform:translate3d(5px,-5px,24px)}}@keyframes floatC{to{transform:translate3d(2px,6px,30px)}}@keyframes heroBreathe{to{filter:saturate(1.06) contrast(1.02)}}@keyframes layerPulse{to{opacity:.72}}@keyframes markPulse{50%{opacity:.52;transform:scale(.96)}}
.btn{position:relative;overflow:hidden}.btn::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);transform:translateX(-120%);transition:transform 420ms var(--ease)}.btn:hover::before{transform:translateX(120%)}.service-tile a,.info-cluster article,.quote-form,.contact-methods a{transition:transform 200ms var(--ease),box-shadow 200ms var(--ease),border-color 200ms var(--ease),background 200ms var(--ease)}.info-cluster article:hover,.contact-methods a:hover{transform:translateY(-4px);box-shadow:0 18px 42px rgba(17,24,32,.10);border-color:rgba(244,123,32,.38)}.product-detail-grid{align-items:start;padding-top:clamp(34px,5vw,72px);padding-bottom:clamp(28px,4vw,54px)}.product-detail-grid figure{box-shadow:0 14px 44px rgba(17,24,32,.12);transition:transform 240ms var(--ease),box-shadow 240ms var(--ease)}.product-detail-grid figure:hover{transform:translateY(-6px) rotate(.25deg);box-shadow:0 24px 62px rgba(17,24,32,.18)}
.portfolio-grid{transition:opacity 180ms var(--ease)}.work-card{transition:opacity 180ms var(--ease),transform 220ms var(--ease),box-shadow 220ms var(--ease)}.work-card:hover{transform:translateY(-5px);box-shadow:0 22px 60px rgba(17,24,32,.22)}.filter-btn{transition:transform 160ms var(--ease),background 160ms var(--ease),color 160ms var(--ease),border-color 160ms var(--ease)}.filter-btn:hover{transform:translateY(-2px)}.lightbox{animation:lbIn 180ms var(--ease)}@keyframes lbIn{from{opacity:.4}to{opacity:1}}
@media(max-width:820px){.hero{background:radial-gradient(circle at 70% 86%,rgba(0,168,232,.13),transparent 32%),radial-gradient(circle at 10% 20%,rgba(244,123,32,.08),transparent 28%)}.print-composition{animation:none}.product{box-shadow:0 14px 40px rgba(17,24,32,.22)}}
@media(prefers-reduced-motion:reduce){.print-composition,.product,.registration-mark,.cmy-layers i{animation:none!important}.reveal,.reveal:not(.visible){opacity:1;transform:none}}
'''

JS = r'''
const header=document.querySelector('.site-header');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>8),{passive:true});
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');
toggle?.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}));
if(!reduced && 'IntersectionObserver' in window){
 const io=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -24px 0px'});
 document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=Math.min((i%3)*40,80)+'ms';io.observe(el)});
}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'))}
const buttons=[...document.querySelectorAll('.filter-btn')];const cards=[...document.querySelectorAll('.work-card')];
buttons.forEach(btn=>btn.addEventListener('click',()=>{buttons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;cards.forEach(card=>{const show=f==='Όλα'||card.dataset.category===f;card.style.display=show?'block':'none';});}));
const lb=document.getElementById('lightbox');let lbIndex=0;let lastFocus=null;
function visibleOpeners(){return [...document.querySelectorAll('.work-card')].filter(c=>c.style.display!=='none').map(c=>c.querySelector('.work-open'))}
function show(i){const ops=visibleOpeners(); if(!ops.length)return; lbIndex=(i+ops.length)%ops.length; const b=ops[lbIndex]; lb.querySelector('img').src=b.dataset.src; lb.querySelector('img').alt=b.dataset.title; lb.querySelector('figcaption').textContent=b.dataset.title+' — '+b.dataset.note; lb.hidden=false; document.body.style.overflow='hidden'; lb.querySelector('.lightbox-close').focus();}
document.querySelectorAll('.work-open').forEach((b,i)=>b.addEventListener('click',()=>{lastFocus=b;show(visibleOpeners().indexOf(b));}));
function closeLb(){lb.hidden=true;document.body.style.overflow='';lastFocus?.focus();}
lb?.querySelector('.lightbox-close')?.addEventListener('click',closeLb);lb?.querySelector('.lightbox-prev')?.addEventListener('click',()=>show(lbIndex-1));lb?.querySelector('.lightbox-next')?.addEventListener('click',()=>show(lbIndex+1));
lb?.addEventListener('click',e=>{if(e.target===lb)closeLb()});
document.addEventListener('keydown',e=>{if(!lb||lb.hidden)return; if(e.key==='Escape')closeLb(); if(e.key==='ArrowLeft')show(lbIndex-1); if(e.key==='ArrowRight')show(lbIndex+1);});
if(!reduced){
 const hero=document.querySelector('.print-composition');
 hero?.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5; hero.querySelectorAll('.product').forEach((el,i)=>{const depth=(i+1)*7; el.style.translate=(x*depth)+'px '+(y*depth)+'px';});});
 hero?.addEventListener('pointerleave',()=>hero.querySelectorAll('.product').forEach(el=>el.style.translate='0 0'));
 const animateCounter=(el)=>{const target=parseFloat(el.dataset.count||el.textContent.replace(',','.')); const dec=parseInt(el.dataset.decimals||'0',10); let start=null; const dur=650; function step(ts){start??=ts; const p=Math.min((ts-start)/dur,1); const eased=1-Math.pow(1-p,3); const value=target*eased; el.textContent=value.toLocaleString('el-GR',{minimumFractionDigits:dec,maximumFractionDigits:dec}); if(p<1) requestAnimationFrame(step);} requestAnimationFrame(step);};
 if('IntersectionObserver' in window){const cio=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){animateCounter(e.target);cio.unobserve(e.target)}}),{threshold:.5}); document.querySelectorAll('.counter').forEach(c=>cio.observe(c));}else document.querySelectorAll('.counter').forEach(animateCounter);
}
'''

def page_html(p):
    current = current_path(p['path'])
    canon = SITE + current
    schema = {'@context':'https://schema.org','@type':'LocalBusiness','name':'Adapt Print','url':SITE+'/','telephone':['+302112181704','+306982848330'],'email':CONTACT['email'],'address':{'@type':'PostalAddress','streetAddress':'Μακεδονίας 81','addressLocality':'Πειραιάς','postalCode':'18545','addressCountry':'GR'},'sameAs':['https://www.instagram.com/adaptprint2','https://www.tiktok.com/@adaptprint']}
    footer_services = ''.join(f'<li><a href="{u}">{l}</a></li>' for u,l in NAV_ITEMS[:4])
    return f'''<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(p['title'])}</title><meta name="description" content="{esc(p['desc'])}"><link rel="canonical" href="{canon}"><meta property="og:locale" content="el_GR"><meta property="og:type" content="website"><meta property="og:site_name" content="Adapt Print"><meta property="og:title" content="{esc(p['title'])}"><meta property="og:description" content="{esc(p['desc'])}"><meta property="og:url" content="{canon}"><meta property="og:image" content="{img['og']}"><meta name="twitter:card" content="summary_large_image"><link rel="preload" as="image" href="/assets/images/adaptprint-logo-header-transparent.png"><link rel="icon" type="image/png" href="/assets/images/favicon.png"><link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png"><link rel="stylesheet" href="/assets/css/styles.css"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head><body><a class="skip" href="#main">Μετάβαση στο περιεχόμενο</a><div class="topbar"><div class="topbar-inner"><span>📞 <a href="{CONTACT['phone1_href']}">{CONTACT['phone1_label']}</a></span><span>📍 {CONTACT['address']}</span><span>DTF με το μέτρο · Εκτυπώσεις · Δώρα</span></div></div><header class="site-header"><div class="header-inner"><a class="logo" href="/" aria-label="Adapt Print - Αρχική"><img src="{img['logo']}" alt="Adapt Print"></a><button class="menu-toggle btn btn-ghost" aria-expanded="false" aria-controls="nav" type="button">Μενού</button><nav id="nav" class="nav" aria-label="Κύρια πλοήγηση">{nav(current)}</nav><div class="header-actions"><a class="btn btn-ghost" href="{CONTACT['phone1_href']}">Καλέστε</a><a class="btn btn-primary" href="/contact-us/#quote">Προσφορά</a></div></div></header><main id="main">{p['body']}{final_cta(True) if p['legal'] else ''}</main><footer class="site-footer"><div class="footer-inner"><div><img class="footer-logo" src="{img['logo']}" alt="Adapt Print"><h2>Adapt Print</h2><p>DTF με το μέτρο, ένδυση, κούπες, δώρα και διαφημιστικά είδη στον Πειραιά.</p><div class="social-row"><a aria-label="Instagram Adapt Print" href="https://www.instagram.com/adaptprint2" target="_blank" rel="noopener noreferrer">IG</a><a aria-label="TikTok Adapt Print" href="https://www.tiktok.com/@adaptprint" target="_blank" rel="noopener noreferrer">TT</a></div></div><div><h3>Υπηρεσίες</h3><ul>{footer_services}</ul></div><div><h3>Επικοινωνία</h3><ul><li><a href="{CONTACT['phone1_href']}">{CONTACT['phone1_label']}</a></li><li><a href="{CONTACT['phone2_href']}">{CONTACT['phone2_label']}</a></li><li><a href="{CONTACT['whatsapp']}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li><li><a href="{CONTACT['email_href']}">{CONTACT['email']}</a></li><li><a href="{CONTACT['maps']}" target="_blank" rel="noopener noreferrer">{CONTACT['address']}</a></li></ul></div><div><h3>Χρήσιμα</h3><ul><li><a href="/contact-us/#quote">Ζητήστε προσφορά</a></li><li><a href="/terms-and-conditions/">Όροι χρήσης</a></li><li><a href="/privacy-policy/">Απόρρητο</a></li></ul></div></div><div class="footer-bottom"><span>© Adapt Print</span><span></span></div></footer><script src="/assets/js/main.js" defer></script></body></html>'''

(ROOT/'assets/css').mkdir(exist_ok=True, parents=True)
(ROOT/'assets/js').mkdir(exist_ok=True, parents=True)
(ROOT/'assets/css/styles.css').write_text(CSS, encoding='utf-8')
(ROOT/'assets/js/main.js').write_text(JS, encoding='utf-8')
for p in pages:
    out = ROOT / p['path']
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page_html(p), encoding='utf-8')
urls = [SITE + current_path(p['path']) for p in pages]
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{u}</loc><priority>{next(p["priority"] for p in pages if SITE + current_path(p["path"]) == u)}</priority></url>\n' for u in urls) + '</urlset>\n', encoding='utf-8')
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://adaptprint.gr/sitemap.xml\n', encoding='utf-8')
missing_notes = '''# Adapt Print visual redesign notes\n\n## Missing / needs confirmation before live production\n- DTF facts: printable width, price per meter, minimum order, VAT, production time, cutoff hour, shipping rules, accepted file formats.\n- Opening hours confirmation: current local note says Google Maps may differ.\n- Legal copy: Terms and Privacy remain placeholders requiring owner/legal approval.\n- Form backend: preview uses mailto; no server-side success message is shown.\n- More real shop/people/work photos would strengthen About and production pages. Existing real storefront image is used; no invented people/facility photos were added.\n- Portfolio needs confirmed project details/categories if the business wants richer captions; current labels stay generic to avoid inventing clients/outcomes.\n'''
(ROOT/'visual-redesign-notes.md').write_text(missing_notes, encoding='utf-8')
print(json.dumps({'ok': True, 'pages': len(pages), 'html': [p['path'] for p in pages]}, ensure_ascii=False, indent=2))
