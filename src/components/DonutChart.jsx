import { useState } from "react";

// 도넛(구성비) — 시리즈 5색 고정 순서. 세그먼트 사이 2px 간격은 배경 #1E2126 링이 드러난 것으로,
// 색만으로 구분이 어려운 CVD 사용자를 위한 보조 인코딩(간격) + 범례(색점·라벨·%)가 정체성을 이중으로 보장한다.
const PALETTE = ["#E4574B", "#E8B93E", "#4E8FD9", "#57A867", "#D96BA0"];
const R = 35;
const SW = 18;
const CX = 50;
const CY = 50;
const C = 2 * Math.PI * R;
const GAP = 2; // 세그먼트 사이 간격(user unit) — #1E2126 base 링이 드러남

export default function DonutChart({ items, unit }) {
  const [hover, setHover] = useState(null);

  // 6개 초과 시 상위 5 + 기타 (시리즈를 늘리지 않는다)
  let segs = items;
  if (items.length > 6) {
    const rest = items.slice(5);
    segs = [...items.slice(0, 5), { label: "기타", value: rest.reduce((s, x) => s + x.value, 0), etc: true }];
  }
  const total = segs.reduce((s, x) => s + x.value, 0) || 1;

  let acc = 0;
  const arcs = segs.map((s, i) => {
    const frac = s.value / total;
    const len = frac * C;
    const dashLen = Math.max(0, len - GAP);
    const arc = {
      seg: s,
      i,
      frac,
      color: PALETTE[i % PALETTE.length],
      dash: `${dashLen} ${C - dashLen}`,
      offset: -acc,
    };
    acc += len;
    return arc;
  });

  return (
    <div className="chart-wrap">
      <div className="donut-layout">
        <svg viewBox="0 0 100 100" className="donut-svg" role="img" aria-label="구성비 도넛 차트">
          {/* base 링 — 세그먼트 간격 사이로 드러나 2px 구분선이 된다 */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1E2126" strokeWidth={SW} />
          {arcs.map((a) => (
            <circle
              key={a.seg.label}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={SW}
              strokeDasharray={a.dash}
              strokeDashoffset={a.offset}
              transform={`rotate(-90 ${CX} ${CY})`}
              opacity={hover === null || hover === a.i ? 1 : 0.4}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(a.i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          <text x={CX} y={CY - 1} textAnchor="middle" className="donut-center-num">
            {hover === null ? segs.length : `${Math.round(arcs[hover].frac * 100)}%`}
          </text>
          <text x={CX} y={CY + 9} textAnchor="middle" className="donut-center-label">
            {hover === null ? "항목" : segs[hover].label.length > 6 ? segs[hover].label.slice(0, 6) + "…" : segs[hover].label}
          </text>
        </svg>
        <div className="donut-legend">
          {arcs.map((a) => (
            <div
              key={a.seg.label}
              className={`donut-leg ${hover === a.i ? "donut-leg--on" : ""}`}
              onMouseEnter={() => setHover(a.i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="dot" style={{ background: a.color }} />
              <span className="donut-leg-name">{a.seg.label}</span>
              <span className="donut-leg-pct">{Math.round(a.frac * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      {hover !== null && (
        <div className="chart-tip">
          {segs[hover].label} — <b>{segs[hover].value.toLocaleString("ko-KR")}</b>
          {unit && ` ${unit}`} ({Math.round(arcs[hover].frac * 100)}%)
        </div>
      )}
    </div>
  );
}
