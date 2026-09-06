const fs = require('fs');
const path = require('path');

function page(route) {
  return fs.readFileSync(path.join(__dirname, route, 'index.html'), 'utf8');
}

function assertContains(source, expected, label) {
  if (!source.includes(expected)) throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
}

function assertNotContains(source, unwanted, label) {
  if (source.includes(unwanted)) throw new Error(`${label}: unexpectedly contains ${JSON.stringify(unwanted)}`);
}

const privacy = page('privacy-policy');
const terms = page('terms-and-conditions');

[
  ['Υπεύθυνος επεξεργασίας: Ευτυχία Κοκολογιαννάκη', 'privacy controller identity'],
  ['Αιτήματα προσφοράς που δεν καταλήγουν σε παραγγελία: έως 12 μήνες', 'quote retention'],
  ['Αρχεία μακέτας για προσφορά που δεν καταλήγει σε παραγγελία: έως 6 μήνες', 'unconverted artwork retention'],
  ['Εγκεκριμένες μακέτες και σχετικά λειτουργικά αρχεία ολοκληρωμένης παραγγελίας: έως 24 μήνες από την παράδοση', 'completed artwork retention'],
  ['Λογιστικά στοιχεία και παραστατικά: για όσο απαιτεί η ισχύουσα φορολογική ή άλλη νομοθεσία', 'accounting retention'],
  ['Προσωπικά δεδομένα δεν χρησιμοποιούνται για προωθητική επικοινωνία χωρίς την κατάλληλη ενημέρωση και, όπου απαιτείται, συγκατάθεση.', 'marketing safeguard'],
  ['Google Maps φορτώνει αυτόματα', 'maps notice'],
  ['Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα', 'supervisory authority'],
].forEach(([text, label]) => assertContains(privacy, text, label));

[
  ['Η Adapt Print λειτουργεί με διακριτικό τίτλο «Adapt Print» και πλήρη επωνυμία «Ευτυχία Κοκολογιαννάκη»', 'merchant identity'],
  ['Η αίτηση προσφοράς δεν αποτελεί αποδοχή παραγγελίας.', 'quote distinction'],
  ['Η παραγωγή ξεκινά μόνο μετά από έγκριση της μακέτας και, όπου απαιτείται, του δείγματος.', 'approval flow'],
  ['προκαταβολή 50% του συνολικού ποσού', 'deposit'],
  ['Η εξόφληση γίνεται πριν από την παράδοση ή την αποστολή.', 'balance timing'],
  ['3–5 εργάσιμες ημέρες', 'dispatch estimate'],
  ['μέσω Speedex, Box Now ή μεταφορικής εταιρείας', 'carriers'],
  ['Τα μεταφορικά επιβαρύνουν τον πελάτη', 'shipping allocation'],
  ['εντός 1 ημέρας από την παραλαβή', 'visible issue notice'],
  ['δεν περιορίζει τυχόν υποχρεωτικά δικαιώματα του καταναλωτή', 'statutory rights safeguard'],
  ['Ο πελάτης δηλώνει ότι διαθέτει τα απαραίτητα δικαιώματα χρήσης', 'customer rights warranty'],
].forEach(([text, label]) => assertContains(terms, text, label));

assertNotContains(privacy, 'Ο χρόνος διατήρησης των δεδομένων δεν έχει καθοριστεί', 'privacy placeholder');
assertNotContains(terms, 'Καθυστερημένες πληρωμές ενδέχεται να επιφέρουν επιπλέον χρεώσεις.', 'invented late fee');

// Bank details belong only in private order-confirmation channels, never public legal pages.
const publicLegalText = `${privacy}\n${terms}`;
if (/\bGR\d{2}(?:\s?\d{4}){5,7}\b/i.test(publicLegalText)) throw new Error('public legal page contains a Greek IBAN');
if (/\b(?:SWIFT|BIC)\s*[:：]/i.test(publicLegalText)) throw new Error('public legal page contains a bank-routing label');
if (/\b(?:IBAN|αριθμός\s+λογαριασμού)\s*[:：]/i.test(publicLegalText)) throw new Error('public legal page contains a bank-account label');
console.log('PASS legal policy and terms assertions');
