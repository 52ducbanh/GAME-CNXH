import json
from PIL import Image
import numpy as np

def audit():
    # 1. Check Hanoi layers
    with open('client/public/assets/hanoi/v3/layers.json', encoding='utf-8') as f:
        hn_layers = json.load(f)

    hn_scene = Image.open('client/public/assets/hanoi/v3/scene.webp')

    print('=== HANOI LAYERS PIXEL ALIGNMENT & DEPTH CHECK ===')
    for l in hn_layers:
        k = l['key']
        p = f'client/public/assets/hanoi/v3/{k}.webp'
        im = Image.open(p)
        scene_crop = hn_scene.crop((l['x'], l['y'], l['x'] + l['width'], l['y'] + l['height']))
        diff = np.abs(np.array(im).astype(int) - np.array(scene_crop).astype(int))
        max_diff = np.max(diff)
        poly_y_max = max(pt[1] for pt in l['polygon'])
        print(f"{k:22s}: size=({l['width']:3d},{l['height']:3d}), depth={l['depth']:3d}, poly_y_max={poly_y_max:3d}, depth_offset={l['depth'] - poly_y_max:3d}, max_diff={max_diff}")

    # 2. Check Regional layers
    print('\n=== REGIONAL LAYERS PIXEL ALIGNMENT & DEPTH CHECK ===')
    with open('client/src/game/regionalLayers.ts', encoding='utf-8') as f:
        text = f.read()
    reg_layers = json.loads(text.split('export const REGIONAL_LAYERS:Record<string,{key:string;x:number;y:number;width:number;height:number;depth:number;polygon:number[][]}[]> = ')[1].rstrip(';\n'))

    for r, layers in reg_layers.items():
        scene = Image.open(f'client/public/assets/regions/{r}/scene.webp')
        print(f'-- {r} ({len(layers)} layers) --')
        for l in layers:
            k = l['key']
            p = f'client/public/assets/regions/{r}/{k}.webp'
            im = Image.open(p)
            scene_crop = scene.crop((l['x'], l['y'], l['x'] + l['width'], l['y'] + l['height']))
            diff = np.abs(np.array(im).astype(int) - np.array(scene_crop).astype(int))
            max_diff = np.max(diff)
    # Check for any anomalies
    print('\n=== ANOMALY DETECTION ===')
    def poly_area(pts):
        n = len(pts)
        return sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1] for i in range(n)) / 2.0

    for l in hn_layers:
        poly_y_max = max(pt[1] for pt in l['polygon'])
        area = poly_area(l['polygon'])
        if l['depth'] < poly_y_max:
            print(f"BUG Hanoi: {l['key']} depth {l['depth']} < poly_y_max {poly_y_max}")
        if abs(area) < 10:
            print(f"BUG Hanoi: {l['key']} degenerate area {area}")

    for r, layers in reg_layers.items():
        for l in layers:
            poly_y_max = max(pt[1] for pt in l['polygon'])
            area = poly_area(l['polygon'])
            if l['depth'] < poly_y_max:
                print(f"BUG {r}: {l['key']} depth {l['depth']} < poly_y_max {poly_y_max}")
            if abs(area) < 10:
                print(f"BUG {r}: {l['key']} degenerate area {area}")

if __name__ == '__main__':
    audit()
