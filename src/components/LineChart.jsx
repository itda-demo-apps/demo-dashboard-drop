import { useRef, useState } from "react";

import { fmtNum } from "../csv";

const LINE_COLOR = "#4E8FD9";
const W = 420;
const H = 200;
const PAD = { l: 44, r: 10, t: 10, b: 24 };

// 시계열 라인 — 2px 선, 호버 크로스헤어+마커+툴팁, 은은한 그리드(dataviz 규약)
export default function LineChart({ items, unit }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const x = (i) => PAD.l + (items.length === 1 ? plotW / 2 : (i / (items.length - 1)) * plotW);
  const y = (v) => PAD.t + plotH - (v / max) * plotH;
  const path = items.map((it, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(it.value).toFixed(1)}`).join(" ");
  const baseline = PAD.t + plotH;
  const areaPath = `${path} L${x(items.length - 1).toFixed(1)},${baseline.toFixed(1)} L${x(0).toFixed(1)},${baseline.toFixed(1)} Z`;

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / plotW) * (items.length - 1));
    setHover(Math.max(0, Math.min(items.length - 1, i)));
  };

  const yTicks = [0, 0.5, 1].map((t) => max * t);
  const xTickIdx = items.length <= 6 ? items.map((_, i) => i) : [0, Math.floor((items.length - 1) / 2), items.length - 1];

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        role="img"
        aria-label="시계열 라인 차트"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={PAD.l - 6} y={y(v) + 3.5} textAnchor="end" className="chart-label">
              {fmtNum(v)}
            </text>
          </g>
        ))}
        {xTickIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="chart-label">
            {items[i].label.slice(5)}
          </text>
        ))}
        <path d={areaPath} fill="rgba(78, 143, 217, 0.15)" stroke="none" />
        <path d={path} fill="none" stroke={LINE_COLOR} strokeWidth="2" strokeLinejoin="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + plotH} className="chart-crosshair" />
            <circle cx={x(hover)} cy={y(items[hover].value)} r="5" fill={LINE_COLOR} stroke="#1E2126" strokeWidth="2" />
          </g>
        )}
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
