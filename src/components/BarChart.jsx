import { useState } from "react";

import { fmtNum } from "../csv";

const BAR_COLOR = "#4E8FD9"; // 단일 시리즈 단일 색 — 정체성은 축 라벨이 담당(dataviz 규약)
const BAR_H = 26;
const GAP = 10;
const LABEL_W = 96;

// 가로 막대 — 순위·크기 비교. 데이터 끝만 4px 라운드, 호버 시 강조+툴팁.
export default function BarChart({ items, unit }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  const W = 420;
  const VALUE_W = 52; // 막대 끝 값 라벨(fmtNum) 전용 거터 — 최대값 막대에서 우측 잘림 방지
  const plotW = W - LABEL_W - 8 - VALUE_W;
  const H = items.length * (BAR_H + GAP);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="분류별 막대 차트">
        {items.map((it, i) => {
          const y = i * (BAR_H + GAP);
          const w = Math.max(2, (it.value / max) * plotW);
          const r = Math.min(4, w / 2);
          const x0 = LABEL_W + 8;
          const active = hover === i;
          return (
            <g
              key={it.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* 히트 타깃은 마크보다 크게 */}
              <rect x="0" y={y} width={W} height={BAR_H + GAP - 2} fill="transparent" />
              <text x={LABEL_W} y={y + BAR_H / 2 + 4} textAnchor="end" className="chart-label">
                {it.label.length > 8 ? it.label.slice(0, 8) + "…" : it.label}
              </text>
              <path
                d={`M${x0},${y + 2} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${BAR_H - 4 - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - r)} z`}
                fill={BAR_COLOR}
                opacity={it.etc ? 0.4 : hover === null || active ? 1 : 0.55}
              />
              <text x={x0 + w + 6} y={y + BAR_H / 2 + 4} className="chart-value">
                {fmtNum(it.value)}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && items[hover] && (
        <div className="chart-tip">
          {items[hover].label} — <b>{items[hover].value.toLocaleString("ko-KR")}</b>
          {unit && ` ${unit}`}
        </div>
      )}
    </div>
  );
}
