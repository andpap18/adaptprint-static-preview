"""Contact-only visual contract and immutable baseline parity. No network writes."""
from pathlib import Path
import re
import subprocess
import unittest
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
BASE = '19549e9'

class ContactRefinement(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / 'contact-us/index.html').read_text(encoding='utf8')
        self.page = BeautifulSoup(self.html, 'html.parser')
        self.old_html = subprocess.check_output(['git', 'show', BASE + ':contact-us/index.html'], cwd=ROOT).decode('utf8')
        self.old = BeautifulSoup(self.old_html, 'html.parser')

    def test_image_led_introduction_replaces_empty_head(self):
        hero = self.page.select_one('.contact-intro')
        self.assertIsNotNone(hero, 'Missing image-led contact introduction')
        self.assertIsNotNone(hero.select_one('h1'))
        self.assertIsNotNone(hero.select_one('.contact-methods'))
        image = hero.select_one('img')
        self.assertIn('adapt-print-katastima-peiraias.webp', image['src'])
        self.assertEqual(image.get('loading'), 'eager')
        self.assertEqual(image.get('fetchpriority'), 'high')
        self.assertEqual(len(self.page.select('main img')), 1)
        self.assertIsNone(self.page.select_one('.page-head'))
        self.assertIsNotNone(self.page.select_one('link[href$="contact-refinement.css"]'))

    def test_address_and_full_hours_share_a_photo_free_card(self):
        card = self.page.select_one('.contact-visit-card')
        self.assertIsNotNone(card, 'Missing full address and opening-hours card')
        self.assertIn('Μακεδονίας 81, Πειραιάς 18545', card.get_text())
        self.assertEqual(len(card.select('.hours-list li')), 7)
        self.assertIsNone(card.select_one('img'))
        self.assertIsNotNone(card.parent.select_one('.shop-map'))

    def test_quote_is_separate_light_panel(self):
        panel = self.page.select_one('.contact-quote')
        self.assertIsNotNone(panel, 'Missing light quote boundary')
        self.assertIsNotNone(panel.select_one('form#quote'))
        self.assertNotIn('final-panel', panel.get('class', []))

    def test_contact_actions_have_accessible_decorative_icons(self):
        icons = self.page.select('.contact-methods svg[aria-hidden="true"]')
        self.assertEqual(len(icons), 3)
        old_links = [a.get('href') for a in self.old.select('.contact-methods a')]
        new_links = [a.get('href') for a in self.page.select('.contact-methods a')]
        self.assertTrue(all(href in new_links for href in old_links))
        mobile = self.page.select_one('.contact-methods a.secondary-phone')
        self.assertIsNotNone(mobile, 'Mobile number needs its existing verified telephone link')
        self.assertIn(mobile['href'], [a.get('href') for a in self.old.select('footer a')])

    def test_existing_data_and_shared_components_are_immutable(self):
        for selector in ['title', 'meta[name="description"]', 'link[rel="canonical"]', 'script[type="application/ld+json"]', '.site-header', '.site-footer', 'form', '.hours-list', '.map-embed']:
            self.assertEqual(str(self.page.select_one(selector)), str(self.old.select_one(selector)), selector)
        words = lambda p: sorted(p.select_one('main').stripped_strings)
        self.assertEqual(words(self.page), words(self.old), 'Preserve all existing visible text')
        for tag in self.old.head.find_all(['meta', 'script']):
            self.assertIn(str(tag), str(self.page.head))

if __name__ == '__main__':
    unittest.main(verbosity=2)
