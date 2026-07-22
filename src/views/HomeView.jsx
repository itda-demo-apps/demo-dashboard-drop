import { useMemo, useRef, useState } from "react";

import Header from "../components/Header";
import InstallHint from "../components/InstallHint";
import SeriesLinks from "../components/SeriesLinks";
import BarChart from "../components/BarChart";
import LineChart from "../components/LineChart";
import { decodeFile, parseCSV, inferColumns, aggregate, toNumber, fmtNum } from "../csv";
import { SAMPLES } from "../data/samples";

export default function HomeView({ view, setView }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // {name, headers, rows, cols}
  const [xIdx, setXIdx] = useState(null); // 축 컬럼 idx
  const [yIdx, setYIdx] = useState(null); // 값 컬럼 idx
  const [mode, setMode] = useState("sum"); // sum | avg | count
  const fileRef = useRef(null);

  const load = (name, text) => {
    const { headers, rows } = parseCSV(text);
    if (!headers.length || !rows.length) {
      setError("데이터를 읽지 못했어요 — 첫 줄에 컬럼명이 있는 CSV인지 확인해 주세요");
      return;
    }
    const cols = inferColumns(headers, rows);
    // 기본 축: 날짜 컬럼 우선, 없으면 고유값 적은 카테고리. 값: 첫 숫자 컬럼.
    const dateCol = cols.find((c) => c.type === "date");
    const catCol = [...cols].filter((c) => c.type === "category" && c.unique <= 30).sort((a, b) => a.unique - b.unique)[0];
    const numCol = cols.find((c) => c.type === "number");
    setData({ name, headers, rows, cols });
    setXIdx((dateCol || catCol || cols[0]).idx);
    setYIdx(numCol ? numCol.idx : null);
    setMode(numCol ? "sum" : "count");
    setError("");
  };

  const handleFiles = async (files) => {
    const file = [...(files || [])].find((f) => /\.(csv|tsv|txt)$/i.test(f.name));
    if (!file) {
      setError("CSV 파일을 올려주세요 — 엑셀은 '다른 이름으로 저장 → CSV'로 변환하면 돼요");
      return;
    }
    load(file.name, await decodeFile(file));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const xCol = data?.cols.find((c) => c.idx === xIdx);
  const yCol = data?.cols.find((c) => c.idx === yIdx);
  const agg = useMemo(() => {
    if (!data || !xCol || (mode !== "count" && !yCol)) return null;
    return aggregate(data.rows, xCol, yCol, mode);
  }, [data, xCol, yCol, mode]);

  // KPI — 값 컬럼 기준 합계·평균
  const kpi = useMemo(() => {
    if (!data || !yCol) return null;
    const nums = data.rows.map((r) => toNumber(r[yCol.idx])).filter((n) => !isNaN(n));
    const sum = nums.reduce((s, n) => s + n, 0);
    return { sum, avg: nums.length ? sum / nums.length : 0 };
  }, [data, yCol]);

  const modeName = { sum: "합계", avg: "평균", count: "건수" }[mode];

  return (
    <div className="app">
      <Header view={view} setView={setView} />
      <InstallHint />

      {!data ? (
        <>
          {/* 드롭존 */}
          <button
            className={`dropzone ${dragOver ? "dropzone--over" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <span className="dropzone-icon">📊</span>
            <span className="dropzone-main">CSV 파일을 끌어다 놓으세요</span>
            <span className="dropzone-sub">엑셀 표는 "다른 이름으로 저장 → CSV" 후에 — 한글(EUC-KR) 인코딩도 알아서 읽어요</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv"
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="list-label">샘플 데이터로 구경하기</div>
          <div className="sample-row">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                className="btn sample-btn"
                onClick={() => load(`샘플 — ${s.name}.csv`, s.make())}
                title={s.desc}
              >
                <span className="sample-emoji">{s.emoji}</span>
                {s.name}
              </button>
            ))}
          </div>
          {error && <div className="dz-error">{error}</div>}
          <div className="privacy-note">파일은 브라우저 안에서만 처리돼요 — 서버 업로드 없음</div>
        </>
      ) : (
        <>
          {/* 파일 정보 + 다시 열기 */}
          <div className="file-bar">
            <span className="file-name">📄 {data.name}</span>
            <span className="file-meta">{data.rows.length.toLocaleString("ko-KR")}행</span>
            <button className="btn file-reset" onClick={() => setData(null)}>
              다른 파일
            </button>
          </div>

          {/* KPI 타일 */}
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-label">행 수</div>
              <div className="display kpi-value">{fmtNum(data.rows.length)}</div>
            </div>
            {kpi && (
              <>
                <div className="kpi">
                  <div className="kpi-label">{yCol.name} 합계</div>
                  <div className="display kpi-value">{fmtNum(kpi.sum)}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">{yCol.name} 평균</div>
                  <div className="display kpi-value">{fmtNum(kpi.avg)}</div>
                </div>
              </>
            )}
          </div>

          {/* 축·값·집계 선택 */}
          <div className="ctrl-row">
            <label className="ctrl">
              <span className="ctrl-label">기준(축)</span>
              <select className="input ctrl-select" value={xIdx ?? ""} onChange={(e) => setXIdx(Number(e.target.value))}>
                {data.cols
                  .filter((c) => c.type !== "number" || c.unique <= 15)
                  .map((c) => (
                    <option key={c.idx} value={c.idx}>
                      {c.name} {c.type === "date" ? "(날짜)" : ""}
                    </option>
                  ))}
              </select>
            </label>
            <label className="ctrl">
              <span className="ctrl-label">값</span>
              <select
                className="input ctrl-select"
                value={yIdx ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setYIdx(v === "" ? null : Number(v));
                  if (v === "") setMode("count");
                  else if (mode === "count") setMode("sum");
                }}
              >
                <option value="">건수만</option>
                {data.cols
                  .filter((c) => c.type === "number")
                  .map((c) => (
                    <option key={c.idx} value={c.idx}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="ctrl">
              <span className="ctrl-label">집계</span>
              <div className="ctrl-chips">
                {["sum", "avg", "count"].map((m) => (
                  <button
                    key={m}
                    className={`btn mode-chip ${mode === m ? "mode-chip--on" : ""}`}
                    disabled={m !== "count" && !yCol}
                    onClick={() => setMode(m)}
                  >
                    {{ sum: "합계", avg: "평균", count: "건수" }[m]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 차트 — 날짜축이면 라인, 아니면 순위 막대 */}
          {agg && agg.items.length > 0 && (
            <div className="chart-card">
              <div className="chart-title">
                {xCol.name}별 {mode === "count" ? "건수" : `${yCol.name} ${modeName}`}
              </div>
              {agg.kind === "time" ? <LineChart items={agg.items} /> : <BarChart items={agg.items} />}
            </div>
          )}

          {/* 표 미리보기 — 테이블 뷰 상시 제공 */}
          <div className="list-label">데이터 미리보기 (상위 8행)</div>
          <div className="table-scroll">
            <table className="preview-table">
              <thead>
                <tr>
                  {data.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    {data.headers.map((_, j) => (
                      <td key={j}>{r[j]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="privacy-note">모든 계산은 브라우저 안 — 이 화면을 닫으면 데이터도 사라져요</div>
        </>
      )}

      <SeriesLinks />
    </div>
  );
}
