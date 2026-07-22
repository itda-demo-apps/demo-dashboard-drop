# 아이콘·OG·스플래시 공용 유틸 — 막대 차트 도안 + Black Han Sans 로드
import urllib.request
from pathlib import Path

from PIL import ImageFont

BG = "#1E2126"
CHALK = "#F2EFE9"
DIM = "#B8B4AC"
GREEN = "#57A867"
BLUE = "#4E8FD9"

FONT_URL = "https://github.com/google/fonts/raw/main/ofl/blackhansans/BlackHanSans-Regular.ttf"
FONT_CACHE = Path(__file__).parent / ".fonts" / "BlackHanSans-Regular.ttf"
FALLBACKS = [
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/Library/Fonts/AppleGothic.ttf",
]


def load_font(size):
    try:
        if not FONT_CACHE.exists():
            FONT_CACHE.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(FONT_URL, FONT_CACHE)
        return ImageFont.truetype(str(FONT_CACHE), size)
    except Exception:
        for p in FALLBACKS:
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
        raise RuntimeError("한글 폰트를 찾지 못했습니다")


def draw_bars(d, cx, cy, size):
    """막대 3개 도안을 (cx, cy) 중심, 한 변 size 크기로 그린다 (favicon.svg와 동일 좌표계 100, 바닥 y=76 앵커)"""
    u = size / 100

    def pt(x, y):
        return (cx + (x - 50) * u, cy + (y - 50) * u)

    r = 3 * u
    # (x, top) — 폭 12, 바닥 y=76. 가장 높은 오른쪽 막대만 데이터 색.
    bars = [(26, 52, CHALK), (46, 36, CHALK), (66, 24, BLUE)]
    for x, top, color in bars:
        x0, y0 = pt(x, top)
        x1, y1 = pt(x + 12, 76)
        d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=color)


def draw_text_center(d, cx, cy, text, font, fill):
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    d.text((cx - (r - l) / 2 - l, cy - (b - t) / 2 - t), text, font=font, fill=fill)
