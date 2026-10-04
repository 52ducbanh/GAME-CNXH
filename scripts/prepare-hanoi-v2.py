"""Pack generated sprites at native game sizes. No painting or scene synthesis.
Keeps originals, trims transparent padding, removes low-alpha export fringe,
preserves aspect ratios, and aligns animation frames at a shared foot baseline.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, shutil, re

ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/'docs/hanoi-v2-generation.json').read_text(encoding='utf-8'))
DEST=ROOT/'client/public/assets/hanoi/v2'
ORIGINALS=ROOT/'docs/art-source/hanoi-v2'
DEST.mkdir(parents=True,exist_ok=True);ORIGINALS.mkdir(parents=True,exist_ok=True)
WIDTHS={'house-a':152,'house-b':136,'house-c':164,'headquarters':240,'warehouse':185,'tower':100,'clinic':140,'mobile-clinic':116,'tree':96,'willow':110}

def trim(im):
    alpha=im.getchannel('A').point(lambda a:255 if a>=160 else 0)
    im.putalpha(alpha)
    bounds=alpha.getbbox()
    if not bounds:raise ValueError('Empty sprite')
    return im.crop(bounds)

def bands(values,gap=10):
    runs=[];start=None;last=None
    for i,v in enumerate(values):
        if v:
            if start is None:start=i
            last=i
        elif start is not None and i-last>gap:
            runs.append((start,last+1));start=None
    if start is not None:runs.append((start,last+1))
    return runs

def split_rows(im,rows,cols):
    alpha=im.getchannel('A').point(lambda a:255 if a>=160 else 0)
    im.putalpha(alpha)
    row_runs=bands([alpha.crop((0,y,im.width,y+1)).getbbox() is not None for y in range(im.height)])
    if len(row_runs)!=rows:raise ValueError(f'Expected {rows} rows: {row_runs}')
    parts=[]
    for top,bottom in row_runs:
        row=im.crop((0,top,im.width,bottom));a=row.getchannel('A')
        col_runs=bands([a.crop((x,0,x+1,a.height)).getbbox() is not None for x in range(a.width)])
        if len(col_runs)!=cols:raise ValueError(f'Expected {cols} columns: {col_runs}')
        parts.extend(trim(row.crop((l,0,r,row.height))) for l,r in col_runs)
    return parts

manifest={}
for key,item in DATA['assets'].items():
    source=Path(item['source']);saved=ORIGINALS/(key+('-v3' if item.get('revision') else '')+'.png')
    if not saved.exists():shutil.copyfile(source,saved)
    im=Image.open(saved).convert('RGBA')
    if key in WIDTHS:
        im=trim(im);w=WIDTHS[key];h=round(im.height*w/im.width)
        im=im.resize((w,h),Image.Resampling.NEAREST)
    elif key in ('volunteer','citizen','doctor'):
        frames=split_rows(im,4,4)
        # Volunteer/doctor generation mixed a left-row profile in a few cells.
        # Build a consistent left cycle from the complete right-facing row.
        if key in ('volunteer','doctor'):
            frames[4:8]=[f.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for f in frames[8:12]]
        ratio=min(28/max(f.width for f in frames),44/max(f.height for f in frames))
        im=Image.new('RGBA',(128,192))
        for i,f in enumerate(frames):
            f=f.resize((round(f.width*ratio),round(f.height*ratio)),Image.Resampling.NEAREST)
            im.alpha_composite(f,((i%4)*32+(32-f.width)//2,(i//4)*48+46-f.height))
    elif key=='props':
        frames=split_rows(im,2,4);im=Image.new('RGBA',(256,192))
        sizes=[(22,75),(56,31),(60,67),(26,27),(40,30),(56,24),(32,40),(30,76)]
        for i,f in enumerate(frames):
            f.thumbnail(sizes[i],Image.Resampling.NEAREST)
            im.alpha_composite(f,((i%4)*64+(64-f.width)//2,(i//4)*96+94-f.height))
            if i==3:f.save(DEST/'crate.png')
    elif key=='bridge':
        # Compact bridge variants occupy three separate columns. The centre
        # broken asset remains one frame despite its two disconnected halves.
        frames=[trim(im.crop((round(i*im.width/3),0,round((i+1)*im.width/3),im.height))) for i in range(3)]
        im=Image.new('RGBA',(160,252))
        for i,f in enumerate(frames):
            f.thumbnail((156,80),Image.Resampling.NEAREST);im.alpha_composite(f,((160-f.width)//2,i*84+(84-f.height)//2))
    im.save(DEST/(key+'.png'),optimize=True)
    manifest[key]={'width':im.width,'height':im.height,'anchor':'bottom-center','source':str(saved.relative_to(ROOT)),'bytes':(DEST/(key+'.png')).stat().st_size}

(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
# Make the shared visual bounds match the native sprite sizes. Gameplay
# footprints continue to use the narrower facade/base in mapData.ts.
p=ROOT/'shared/src/mapData.ts';text=p.read_text(encoding='utf-8')
def bounds(m):
    key=m[1].replace('_','-');a=manifest[key]
    return m[0][:m[0].index('width:')]+f"width: {a['width']}, height: {a['height']} }}"
text=re.sub(r"\{ key: '(headquarters|warehouse|house_[abc])', x: \d+, y: \d+, width: \d+, height: \d+ \}",bounds,text)
p.write_text(text,encoding='utf-8')
# Inspection-only contact sheet at actual display dimensions.
sheet=Image.new('RGB',(780,600),'#d8ceb4');draw=ImageDraw.Draw(sheet)
for i,key in enumerate(WIDTHS):
    asset=Image.open(DEST/(key+'.png'));x=(i%4)*195;y=(i//4)*195
    sheet.paste(asset,(x+(190-asset.width)//2,y+170-asset.height),asset);draw.text((x+8,y+177),key,fill='#304638')
sheet.save(ROOT/'docs/screenshots/hanoi-v2-asset-check.png')
print('Packed',len(manifest),'assets;',sum(a['bytes'] for a in manifest.values()),'runtime bytes')
