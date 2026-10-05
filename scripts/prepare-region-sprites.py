"""Crop and normalize generated atlases and a licensed waterfall; no painted art."""
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'client/public/assets/regions/shared'

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

def opaque_cell(im,box):
 cell=im.crop(box).convert('RGBA')
 alpha=cell.getchannel('A').point(lambda a:255 if a>=160 else 0)
 cell.putalpha(alpha)
 return cell.crop(alpha.getbbox())

bridges_src=ROOT/'docs/art-source/regions/shared/bridges-source.png'
for row,kind in enumerate(['stone','wood','steel']):
 out_path=OUT/f'bridge-{kind}.png'
 if bridges_src.exists():
  bridges=Image.open(bridges_src)
  sheet=Image.new('RGBA',(512,576))
  for col in range(3):
   cell=opaque_cell(bridges,(col*bridges.width//3,row*bridges.height//3,(col+1)*bridges.width//3,(row+1)*bridges.height//3))
   cell=cell.resize((512,176),Image.Resampling.LANCZOS)
   sheet.alpha_composite(cell,(0,col*192+8))
  sheet=clean_alpha_halo(sheet)
  sheet.save(out_path,optimize=True)
 elif out_path.exists():
  existing=Image.open(out_path).convert('RGBA')
  cleaned=clean_alpha_halo(existing)
  cleaned.save(out_path,optimize=True)

boats_src=ROOT/'docs/art-source/regions/shared/boats-source.png'
boats_out=OUT/'boats.png'
if boats_src.exists():
 boats=Image.open(boats_src)
 sheet=Image.new('RGBA',(192,312))
 for row,(top,bottom) in enumerate([(0,520),(520,963),(963,1280)]):
  cell=opaque_cell(boats,(0,top,boats.width,bottom));cell.thumbnail((190,100),Image.Resampling.LANCZOS)
  sheet.alpha_composite(cell,((192-cell.width)//2,row*104+(104-cell.height)//2))
 sheet=clean_alpha_halo(sheet)
 sheet.save(boats_out,optimize=True)
elif boats_out.exists():
 existing=Image.open(boats_out).convert('RGBA')
 cleaned=clean_alpha_halo(existing)
 cleaned.save(boats_out,optimize=True)

water_path=OUT/'waterfall-sevarihk.png'
if water_path.exists():
 water=Image.open(water_path).convert('RGBA')
 sheet=Image.new('RGBA',(192,128))
 for col,x in enumerate([32,176,320]):sheet.alpha_composite(water.crop((x,0,x+64,128)),(col*64,0))
 sheet.save(OUT/'waterfall.png',optimize=True)

print('Prepared bridge, boat and waterfall atlases.')

