# iOS 스플래시 17종 생성 — public/splash/<w>x<h>.png. 저장소 루트에서 실행.
from pathlib import Path

from PIL import Image, ImageDraw

from og_splash_common import BG, CHALK, draw_bars, draw_text_center, load_font

SIZES = [
    (640, 1136), (750, 1334), (828, 1792), (1125, 2436), (1170, 2532),
    (1179, 2556), (1206, 2622), (1242, 2208), (1242, 2688), (1284, 2778),
    (1290, 2796), (1320, 2868), (1536, 2048), (1620, 2160), (1640, 2360),
    (1668, 2388), (2048, 2732),
]

Path("public/splash").mkdir(parents=True, exist_ok=True)
for w, h in SIZES:
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    icon = int(min(w, h) * 0.36)
    draw_bars(d, w / 2, h * 0.44, icon)
    font = load_font(int(min(w, h) * 0.08))
    draw_text_center(d, w / 2, h * 0.44 + icon * 0.82, "대시보드 드롭", font, CHALK)
    img.save(f"public/splash/{w}x{h}.png")
    print(f"public/splash/{w}x{h}.png")
