"""Assemble actual browser QA captures for the regional handover."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'docs/screenshots'
REGIONS = [('hai-phong','HẢI PHÒNG'),('quang-ninh','QUẢNG NINH'),
           ('ninh-binh','NINH BÌNH'),('thanh-hoa','THANH HÓA'),
           ('nghe-an','NGHỆ AN'),('ha-tinh','HÀ TĨNH')]
FONT_DIR = Path('C:/Windows/Fonts')
heading = ImageFont.truetype(str(FONT_DIR/'arialbd.ttf'),28)
label = ImageFont.truetype(str(FONT_DIR/'arialbd.ttf'),23)
small = ImageFont.truetype(str(FONT_DIR/'arial.ttf'),18)
pad, gap, card_width, caption = 20, 16, 760, 39
shot_height = round(card_width * 720 / 1280)
card_height = shot_height + caption
canvas = Image.new('RGB',(pad*2+card_width*2+gap,80+card_height*3+gap*2+pad),'#163c32')
draw = ImageDraw.Draw(canvas)
draw.text((pad,14),'QUÊ MÌNH ĐỨNG ĐẦU! · SÁU VÙNG VIỆT NAM',font=heading,fill='#fff1d5')
draw.text((pad,48),'Ảnh chụp game đang chạy · Cảnh, NPC và công trình theo trạng thái nhiệm vụ',font=small,fill='#c3d8bc')
for i,(slug,name) in enumerate(REGIONS):
    image = Image.open(SHOTS/f'{slug}-final.jpg').convert('RGB')
    assert image.size == (1280,720),(slug,image.size)
    x = pad+(i%2)*(card_width+gap)
    y = 80+(i//2)*(card_height+gap)
    draw.rectangle((x,y,x+card_width-1,y+caption-1),fill='#f5e6c8')
    draw.text((x+12,y+6),name,font=label,fill='#234437')
    canvas.paste(image.resize((card_width,shot_height),Image.Resampling.LANCZOS),(x,y+caption))
target = SHOTS/'regions-final-contact-sheet.jpg'
canvas.save(target,quality=94,subsampling=0)
print(target)
