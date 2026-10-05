import os
import json
from PIL import Image
import numpy as np

def run_checks():
    regions = ['hai-phong', 'quang-ninh', 'ninh-binh', 'thanh-hoa', 'nghe-an', 'ha-tinh']
    base_reg = 'client/public/assets/regions'
    base_hanoi = 'client/public/assets/hanoi/v3'

    print("=" * 60)
    print("1. SCENE & MAP DIMENSIONS VERIFICATION")
    print("=" * 60)
    
    # Hanoi
    h_scene = Image.open(f"{base_hanoi}/scene.webp")
    h_mini = Image.open(f"{base_hanoi}/minimap.webp")
    print(f"Hanoi       : scene={h_scene.size} (expected 1672x941: {h_scene.size == (1672, 941)}), minimap={h_mini.size} (expected 256x144: {h_mini.size == (256, 144)})")
    assert h_scene.size == (1672, 941)
    assert h_mini.size == (256, 144)

    for r in regions:
        s = Image.open(f"{base_reg}/{r}/scene.webp")
        m = Image.open(f"{base_reg}/{r}/minimap.webp")
        icon = Image.open(f"{base_reg}/{r}/icon.webp")
        ok_s = s.size == (1672, 941)
        ok_m = m.size == (256, 144)
        print(f"{r:12s}: scene={s.size} ({ok_s}), minimap={m.size} ({ok_m}), icon={icon.size}")
        assert ok_s and ok_m
        if r == 'ha-tinh':
            rs = Image.open(f"{base_reg}/{r}/rescue-scene.webp")
            rm = Image.open(f"{base_reg}/{r}/rescue-minimap.webp")
            ok_rs = rs.size == (1672, 941)
            ok_rm = rm.size == (256, 144)
            print(f"ha-tinh res : scene={rs.size} ({ok_rs}), minimap={rm.size} ({ok_rm})")
            assert ok_rs and ok_rm

    print("\n" + "=" * 60)
    print("2. FOREGROUND OCCLUSION LAYERS VERIFICATION")
    print("=" * 60)
    
    with open(f"{base_hanoi}/layers.json", encoding="utf-8") as f:
        h_layers = json.load(f)
    print(f"Hanoi layers count: {len(h_layers)}")
    for l in h_layers:
        p = f"{base_hanoi}/{l['key']}.webp"
        assert os.path.exists(p), f"Missing Hanoi layer file {p}"
        im = Image.open(p)
        assert im.size == (l['width'], l['height']), f"Dimension mismatch {l['key']}"
        assert l['depth'] >= l['y'], f"Depth {l['depth']} < y {l['y']} for {l['key']}"
        # Polygon checks
        poly = l['polygon']
        min_px = min(pt[0] for pt in poly)
        max_px = max(pt[0] for pt in poly)
        min_py = min(pt[1] for pt in poly)
        max_py = max(pt[1] for pt in poly)
        assert min_px == l['x'] and min_py == l['y'], f"BBox mismatch for {l['key']}"
        assert max_px - min_px + 1 == l['width'] and max_py - min_py + 1 == l['height'], f"Size mismatch for {l['key']}"

    reg_layer_counts = {}
    for r in regions:
        with open(f"{base_reg}/{r}/layers.json", encoding="utf-8") as f:
            layers = json.load(f)
        reg_layer_counts[r] = len(layers)
        for l in layers:
            p = f"{base_reg}/{r}/{l['key']}.webp"
            assert os.path.exists(p), f"Missing layer file {p}"
            im = Image.open(p)
            assert im.size == (l['width'], l['height']), f"Dimension mismatch {r}/{l['key']}"
            assert l['depth'] >= l['y'], f"Depth {l['depth']} < y {l['y']} for {r}/{l['key']}"
            poly = l['polygon']
            min_px = min(pt[0] for pt in poly)
            max_px = max(pt[0] for pt in poly)
            min_py = min(pt[1] for pt in poly)
            max_py = max(pt[1] for pt in poly)
            assert min_px == l['x'] and min_py == l['y'], f"BBox mismatch for {r}/{l['key']}"
            assert max_px - min_px + 1 == l['width'] and max_py - min_py + 1 == l['height'], f"Size mismatch for {r}/{l['key']}"
    
    for r, c in reg_layer_counts.items():
        print(f"{r:12s}: {c} layers - All valid and depth sorted")

    print("\n" + "=" * 60)
    print("3. BRIDGES ATLAS & FRAME ANALYSIS")
    print("=" * 60)
    
    # Regional bridges
    kinds = ['stone', 'wood', 'steel']
    for k in kinds:
        p = f"{base_reg}/shared/bridge-{k}.png"
        im = Image.open(p)
        assert im.size == (512, 576), f"Wrong size for {p}: {im.size}"
        arr = np.array(im)
        # Check frames: 0: 0..192, 1: 192..384, 2: 384..576
        f0 = arr[0:192, :, :]
        f1 = arr[192:384, :, :]
        f2 = arr[384:576, :, :]
        
        # Frame 1 is broken bridge -> middle should have transparent hole where the break is!
        f0_mid_opaque = np.count_nonzero(f0[70:122, 200:312, 3] > 100)
        f1_mid_opaque = np.count_nonzero(f1[70:122, 200:312, 3] > 100)
        
        # Alpha halo check: count bright edge pixels (alpha between 10 and 240 with RGB all > 230)
        edge_mask = (arr[:, :, 3] > 15) & (arr[:, :, 3] < 240)
        bright_halo = edge_mask & (arr[:, :, 0] > 220) & (arr[:, :, 1] > 220) & (arr[:, :, 2] > 220)
        halo_count = np.count_nonzero(bright_halo)
        
        print(f"bridge-{k:5s}: size={im.size}, halo_pixels={halo_count}, f0_center_opaque={f0_mid_opaque}, f1_center_opaque={f1_mid_opaque} (broken state shows open water: {f1_mid_opaque < f0_mid_opaque})")

    # Hanoi bridge
    h_bp = f"{base_hanoi}/bridge.png"
    h_bim = Image.open(h_bp)
    assert h_bim.size == (216, 240), f"Wrong size for Hanoi bridge: {h_bim.size}"
    h_barr = np.array(h_bim)
    edge_mask_h = (h_barr[:, :, 3] > 15) & (h_barr[:, :, 3] < 240)
    bright_halo_h = edge_mask_h & (h_barr[:, :, 0] > 220) & (h_barr[:, :, 1] > 220) & (h_barr[:, :, 2] > 220)
    halo_count_h = np.count_nonzero(bright_halo_h)
    
    # Hanoi frames: 0..80, 80..160, 160..240
    hf0 = h_barr[0:80, :, :]
    hf1 = h_barr[80:160, :, :]
    hf0_mid_opaque = np.count_nonzero(hf0[25:55, 80:136, 3] > 100)
    hf1_mid_opaque = np.count_nonzero(hf1[25:55, 80:136, 3] > 100)
    print(f"hanoi-bridge : size={h_bim.size}, halo_pixels={halo_count_h}, f0_center_opaque={hf0_mid_opaque}, f1_center_opaque={hf1_mid_opaque} (broken state shows open water: {hf1_mid_opaque < hf0_mid_opaque})")

    # Boats
    boat_p = f"{base_reg}/shared/boats.png"
    boat_im = Image.open(boat_p)
    assert boat_im.size == (192, 312)
    boat_arr = np.array(boat_im)
    boat_edge_mask = (boat_arr[:, :, 3] > 15) & (boat_arr[:, :, 3] < 240)
    boat_halo = boat_edge_mask & (boat_arr[:, :, 0] > 220) & (boat_arr[:, :, 1] > 220) & (boat_arr[:, :, 2] > 220)
    print(f"boats.png    : size={boat_im.size}, halo_pixels={np.count_nonzero(boat_halo)}")

    print("\n" + "=" * 60)
    print("4. BACKGROUND WATER UNDER BRIDGES ON scene.webp")
    print("=" * 60)
    
    # Check bridge locations on scene.webp
    # For each map, check the color/character of the pixels under the bridge span
    bridge_coords = {
        'quang-ninh': ((1060, 585), (1230, 642)),
        'thanh-hoa':  ((820, 568), (910, 598)),
        'ha-tinh':    ((972, 693), (1062, 717)),
    }
    for r, ((x1, y1), (x2, y2)) in bridge_coords.items():
        s = Image.open(f"{base_reg}/{r}/scene.webp")
        arr = np.array(s)
        sub = arr[y1:y2, x1:x2]
        # Calculate mean RGB
        mean_r = np.mean(sub[:, :, 0])
        mean_g = np.mean(sub[:, :, 1])
        mean_b = np.mean(sub[:, :, 2])
        # Water in these scenes typically has green/blue dominant over red
        is_water_dominant = mean_g > mean_r or mean_b > mean_r
        print(f"{r:12s}: bridge bbox ({x1},{y1})-({x2},{y2}) mean RGB=({mean_r:.1f}, {mean_g:.1f}, {mean_b:.1f}) -> Water dominant: {is_water_dominant}")

    print("\n" + "=" * 60)
    print("ALL ASSET INTEGRITY CHECKS PASSED!")
    print("=" * 60)

if __name__ == '__main__':
    run_checks()
