import { useMemo, useRef, useState } from "react";

import Header from "../components/Header";
import InstallHint from "../components/InstallHint";
import SeriesLinks from "../components/SeriesLinks";
import BarChart from "../components/BarChart";
import LineChart from "../components/LineChart";
import DonutChart from "../components/DonutChart";
import { decodeFile, parseCSV, inferColumns, aggregate, toNumber, fmtNum } from "../csv";
import { SAMPLES } from "../data/samples";

// 입금상태 자동 감지 — 값 집합이 이 토큰들의 부분집합인 카테고리 컬럼을 상태 컬럼으로 본다
const STATUS_TOKENS = ["완료", "대기", "취소", "미입금", "입금"];
const PENDING_TOKENS = ["대기", "미입금"];

// 상태 → 배지 톤
function statusTone(v) {
  if (v === "완료" || v === "입금") return "ok";
  if (v === "대기") return "warn";
  return "bad"; // 취소·미입금
}

export default function HomeView({ view, setView }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // {name, headers, rows, cols}
  const [yIdx, setYIdx] = useState(null); // 값(숫자) 컬럼 idx — 전역
  const [mode, setMode] = useState("sum"); // sum | avg | count — 전역
  const [filters, setFilters] = useState({}); // { colIdx: 선택값 } — "" 은 전체
  const fileRef = useRef(null);

  const load = (name, text) => {
    const { headers, rows } = parseCSV(text);
    if (!headers.length || !rows.length) {
      setError("데이터를 읽지 못했어요 — 첫 줄에 컬럼명이 있는 CSV인지 확인해 주세요");
      return;
    }
    const cols = inferColumns(headers, rows);
    // 값 후보 = 식별자(순번·번호 등, csv.js identifier)를 뺀 숫자 컬럼.
    // 기본 값: 금액성 우선순위(합계>금액·매출·가액·결제>수량) → 없으면 첫 (비식별자) 숫자 컬럼.
    const numCols = cols.filter((c) => c.type === "number" && !c.identifier);
    const AMOUNT_PRIORITY = [/합계|총액/, /금액|매출|가액|결제|revenue|sales/i, /수량|qty/i];
    let numCol = null;
    for (const re of AMOUNT_PRIORITY) {
      numCol = numCols.find((c) => re.test(c.name));
      if (numCol) break;
    }
    if (!numCol) numCol = numCols[0] || null;
    setData({ name, headers, rows, cols });
    setYIdx(numCol ? numCol.idx : null);
    setMode(numCol ? "sum" : "count");
    setFilters({});
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

  const yCol = data?.cols.find((c) => c.idx === yIdx);
  const modeName = { sum: "합계", avg: "평균", count: "건수" }[mode];

  // ── 컬럼 역할 자동 배정 ──
  const roles = useMemo(() => {
    if (!data) return null;
    const cats = data.cols.filter((c) => c.type === "category" && c.unique >= 2 && c.unique <= 30);
    const catsByUnique = [...cats].sort((a, b) => a.unique - b.unique);
    const dateCol = data.cols.find((c) => c.type === "date") || null;
    // 필터 컬럼: 고유값 적은 순 최대 4
    const filterCols = catsByUnique.slice(0, 4);
    // 막대 차트 컬럼: 고유값 적은 순 최대 3
    const barCols = catsByUnique.slice(0, 3);
    // 상태 컬럼 감지
    const statusCol =
      data.cols.find((c) => {
        if (c.type !== "category" || c.unique > 6) return false;
        const vals = [...new Set(data.rows.map((r) => String(r[c.idx] ?? "").trim()).filter(Boolean))];
        return vals.length > 0 && vals.every((v) => STATUS_TOKENS.includes(v));
      }) || null;
    // 도넛 컬럼: unique<=6 중 필터에 안 쓴 것 우선, 없으면 첫 번째
    const donutCandidates = cats.filter((c) => c.unique <= 6);
    const filterIdx = new Set(filterCols.map((c) => c.idx));
    const donutCol =
      donutCandidates.find((c) => !filterIdx.has(c.idx)) || donutCandidates[0] || null;
    return { dateCol, filterCols, barCols, statusCol, donutCol };
  }, [data]);

  // ── 필터 적용 ──
  const filteredRows = useMemo(() => {
    if (!data) return [];
    const active = Object.entries(filters).filter(([, v]) => v !== "");
    if (!active.length) return data.rows;
    return data.rows.filter((r) => active.every(([idx, v]) => String(r[Number(idx)] ?? "").trim() === v));
  }, [data, filters]);

  const filtersActive = Object.values(filters).some((v) => v !== "");

  // ── KPI ──
  const kpi = useMemo(() => {
    if (!data) return null;
    const count = filteredRows.length;
    let sum = null;
    let avg = null;
    if (yCol) {
      const nums = filteredRows.map((r) => toNumber(r[yCol.idx])).filter((n) => !isNaN(n));
      sum = nums.reduce((s, n) => s + n, 0);
      avg = nums.length ? sum / nums.length : 0;
    }
    // 대기(미입금) KPI
    let pending = null;
    if (roles?.statusCol) {
      const rows = filteredRows.filter((r) => PENDING_TOKENS.includes(String(r[roles.statusCol.idx] ?? "").trim()));
      const amt = yCol ? rows.reduce((s, r) => s + (isNaN(toNumber(r[yCol.idx])) ? 0 : toNumber(r[yCol.idx])), 0) : null;
      pending = { count: rows.length, amount: amt };
    }
    return { count, sum, avg, pending };
  }, [data, filteredRows, yCol, roles]);

  // ── 차트 데이터 ──
  const lineAgg = useMemo(() => {
    if (!data || !roles?.dateCol || (mode !== "count" && !yCol)) return null;
    return aggregate(filteredRows, roles.dateCol, yCol, mode);
  }, [data, roles, filteredRows, yCol, mode]);

  const barAggs = useMemo(() => {
    if (!data || !roles || (mode !== "count" && !yCol)) return [];
    return roles.barCols
      .map((col) => ({ col, agg: aggregate(filteredRows, col, yCol, mode) }))
      .filter((b) => b.agg && b.agg.items.length > 0);
  }, [data, roles, filteredRows, yCol, mode]);

  const donutAgg = useMemo(() => {
    if (!data || !roles?.donutCol || (mode !== "count" && !yCol)) return null;
    return aggregate(filteredRows, roles.donutCol, yCol, mode);
  }, [data, roles, filteredRows, yCol, mode]);

  const valLabel = mode === "count" ? "건수" : `${yCol?.name} ${modeName}`;

  return (
    <div className="app">
      <Header view={view} setView={setView} />
      <InstallHint />

      {!data ? (
        <>
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

          {/* 전역 값·집계 컨트롤 */}
          <div className="ctrl-row">
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
                  .filter((c) => c.type === "number" && !c.identifier)
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

          {/* 필터 행 — 카테고리 컬럼별 셀렉트 (모든 차트·KPI·표에 공통 적용) */}
          {roles?.filterCols.length > 0 && (
            <div className="filter-bar">
              {roles.filterCols.map((col) => {
                const opts = [...new Set(data.rows.map((r) => String(r[col.idx] ?? "").trim()).filter(Boolean))].sort();
                return (
                  <label key={col.idx} className="filter">
                    <span className="filter-label">{col.name}</span>
                    <select
                      className="input filter-select"
                      value={filters[col.idx] ?? ""}
                      onChange={(e) => setFilters((f) => ({ ...f, [col.idx]: e.target.value }))}
                    >
                      <option value="">전체</option>
                      {opts.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
              <button className="btn filter-reset" disabled={!filtersActive} onClick={() => setFilters({})}>
                필터 초기화
              </button>
            </div>
          )}

          {/* KPI */}
          <div className="kpi-row">
            {kpi.sum != null && (
              <div className="kpi">
                <div className="kpi-label">{yCol.name} 합계</div>
                <div className="display kpi-value">{fmtNum(kpi.sum)}</div>
              </div>
            )}
            <div className="kpi">
              <div className="kpi-label">건수</div>
              <div className="display kpi-value">{fmtNum(kpi.count)}</div>
            </div>
            {kpi.avg != null && (
              <div className="kpi">
                <div className="kpi-label">{yCol.name} 평균</div>
                <div className="display kpi-value">{fmtNum(kpi.avg)}</div>
              </div>
            )}
            {kpi.pending && (
              <div className="kpi kpi--warn">
                <div className="kpi-label">미입금·대기</div>
                <div className="display kpi-value">{kpi.pending.amount != null ? fmtNum(kpi.pending.amount) : fmtNum(kpi.pending.count)}</div>
                <div className="kpi-sub">{kpi.pending.count.toLocaleString("ko-KR")}건 대기</div>
              </div>
            )}
          </div>

          {/* 자동 차트 그리드 */}
          <div className="charts-grid">
            {lineAgg && lineAgg.items.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">{roles.dateCol.name}별 {valLabel} 추이</div>
                <LineChart items={lineAgg.items} />
              </div>
            )}
            {barAggs.map(({ col, agg }) => (
              <div className="chart-card" key={col.idx}>
                <div className="chart-title">{col.name}별 {valLabel}</div>
                <BarChart items={agg.items} />
              </div>
            ))}
            {donutAgg && donutAgg.items.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">{roles.donutCol.name} 구성비</div>
                <DonutChart items={donutAgg.items} />
              </div>
            )}
          </div>

          {/* 거래 내역 표 (필터 적용) */}
          <div className="list-label">
            거래 내역 (필터 적용, {filteredRows.length.toLocaleString("ko-KR")}건)
          </div>
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
                {filteredRows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    {data.headers.map((_, j) => {
                      const cell = r[j];
                      if (roles?.statusCol && j === roles.statusCol.idx && STATUS_TOKENS.includes(String(cell ?? "").trim())) {
                        return (
                          <td key={j}>
                            <span className={`badge badge--${statusTone(String(cell).trim())}`}>{cell}</span>
                          </td>
                        );
                      }
                      return <td key={j}>{cell}</td>;
                    })}
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
