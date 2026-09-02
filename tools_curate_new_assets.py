from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).parent
SRC = Path(r'C:/Users/andpa/Desktop/_ORGANIZED/ADAPT_PRINT/wetransfer_image00001-jpeg_2026-09-01_2141')
DEST = ROOT / 'assets' / 'images' / 'client-new'
DEST.mkdir(parents=True, exist_ok=True)

# Curated real-photo set from the client's 69 new photos.
# Important: the batch does not show a clear paper-roll/60cm photo, so roll-section imagery stays on existing roll-production assets.
SELECTIONS = [
    # DTF / apparel proof
    ('image00001.jpeg','dtf-stampa-se-mplouzaki-pragmatiko-deigma.webp','dtf_apparel'),
    ('image00002.jpeg','dtf-ektyposi-se-rouxo-leptomereia.webp','dtf_apparel'),
    ('image00004.jpeg','epaggelmatiki-endysi-me-logo-dtf.webp','dtf_apparel'),
    ('image00006.jpeg','gileko-ergasias-me-logo-dtf.webp','dtf_apparel'),
    ('image00009.jpeg','dtf-efarmogi-se-yfasma-closeup.webp','dtf_apparel'),
    ('image00025.jpeg','mplouzakia-syllogou-dtf-paragogi.webp','dtf_apparel'),
    ('image00031.jpeg','gileka-asfaleias-me-ektyposi.webp','dtf_apparel'),
    ('image00059.jpeg','maziki-paragogi-endysis-b2b.webp','dtf_apparel'),

    # UV / promotional objects proof
    ('image00035.jpeg','stylo-me-logo-uv-ektyposi.webp','uv_promo'),
    ('image00039.jpeg','anaptires-me-logo-uv-ektyposi.webp','uv_promo'),
    ('image00022.jpeg','souber-me-anaglyfi-uv-ektyposi.webp','uv_promo'),
    ('image00018.jpeg','notebook-etairiko-doro-me-logo.webp','uv_promo'),
    ('image00047.jpeg','lanyards-me-logo-diafimistika.webp','uv_promo'),
    ('image00056.jpeg','omprela-me-logo-diafimistiko-eidos.webp','uv_promo'),
    ('image00067.jpeg','kapela-me-logo-diafimistiko-eidos.webp','uv_promo'),

    # Sublimation / mugs / bottles / textiles
    ('image00050.jpeg','koupa-sublimation-me-fotografia.webp','sublimation'),
    ('image00042.jpeg','koupes-sublimation-pragmatika-deigmata.webp','sublimation'),
    ('image00062.jpeg','metalliko-leyko-mpoukali-sublimation.webp','sublimation'),
    ('image00055.jpeg','set-koupes-sublimation.webp','sublimation'),
    ('image00028.jpeg','sublimation-se-polyesteriko-yfasma.webp','sublimation'),
    ('image00026.jpeg','koupa-kai-doro-sublimation-detail.webp','sublimation'),

    # Production / B2B proof, not claimed as paper roll
    ('image00060.jpeg','maziki-paragogi-diafimistikon-eidon.webp','production'),
    ('image00065.jpeg','b2b-lanyards-se-posotita.webp','production'),
    ('image00068.jpeg','lanyards-paragogi-xondrikis.webp','production'),
]

def export_webp(src: Path, dst: Path, max_side=1400):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((round(w*scale), round(h*scale)), Image.Resampling.LANCZOS)
    im.save(dst, 'WEBP', quality=82, method=6)
    return {'src': src.name, 'dest': str(dst.relative_to(ROOT)).replace('\\','/'), 'width': im.width, 'height': im.height, 'bytes': dst.stat().st_size}

manifest=[]; missing=[]
for filename, outname, category in SELECTIONS:
    sp = SRC / filename
    if not sp.exists():
        missing.append(filename); continue
    rec = export_webp(sp, DEST / outname); rec['category']=category; manifest.append(rec)
(DEST / 'manifest.json').write_text(json.dumps({'source': str(SRC), 'count': len(manifest), 'missing': missing, 'note':'No exact paper-roll/60cm photo found in reviewed batch; wholesale roll imagery should use existing roll-production assets until client sends a specific roll photo.', 'assets': manifest}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'exported': len(manifest), 'missing': missing, 'dest': str(DEST)}, ensure_ascii=False, indent=2))
