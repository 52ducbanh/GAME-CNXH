"""Crop and normalize generated atlases and a licensed waterfall; no painted art."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'client/public/assets/regions/shared'
def opaque_cell(im,box):
 cell=im.crop(box).convert('RGBA'); alpha=cell.getchannel('A').point(lambda a:255 if a>=160 else 0);cell.putalpha(alpha)
 return cell.crop(alpha.getbbox())
bridges=Image.open(ROOT/'docs/art-source/regions/shared/bridges-source.png')
for row,kind in enumerate(['stone','wood','steel']):
 sheet=Image.new('RGBA',(512,576))
 for col in range(3):
  cell=opaque_cell(bridges,(col*bridges.width//3,row*bridges.height//3,(col+1)*bridges.width//3,(row+1)*bridges.height//3))
  cell=cell.resize((512,176),Image.Resampling.LANCZOS)
  sheet.alpha_composite(cell,(0,col*192+8))
 sheet.save(OUT/f'bridge-{kind}.png',optimize=True)
boats=Image.open(ROOT/'docs/art-source/regions/shared/boats-source.png')
sheet=Image.new('RGBA',(192,312))
for row,(top,bottom) in enumerate([(0,520),(520,963),(963,1280)]):
 cell=opaque_cell(boats,(0,top,boats.width,bottom));cell.thumbnail((190,100),Image.Resampling.LANCZOS)
 sheet.alpha_composite(cell,((192-cell.width)//2,row*104+(104-cell.height)//2))
sheet.save(OUT/'boats.png',optimize=True)
water=Image.open(OUT/'waterfall-sevarihk.png').convert('RGBA')
sheet=Image.new('RGBA',(192,128))
for col,x in enumerate([32,176,320]):sheet.alpha_composite(water.crop((x,0,x+64,128)),(col*64,0))
sheet.save(OUT/'waterfall.png',optimize=True)
print('Prepared bridge, boat and waterfall atlases.')
