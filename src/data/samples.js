// 샘플 데이터 4종 — 파일 없이 즉시 시연(도메인 선택). 각 make()는 CSV 문자열(첫 줄 헤더) 반환.
// 전부 결정론적 의사난수(선형 합동, 고정 seed) — 빌드마다 동일한 모양. Math.random 금지.

// 선형 합동 생성기 — seed를 받아 [0,1) 난수 함수를 돌려준다
function makeRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

// 3개월치 날짜 순회 — start부터 days일, (date, weekday, index) 콜백
function forEachDay(start, days, cb) {
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cb(d, dateStr, i);
  }
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function toCSV(rows) {
  return rows.map((r) => r.join(",")).join("\n");
}

// ─── 카페 매출 (기존 sample.js 이관) ───
function makeCafe() {
  const rand = makeRand(20260501);
  const BRANCHES = ["강남점", "역삼점", "판교점", "성수점", "홍대점"];
  const ITEMS = [
    ["아메리카노", 4500],
    ["카페라떼", 5000],
    ["바닐라라떼", 5500],
    ["콜드브루", 5300],
    ["샌드위치", 6800],
    ["치즈케이크", 6200],
  ];
  const rows = [["날짜", "지점", "메뉴", "수량", "매출액"]];
  const start = new Date(2026, 4, 1); // 5/1부터 3개월
  forEachDay(start, 92, (d, dateStr) => {
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    for (const branch of BRANCHES) {
      for (const [item, price] of ITEMS) {
        if (rand() < 0.25) continue; // 매일 모든 조합이 팔리진 않는다
        const qty = Math.max(1, Math.round(rand() * (weekend ? 28 : 20)));
        rows.push([dateStr, branch, item, String(qty), String(qty * price)]);
      }
    }
  });
  return toCSV(rows);
}

// ─── 쇼핑몰 주문 — 주말·프로모션 주간에 주문 증가 ───
function makeShop() {
  const rand = makeRand(20260815);
  const CATS = {
    의류: [["기본 티셔츠", 19000], ["데님 팬츠", 49000], ["니트 가디건", 59000]],
    잡화: [["에코백", 22000], ["볼캡", 27000], ["가죽 지갑", 68000]],
    뷰티: [["수분 크림", 32000], ["립밤 세트", 18000], ["선크림", 24000]],
    식품: [["원두 1kg", 28000], ["견과류 세트", 21000], ["수제 잼", 15000]],
    가전: [["무선 이어폰", 89000], ["미니 가습기", 39000], ["보조배터리", 34000]],
  };
  const REGIONS = ["서울", "경기", "부산", "대구", "기타"];
  const rows = [["날짜", "카테고리", "상품명", "수량", "결제금액", "배송지역"]];
  const start = new Date(2026, 7, 1); // 8/1부터 3개월
  forEachDay(start, 92, (d, dateStr) => {
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const promoWeek = Math.floor(d.getDate() / 7) % 2 === 0; // 격주 프로모션 주간
    const base = 6 + (weekend ? 5 : 0) + (promoWeek ? 4 : 0);
    const orders = Math.max(1, Math.round(base * (0.6 + rand() * 0.8)));
    for (let k = 0; k < orders; k++) {
      const cat = pick(rand, Object.keys(CATS));
      const [name, price] = pick(rand, CATS[cat]);
      const qty = 1 + Math.floor(rand() * 3);
      rows.push([dateStr, cat, name, String(qty), String(qty * price), pick(rand, REGIONS)]);
    }
  });
  return toCSV(rows);
}

// ─── 고객센터 문의 — 월요일 문의량 최다 ───
function makeSupport() {
  const rand = makeRand(20260310);
  const CHANNELS = ["전화", "채팅", "이메일"];
  const TYPES = ["배송", "환불", "사용법", "불만", "기타"];
  const rows = [["날짜", "채널", "문의유형", "처리시간(분)"]];
  const start = new Date(2026, 2, 1); // 3/1부터 3개월
  forEachDay(start, 92, (d, dateStr) => {
    const dow = d.getDay();
    const mondayBoost = dow === 1 ? 8 : dow === 0 || dow === 6 ? -3 : 0; // 월요일 최다, 주말 감소
    const count = Math.max(1, Math.round((10 + mondayBoost) * (0.6 + rand() * 0.8)));
    for (let k = 0; k < count; k++) {
      const mins = 5 + Math.floor(rand() * 56); // 5~60분
      rows.push([dateStr, pick(rand, CHANNELS), pick(rand, TYPES), String(mins)]);
    }
  });
  return toCSV(rows);
}

// ─── 채용 지원 현황 — 지원일·포지션·유입경로·서류점수 ───
function makeHR() {
  const rand = makeRand(20260620);
  const POSITIONS = ["영업", "개발", "디자인", "CS", "마케팅"];
  const SOURCES = ["잡코리아", "사람인", "링크드인", "추천", "홈페이지"];
  const rows = [["지원일", "포지션", "유입경로", "서류점수"]];
  const start = new Date(2026, 5, 1); // 6/1부터 3개월
  forEachDay(start, 92, (d, dateStr) => {
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const count = Math.max(0, Math.round((weekend ? 3 : 7) * (0.5 + rand())));
    for (let k = 0; k < count; k++) {
      const score = 60 + Math.floor(rand() * 41); // 60~100
      rows.push([dateStr, pick(rand, POSITIONS), pick(rand, SOURCES), String(score)]);
    }
  });
  return toCSV(rows);
}

export const SAMPLES = [
  { id: "cafe", name: "카페 매출", emoji: "☕", desc: "가상 카페 3개월 매출", make: makeCafe },
  { id: "shop", name: "쇼핑몰 주문", emoji: "📦", desc: "카테고리별 주문·결제·배송", make: makeShop },
  { id: "support", name: "고객센터 문의", emoji: "🎧", desc: "채널·유형별 문의·처리시간", make: makeSupport },
  { id: "hr", name: "채용 지원 현황", emoji: "🧑‍💼", desc: "포지션·유입경로·서류점수", make: makeHR },
];
