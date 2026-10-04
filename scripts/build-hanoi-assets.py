from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'client/public/assets'

def svg(name, width, height, body):
    defs = '''<defs>
    <pattern id="roof" width="10" height="7" patternUnits="userSpaceOnUse"><rect width="10" height="7" fill="#bc542f"/><path d="M0 6H10 M5 0V6" stroke="#813c29" stroke-width="1.3"/><path d="M0 1H9" stroke="#e78b53" stroke-width="1.2"/></pattern>
    <pattern id="wall" width="14" height="9" patternUnits="userSpaceOnUse"><rect width="14" height="9" fill="#ddc596"/><path d="M0 9H14 M7 0V9" stroke="#bda47e" stroke-width=".5"/></pattern>
    <pattern id="metal" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#568e80"/><path d="M0 0V9 M3 0V9" stroke="#396158"/><path d="M8 0V9" stroke="#8bbaa3"/></pattern>
    </defs>'''
    (OUT / (name + '.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{defs}{body}</svg>', encoding='utf-8')

def window(x, y, w=15, h=25):
    return f'<rect x="{x-2}" y="{y-2}" width="{w+4}" height="{h+4}" fill="#f0dfb1" stroke="#8a7756"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#27424b"/><path d="M{x+w/2} {y}V{y+h} M{x} {y+h/2}H{x+w}" stroke="#7ca3a4"/><rect x="{x-4}" y="{y+h+2}" width="{w+8}" height="3" fill="#a9916b"/>'

def sign(text, x, y, w, fs=11):
    return f'<rect x="{x}" y="{y}" width="{w}" height="20" rx="1" fill="#f5e8cb" stroke="#4e4535" stroke-width="2"/><text x="{x+w/2}" y="{y+14}" text-anchor="middle" font-family="Arial,sans-serif" font-size="{fs}" font-weight="bold" fill="#253440">{text}</text>'

for name, wall, shutter in [('house_a','#e9cc99','#5d8172'),('house_b','#e6c79b','#6b938b'),('house_c','#d8d0b0','#947a51')]:
    body=f'<ellipse cx="82" cy="112" rx="77" ry="7" fill="#394e35" opacity=".23"/><path d="M8 44L31 21 157 35 151 108 26 111 8 96Z" fill="#a98c65" stroke="#4a4636" stroke-width="2"/><path d="M26 44H150V107H26Z" fill="{wall}"/><path d="M8 44L29 57V105L8 92Z" fill="#b7a37e"/>'
    body+='<path d="M0 49L26 3 126 3 164 40 145 56 25 56Z" fill="url(#roof)" stroke="#553e2e" stroke-width="2"/><path d="M26 3L25 55 M25 3H126" stroke="#e5a16b" stroke-width="3"/><path d="M24 57H149" stroke="#eccc9e" stroke-width="4"/>'
    body+=window(37,68)+window(114,68)
    body+='<rect x="70" y="66" width="27" height="41" fill="#544738" stroke="#f1dfb5" stroke-width="3"/><rect x="75" y="72" width="17" height="32" fill="#735e44"/><path d="M84 72V104" stroke="#3f3930"/><rect x="66" y="107" width="37" height="5" fill="#b5aa8d"/><rect x="64" y="113" width="41" height="3" fill="#77776b"/>'
    body+=f'<rect x="32" y="66" width="5" height="31" fill="{shutter}"/><rect x="54" y="66" width="5" height="31" fill="{shutter}"/><path d="M102 57H134" stroke="#605440"/><path d="M111 58V67" stroke="#3a6b76" stroke-width="9"/><path d="M124 58V70" stroke="#eee5c1" stroke-width="8"/>'
    body+='<rect x="140" y="99" width="9" height="10" fill="#9d6247"/><circle cx="144" cy="95" r="9" fill="#417334"/><circle cx="146" cy="92" r="6" fill="#6b9a3c"/>'
    svg(name,164,120,body)

body='<ellipse cx="120" cy="151" rx="114" ry="6" fill="#354635" opacity=".3"/><path d="M8 49H230V137H8Z" fill="url(#wall)" stroke="#796342" stroke-width="2"/><path d="M0 52L23 13H215L242 52Z" fill="url(#roof)" stroke="#634934" stroke-width="2"/><path d="M18 13H220" stroke="#e0b483" stroke-width="4"/><path d="M8 54H230" stroke="#f3dfad" stroke-width="7"/>'
for x in [18,52,166,201]: body+=window(x,75,19,35)
body+='<rect x="87" y="66" width="67" height="70" fill="#ead9ac" stroke="#9b815b"/><rect x="106" y="83" width="30" height="51" fill="#304e51"/><path d="M121 84V132" stroke="#928964" stroke-width="3"/>'
for x in [88,145]:body+=f'<rect x="{x}" y="75" width="10" height="60" fill="#f5e6bc" stroke="#b49b70"/><path d="M{x-3} 75H{x+13} M{x-3} 134H{x+13}" stroke="#e5c988" stroke-width="4"/>'
body+=sign('TRỤ SỞ',77,54,86,14)+'<path d="M87 139H154 M83 145H158 M79 151H162" stroke="#9f9882" stroke-width="5"/><path d="M123 32V1" stroke="#444942" stroke-width="3"/><path d="M125 0L153 3V22L125 19Z" fill="#d73629"/><path d="M139 5L141 11 147 11 142 15 144 20 139 17 134 20 136 14 132 11 137 11Z" fill="#ffe172"/>'
for x in [36,187]:body+=f'<rect x="{x}" y="130" width="15" height="15" fill="#a77449"/><ellipse cx="{x+7}" cy="125" rx="13" ry="18" fill="#376b3a"/><ellipse cx="{x+9}" cy="119" rx="9" ry="12" fill="#628f43"/>'
svg('headquarters',244,157,body)
svg('warehouse',190,144,'<ellipse cx="93" cy="136" rx="88" ry="7" fill="#31462f" opacity=".3"/><path d="M12 53H179V125H12Z" fill="#b7b28d" stroke="#524d3b" stroke-width="2"/><path d="M0 53L26 9H157L190 47 175 65 18 68Z" fill="url(#metal)" stroke="#344f48" stroke-width="2"/><rect x="58" y="71" width="70" height="55" fill="#554b38"/>'+sign('KHO VẬT TƯ',36,49,123,12)+window(22,80,19,24)+window(146,80,18,24)+'<path d="M60 130H129" stroke="#918c70" stroke-width="5"/><rect x="10" y="105" width="33" height="30" fill="#b58b49" stroke="#654f31" stroke-width="2"/><path d="M14 109H40V131H14Z M23 106V134" fill="none" stroke="#e3bc78" stroke-width="2"/><rect x="137" y="113" width="38" height="27" fill="#b58b49" stroke="#654f31" stroke-width="2"/><path d="M142 117H169V135H142Z M156 115V138" fill="none" stroke="#e3bc78" stroke-width="2"/>')
for name, label in [('clinic_fixed','TRẠM Y TẾ'),('clinic_mobile','Y TẾ LƯU ĐỘNG')]:
    svg(name,140,110,'<ellipse cx="70" cy="103" rx="66" ry="6" fill="#395443" opacity=".3"/><path d="M12 37L70 2 128 37 136 52 117 55 117 100 22 100 22 53 4 50Z" fill="#eae8d9" stroke="#7b8582" stroke-width="2"/><path d="M70 3L51 48 19 53 M70 3L89 48 122 53" stroke="#fffdf0" stroke-width="3"/><path d="M58 52H82V100H58Z" fill="#527a80"/><path d="M57 56L53 99 M82 56L89 99" stroke="#e3e2d5" stroke-width="7"/><path d="M65 19H75V38H65Z M60 24H80V33H60Z" fill="#c74036"/>'+sign(label,22,43,97,10)+'<path d="M8 55V101 M132 55V101" stroke="#83785a" stroke-width="3"/><rect x="25" y="88" width="20" height="14" fill="#f9f3df" stroke="#9aab99"/><path d="M33 91H37V99H33Z M30 93H40V97H30Z" fill="#bb453d"/><rect x="103" y="92" width="12" height="11" fill="#97694a"/><circle cx="109" cy="86" r="10" fill="#5b8a42"/>')
svg('notice_board',100,90,'<ellipse cx="50" cy="85" rx="47" ry="5" fill="#394931" opacity=".25"/><path d="M10 20H91V71H10Z" fill="#736045" stroke="#423e2d" stroke-width="3"/><path d="M5 15L16 6H85L98 15Z" fill="url(#roof)" stroke="#4a4031" stroke-width="2"/><path d="M14 71V88 M85 71V88" stroke="#5d4b34" stroke-width="6"/><rect x="17" y="26" width="67" height="38" fill="#e6dcb8"/><rect x="22" y="29" width="19" height="29" fill="#eeeee0"/><rect x="47" y="30" width="30" height="12" fill="#dfdfce"/><path d="M24 35H37 M24 39H37 M24 43H35 M49 33H74 M49 37H74 M48 47H75 M48 51H75 M48 56H73" stroke="#9c9b8c"/>'+sign('CÔNG KHAI',17,12,66,8))
body='<ellipse cx="78" cy="158" rx="66" ry="10" fill="#193f33" opacity=".25"/><path d="M19 152L32 144 120 143 138 151 121 160 33 161Z" fill="#b8b7a1" stroke="#767b6d" stroke-width="2"/>'
for y,w,h in [(99,91,44),(61,74,37),(32,58,29)]:
    x=78-w/2
    body+=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#c9c9b5" stroke="#707b77" stroke-width="2"/><rect x="{x+w-14}" y="{y}" width="14" height="{h}" fill="#929e99"/>'
    for wx in [78-w*.27,78,78+w*.27]:
        body+=f'<path d="M{wx-6} {y+h-3}V{y+13}Q{wx} {y+1} {wx+6} {y+13}V{y+h-3}Z" fill="#35514e" stroke="#e1dfc7" stroke-width="3"/>'
    body+=f'<path d="M{x-9} {y}L{x+4} {y-9}H{x+w-4}L{x+w+11} {y}Z" fill="#8c9a92" stroke="#555f5c" stroke-width="2"/><path d="M{x-8} {y}H{x+w+10}" stroke="#dbdac4" stroke-width="3"/>'
body+='<path d="M62 23L70 15H86L94 23Z" fill="#9ca49a" stroke="#535f58" stroke-width="2"/><path d="M70 15L75 7H81L86 15" fill="#b6bba9" stroke="#637168"/><path d="M78 7V2 M41 89V80 M115 89V80 M30 130V120 M127 130V120" stroke="#68776e" stroke-width="2"/>'
svg('thap_rua',156,174,body)
for name,broken in [('bridge_intact',False),('bridge_broken',True)]:
    body='<ellipse cx="69" cy="66" rx="64" ry="15" fill="#183d39" opacity=".35"/><path d="M3 32Q69 0 135 32V63Q69 30 3 63Z" fill="#a0a398" stroke="#535e5a" stroke-width="3"/><path d="M4 31Q69 0 135 31L134 52Q69 23 4 52Z" fill="#d1c9ad" stroke="#747b6e" stroke-width="2"/>'
    for x in range(8,135,14): body+=f'<path d="M{x} 26V46" stroke="#b0aa91"/>'
    for y in [14,48]:
        body+=f'<path d="M3 {y+15}Q69 {y-13} 135 {y+15}" fill="none" stroke="#e0decc" stroke-width="5"/>'
        for x in [6,27,48,69,90,111,132]:body+=f'<rect x="{x-2}" y="{y+abs(x-69)*.15-5}" width="4" height="17" fill="#ece3c8" stroke="#7c8578"/>'
    if broken:body+='<path d="M62 10L79 13 68 24 83 30 69 39 79 60H58L67 42 53 31 66 24 57 19Z" fill="#20796e" stroke="#475b51" stroke-width="2"/><path d="M11 51L31 49 37 61 16 64Z" fill="#bd663f"/>'
    svg(name,140,82,body)
svg('crate',32,32,'<path d="M2 8L12 2 30 8V28L21 31 2 26Z" fill="#b78343" stroke="#4f422d" stroke-width="2"/><path d="M2 8L21 13 30 8 M21 13V31" fill="none" stroke="#e8bb76" stroke-width="2"/><path d="M6 12L17 15V26L6 23Z M25 15V26" fill="none" stroke="#6e4e2b" stroke-width="2"/>')
print('Wrote Hanoi landmarks')
