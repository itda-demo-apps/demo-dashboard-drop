# 앱 아이콘 생성 — 막대 차트 3개. 4배 슈퍼샘플링 후 축소. 실행: npm run icons
from PIL import Image, ImageDraw

from og_splash_common import BG, draw_bars

SS = 4


def draw_icon(size, rounded, scale=1.0):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, s, s], fill=BG)
    draw_bars(d, s / 2, s / 2, s * scale)
    return img.resize((size, size), Image.LANCZOS)


def save(img, name):
    img.save(f"public/{name}")
    print(f"public/{name}")


save(draw_icon(192, rounded=True), "icon-192.png")
save(draw_icon(512, rounded=True), "icon-512.png")
save(draw_icon(512, rounded=False, scale=0.72).convert("RGB"), "icon-512-maskable.png")
save(draw_icon(180, rounded=False).convert("RGB"), "apple-touch-icon.png")
