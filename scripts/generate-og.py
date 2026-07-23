# OG 공유 이미지 생성 (1200×630) — public/og.png. 저장소 루트에서 실행.
from PIL import Image, ImageDraw

from og_splash_common import BG, CHALK, DIM, draw_bars, load_font

W, H = 1200, 630
SS = 2

img = Image.new("RGB", (W * SS, H * SS), BG)
d = ImageDraw.Draw(img)

draw_bars(d, 950 * SS, 300 * SS, 340 * SS)
d.text((90 * SS, 160 * SS), "모두의 대시보드", font=load_font(100 * SS), fill=CHALK)
sub = load_font(42 * SS)
d.text((94 * SS, 310 * SS), "CSV 끌어놓으면 즉석 대시보드", font=sub, fill=DIM)
d.text((94 * SS, 372 * SS), "KPI·순위·시계열 차트 자동 생성", font=sub, fill=DIM)
d.text((94 * SS, 434 * SS), "파일은 브라우저 안에서만 — 서버 업로드 없음", font=sub, fill=DIM)

img.resize((W, H), Image.LANCZOS).save("public/og.png")
print("public/og.png")
