// CSV 처리 정본 — 디코딩(UTF-8/EUC-KR 자동 판별)·파싱(따옴표/구분자)·타입 추론·집계.
// 전 과정 클라이언트 — 파일이 브라우저 밖으로 나가지 않는다.

// 한국 실무 CSV는 엑셀 "CSV로 저장"(CP949) 비중이 높다 — 깨진 문자 수로 인코딩 판별
export async function decodeFile(file) {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(buf);
  const broken = (utf8.match(/�/g) || []).length;
  if (broken === 0) return utf8.replace(/^﻿/, "");
  try {
    const euckr = new TextDecoder("euc-kr").decode(buf);
    return euckr.replace(/^﻿/, "");
  } catch {
    return utf8.replace(/^﻿/, "");
  }
}

// 구분자 판별: 첫 줄에서 쉼표/탭/세미콜론 중 최다
function detectDelimiter(text) {
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"));
  const counts = [",", "\t", ";"].map((d) => [d, firstLine.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

// 따옴표·개행 포함 필드를 처리하는 CSV 파서
export function parseCSV(text) {
  const delim = detectDelimiter(text);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map((h, i) => h.trim() || `열${i + 1}`);
  return { headers, rows: rows.slice(1) };
}

// 숫자 파싱 — 천단위 쉼표·통화·% 허용
export function toNumber(v) {
  if (v == null) return NaN;
  const s = String(v).trim().replace(/[,₩원%\s]/g, "");
  if (s === "" || isNaN(Number(s))) return NaN;
  return Number(s);
}

const DATE_RE = /^(\d{4})[-./년\s]\s*(\d{1,2})[-./월\s]\s*(\d{1,2})[일]?\.?$/;

export function toDate(v) {
  const m = String(v ?? "").trim().match(DATE_RE);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

// 컬럼 타입 추론: 값의 80% 이상이 숫자/날짜면 해당 타입, 아니면 카테고리
export function inferColumns(headers, rows) {
  return headers.map((name, idx) => {
    const values = rows.map((r) => r[idx]).filter((v) => String(v ?? "").trim() !== "");
    const n = values.length || 1;
    const numeric = values.filter((v) => !isNaN(toNumber(v))).length;
    const dates = values.filter((v) => toDate(v)).length;
    let type = "category";
    if (dates / n >= 0.8) type = "date";
    else if (numeric / n >= 0.8) type = "number";
    const unique = new Set(values.map((v) => String(v).trim())).size;
    return { name, idx, type, unique };
  });
}

// 집계 — xCol(category|date) × yCol(number), mode: sum|avg|count
export function aggregate(rows, xCol, yCol, mode) {
  const groups = new Map();
  for (const r of rows) {
    let key;
    let dateKey = null;
    if (xCol.type === "date") {
      const d = toDate(r[xCol.idx]);
      if (!d) continue;
      dateKey = d;
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else {
      key = String(r[xCol.idx] ?? "").trim() || "(빈값)";
    }
    const num = mode === "count" ? 1 : toNumber(r[yCol?.idx]);
    if (mode !== "count" && isNaN(num)) continue;
    const g = groups.get(key) || { label: key, sum: 0, n: 0, date: dateKey };
    g.sum += mode === "count" ? 1 : num;
    g.n += 1;
    groups.set(key, g);
  }
  let items = [...groups.values()].map((g) => ({
    label: g.label,
    date: g.date,
    value: mode === "avg" ? g.sum / g.n : g.sum,
  }));

  if (xCol.type === "date") {
    items.sort((a, b) => a.date - b.date);
    // 기간이 길면 월 단위로 리버킷
    if (items.length > 62) {
      const byMonth = new Map();
      for (const it of items) {
        const mk = it.label.slice(0, 7);
        const g = byMonth.get(mk) || { label: mk, value: 0, n: 0 };
        g.value += it.value;
        g.n += 1;
        byMonth.set(mk, g);
      }
      items = [...byMonth.values()].map((g) => ({
        label: g.label,
        value: mode === "avg" ? g.value / g.n : g.value,
      }));
    }
    return { items, kind: "time" };
  }

  items.sort((a, b) => b.value - a.value);
  // 상위 10 + 나머지는 "그 외"로 접기 — 시리즈를 늘리지 않는다
  if (items.length > 10) {
    const rest = items.slice(10);
    items = items.slice(0, 10);
    items.push({ label: `그 외 ${rest.length}개`, value: rest.reduce((s, x) => s + x.value, 0), etc: true });
  }
  return { items, kind: "rank" };
}

export function fmtNum(n) {
  if (!isFinite(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "억";
  if (abs >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, "") + "만";
  return Number.isInteger(n) ? n.toLocaleString("ko-KR") : n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}
