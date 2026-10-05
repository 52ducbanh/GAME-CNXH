"""Register a reference-aligned scene. Only crop/encode assets; no painted art."""
from pathlib import Path
from PIL import Image
import json, re, shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'client/public/assets/hanoi/v3'
OUT.mkdir(parents=True, exist_ok=True)
archive = ROOT / 'docs/art-source/hanoi-v3'
archive.mkdir(parents=True, exist_ok=True)
SOURCE = archive / 'clean-scene.png'
if not SOURCE.exists():
 fallback = OUT / 'scene.webp'
 if fallback.exists(): SOURCE = fallback
im = Image.open(SOURCE).convert('RGB')
assert im.size == (1672, 941)
im.save(OUT / 'scene.webp', quality=94, method=6)
im.resize((256,144), Image.Resampling.LANCZOS).save(OUT / 'minimap.webp', quality=85)

# Masks trace roofs/canopies of THIS scene. Cropped textures share the original
# pixels; Phaser masks them and sorts at the ground anchor, with local-player fade.
layers = [
 ('hq-roof',235,[[0,0],[287,0],[324,143],[306,179],[0,169]]),
 ('warehouse-roof',710,[[0,564],[216,532],[247,608],[200,650],[0,654]]),
 ('west-willow',349,[[447,253],[490,244],[517,278],[511,316],[493,346],[465,343],[444,319],[438,285]]),
 ('west-canopy',496,[[303,396],[321,370],[374,359],[418,382],[420,431],[397,458],[364,472],[322,453],[298,430]]),
 ('west-garden',677,[[342,532],[365,519],[405,538],[438,563],[456,580],[458,626],[439,653],[420,674],[399,656],[376,632],[345,612],[339,584]]),
 ('west-lane-top',349,[[292,275],[340,259],[378,276],[399,306],[386,333],[350,343],[319,329],[289,302]]),
 ('west-willow-south',637,[[489,511],[534,503],[553,542],[550,599],[531,631],[506,634],[484,597],[482,552]]),
 ('west-willow-south-2',672,[[546,555],[593,545],[618,584],[610,638],[586,671],[559,664],[536,627],[536,586]]),
 ('north-willow',223,[[688,151],[728,145],[762,173],[757,201],[737,221],[706,219],[688,199]]),
 ('east-willow',280,[[1060,169],[1116,151],[1150,183],[1155,224],[1136,277],[1094,279],[1067,244],[1057,208]]),
 ('east-canopy',694,[[1274,618],[1286,593],[1332,597],[1355,632],[1350,665],[1331,687],[1298,682],[1274,652]]),
 ('south-canopy',717,[[915,651],[951,641],[987,660],[997,693],[974,715],[940,709],[916,689]]),
 ('south-canopy-2',788,[[983,715],[1014,690],[1049,704],[1074,734],[1067,763],[1044,783],[1009,775],[984,753]]),
 ('south-roofs',828,[[365,696],[496,694],[531,703],[555,739],[599,744],[628,773],[603,801],[535,809],[498,765],[381,752]]),
 ('south-east-roof',858,[[1085,786],[1126,744],[1171,775],[1177,822],[1157,838],[1123,809]]),
 ('east-roofs',366,[[1483,78],[1494,19],[1607,23],[1671,64],[1671,318],[1580,328],[1490,247],[1448,203]]),
]
manifest=[]
for name,depth,poly in layers:
 x0,y0=min(p[0] for p in poly),min(p[1] for p in poly)
 x1,y1=max(p[0] for p in poly)+1,max(p[1] for p in poly)+1
 im.crop((x0,y0,x1,y1)).save(OUT / f'{name}.webp', quality=94, method=6)
 manifest.append(dict(key=name,x=x0,y=y0,width=x1-x0,height=y1-y0,depth=depth,polygon=poly))
(OUT / 'layers.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(ROOT / 'client/src/game/hanoiSceneLayers.ts').write_text('export const SCENE_LAYERS = '+json.dumps(manifest,indent=2)+' as const;\n',encoding='utf-8')

def clean_alpha_halo(image, matte=(255,255,255)):
 image=image.convert('RGBA'); w,h=image.size; pix=image.load()
 for y in range(h):
  for x in range(w):
   r,g,b,a=pix[x,y]
   if a==0: continue
   is_edge=any(0<=x+dx<w and 0<=y+dy<h and pix[x+dx,y+dy][3]==0 for dx,dy in [(-1,0),(1,0),(0,-1),(0,1)])
   if is_edge:
    if a<250:
     an=a/255.0
     ur=max(0,min(255,int((r-(1.0-an)*matte[0])/max(0.01,an))))
     ug=max(0,min(255,int((g-(1.0-an)*matte[1])/max(0.01,an))))
     ub=max(0,min(255,int((b-(1.0-an)*matte[2])/max(0.01,an))))
     pix[x,y]=(ur,ug,ub,a)
    elif r>200 and g>200 and b>200:
     for dist in range(1,4):
      found=False
      for dx,dy in [(-dist,0),(dist,0),(0,-dist),(0,dist)]:
       nx,ny=x+dx,y+dy
       if 0<=nx<w and 0<=ny<h and pix[nx,ny][3]>200:
        nr,ng,nb,_=pix[nx,ny]
        if not (nr>200 and ng>200 and nb>200):
         pix[x,y]=(nr,ng,nb,255); found=True; break
      if found: break
 return image

bridge_source=archive / 'bridge-states.png'
if not bridge_source.exists() and (OUT / 'bridge.png').exists():
 bridge_source = OUT / 'bridge.png'

bridge=Image.open(bridge_source).convert('RGBA')
if bridge.height > 300:
 sheet=Image.new('RGBA',(216,240))
 for row,(top,bottom) in enumerate([(0,360),(360,685),(685,1024)]):
  cell=bridge.crop((0,top,bridge.width,bottom))
  alpha=cell.getchannel('A').point(lambda a:255 if a>=160 else 0)
  cell.putalpha(alpha)
  cell=cell.crop(alpha.getbbox())
  size=(216,round(cell.height*216/cell.width))
  cell=cell.resize(size,Image.Resampling.LANCZOS)
  sheet.alpha_composite(cell,(0,80*row+10))
 sheet=clean_alpha_halo(sheet)
 sheet.save(OUT / 'bridge.png', optimize=True)
else:
 sheet=clean_alpha_halo(bridge)
 sheet.save(OUT / 'bridge.png', optimize=True)

print(json.dumps({'scene':im.size,'foregroundLayers':len(layers),'runtimeBytes':sum(p.stat().st_size for p in OUT.glob('*'))}))
