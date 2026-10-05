"""Render collision QA overlays; never regenerate or modify the source art.
Run after client build: python scripts/verify-open-ground-visual.py --out client/dist-collision-all-ground/qa
Green = ground support, blue = water, red = solids, yellow = original path centre lines.
This is a geometry inspection aid, not a gameplay/browser certificate.
"""
from pathlib import Path
import argparse, json, runpy
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--out', default='client/dist-collision-all-ground/qa')
args=parser.parse_args()
out=ROOT/args.out
out.mkdir(parents=True,exist_ok=True)
layout=json.loads((ROOT/'scripts/collision-layout.json').read_text(encoding='utf-8'))
data=runpy.run_path(str(ROOT/'scripts/prepare-regions.py'))['DATA']
for slug,spec in layout.items():
    image_path=ROOT/('client/public/assets/hanoi/v3/scene.webp' if slug=='hanoi' else f'client/public/assets/regions/{slug}/scene.webp')
    im=Image.open(image_path).convert('RGBA')
    overlay=Image.new('RGBA',im.size)
    draw=ImageDraw.Draw(overlay)
    for poly in spec['groundAreas']:
        draw.polygon([tuple(p) for p in poly],fill=(50,220,90,65),outline=(20,255,60,210))
    for poly in spec['waterCollision']:
        draw.polygon([tuple(p) for p in poly],fill=(0,100,255,80))
    # Hanoi's hand-written paths/solids/water are covered by the runtime tests;
    # the Hanoi overlay shows only generated extra ground/footprints.
    if slug!='hanoi':
        for path in data[slug]['paths']:
            draw.line([tuple(p) for p in path],fill=(255,210,0,160),width=3)
    rects=([[f['x'],f['y'],f['width'],f['height']] for f in spec['footprints']]
           + ([] if slug=='hanoi' else data[slug]['colliders']))
    for x,y,w,h in rects:
        draw.rectangle((x,y,x+w,y+h),fill=(255,30,30,120),outline=(255,0,0,240))
    Image.alpha_composite(im,overlay).convert('RGB').save(out/f'{slug}-geometry.png')
print(f'7 geometry overlays written to {out}')
