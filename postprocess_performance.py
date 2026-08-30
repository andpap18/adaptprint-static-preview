from pathlib import Path
from PIL import Image
import re, html

ROOT=Path(__file__).parent
IMG_DIR=ROOT/'assets/images'
# Fix production-safe phone hrefs/schema generated in prototype.
repls={
    'tel:+302****1704':'tel:+302112181704',
    'tel:+306****8330':'tel:+306982848330',
    "'+302****1704'":"'+302112181704'",
    "'+306****8330'":"'+306982848330'",
    "'+302****1704'":"'+302112181704'",
    "+302****1704":"+302112181704",
    "+306****8330":"+306982848330",
}
# Create responsive variants for active raster photos (not logos/favicons/OG).
for p in list(IMG_DIR.glob('adaptprint-source-*.*')):
    if p.suffix.lower() not in {'.webp','.jpg','.jpeg','.png'}: continue
    if any(token in p.stem for token in ['-480','-800','-1200','fixed']): continue
    try:
        im=Image.open(p).convert('RGB')
    except Exception:
        continue
    for w in (480,800,1200):
        if im.width <= w: continue
        h=round(im.height*w/im.width)
        out=p.with_name(f'{p.stem}-{w}.webp')
        if not out.exists():
            im.resize((w,h), Image.Resampling.LANCZOS).save(out,'WEBP',quality=82,method=6)

def dim_for(src):
    if not src.startswith('/assets/images/'): return None
    fp=ROOT/src.lstrip('/')
    if not fp.exists(): return None
    try:
        im=Image.open(fp); return im.size
    except Exception: return None

def srcset_for(src):
    if not src.startswith('/assets/images/adaptprint-source-'): return ''
    fp=ROOT/src.lstrip('/')
    base=fp.with_suffix('').name
    parts=[]
    for w in (480,800,1200):
        v=fp.with_name(f'{base}-{w}.webp')
        if v.exists(): parts.append(f'/assets/images/{v.name} {w}w')
    if fp.exists():
        try:
            im=Image.open(fp); parts.append(f'{src} {im.width}w')
        except Exception: parts.append(src)
    return ', '.join(parts)

def enhance_imgs(text):
    img_count=0
    def repl(m):
        nonlocal img_count
        tag=m.group(0)
        src_m=re.search(r'src="([^"]+)"', tag)
        if not src_m: return tag
        src=src_m.group(1)
        img_count += 1
        # remove previous perf attrs to avoid duplicates
        for attr in ['width','height','loading','decoding','fetchpriority','srcset','sizes']:
            tag=re.sub(rf'\s{attr}="[^"]*"','',tag)
        dim=dim_for(src)
        attrs=[]
        if dim:
            attrs += [f'width="{dim[0]}"', f'height="{dim[1]}"']
        attrs.append('decoding="async"')
        is_logo='adaptprint-logo' in src
        is_hero=img_count==1 or src.endswith('adaptprint-source-02.webp') and 'hero-media' in text[:m.start()+200]
        attrs.append('loading="eager"' if is_logo or is_hero else 'loading="lazy"')
        if is_hero: attrs.append('fetchpriority="high"')
        ss=srcset_for(src)
        if ss:
            attrs.append(f'srcset="{html.escape(ss, quote=True)}"')
            attrs.append('sizes="(max-width: 900px) 100vw, 50vw"')
        return tag[:-1]+' '+' '.join(attrs)+'>'
    return re.sub(r'<img\b[^>]*>', repl, text)

for p in [ROOT/'build_site.py']+list(ROOT.rglob('*.html')):
    if not p.is_file(): continue
    s=p.read_text(encoding='utf-8')
    for a,b in repls.items(): s=s.replace(a,b)
    if p.suffix.lower()=='.html': s=enhance_imgs(s)
    p.write_text(s,encoding='utf-8')

print('postprocessed phones, dimensions, srcsets, lazy/eager loading')
