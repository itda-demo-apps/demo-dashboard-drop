# 대시보드 드롭 (demo-dashboard-drop)

CSV 즉석 대시보드 PWA. 교육용 데모 시리즈 B축 — 원형은 교육 실습 과제 'Drop 매출 대시보드'(수강생 결과물 패턴 ④). "실습 한 조각 → 완성 제품" 도약을 보여주는 것이 목적.

## 배경과 목적

사용자 문제: 매출·실적 CSV를 훑어보고 싶은데, 클라우드 BI 도구에 회사 데이터를 올리는 것이 보안 규정상 막혀 있거나 부담스럽다.
해결 접근: CSV를 끌어다 놓으면 KPI·순위·시계열이 즉석에서 생성 — **파싱·집계·렌더 전 과정이 브라우저 안(무전송)**. 매출 데이터가 서버로 나가지 않는다. 새로고침하면 사라지는 것이 의도(파일 흔적을 남기지 않는다).

## 실행

```bash
npm install
npm run dev / build / preview
npm run icons                       # 아이콘 재생성 (Pillow)
python3 scripts/generate-og.py      # OG 이미지 — 저장소 루트에서 실행
python3 scripts/generate-splash.py  # iOS 스플래시 17종 — 저장소 루트에서 실행
```

## 구조

```
src/
  main.jsx               # 엔트리 — SW 등록
  App.jsx                # 화면 전환(home/contact)
  csv.js                 # CSV 정본 — 디코딩·파싱·타입 추론·집계·숫자 포맷
  data/samples.js        # 샘플 CSV 생성기 4종(카페·쇼핑몰·고객센터·채용, 결정론적) — SAMPLES 배열
  data/series.js         # 데모 시리즈 목록
  views/
    HomeView.jsx         # 드롭존 + 파일 바 + KPI + 축·값·집계 컨트롤 + 차트 + 표 미리보기
    ContactView.jsx      # 문의 폼 (시리즈 공용 패턴)
  components/
    BarChart.jsx         # 가로 순위 막대 (단일 색 #4E8FD9, 데이터 끝 4px 라운드, 호버 툴팁)
    LineChart.jsx        # 시계열 라인 (2px 선, 크로스헤어+마커, 은은한 그리드)
    Header.jsx           # 대시보드/문의 탭
    InstallHint.jsx, SeriesLinks.jsx  # 시리즈 공용
api/contact.js           # 문의 폼 → Telegram
scripts/                 # PIL 아이콘/OG/스플래시 (막대 3개 도안, draw_bars)
```

## 핵심 로직

- **csv.js — 인코딩·파싱·집계 정본**: 디코딩은 UTF-8로 먼저 읽고 깨진 문자(`�`) 개수가 0이 아니면 EUC-KR로 재디코딩(엑셀 "CSV로 저장" = CP949 대응) + BOM 제거. 구분자는 첫 줄에서 쉼표/탭/세미콜론 중 최다를 자동 선택. 파서는 따옴표·이스케이프(`""`)·필드 내 개행을 처리. 타입 추론은 컬럼 값의 80% 이상이 날짜면 `date`, 숫자면 `number`, 아니면 `category`(80% 규칙). `aggregate`는 카테고리축이면 값 내림차순 상위 10 + 나머지를 "그 외 N개"로 접고(시리즈를 늘리지 않는다), 날짜축이면 시간순 정렬 후 62건 초과 시 월(YYYY-MM) 단위로 리버킷.
- **차트 규약 (dataviz 스킬 적용)**: 단일 시리즈는 **단일 색 `#4E8FD9`** 하나만 쓴다 — 시리즈 5색 세트는 다크 서피스에서 CVD(색각) 검증 FAIL이라 다색 시리즈를 금지한다(정체성은 축 라벨이 담당). 축은 하나, 마크는 얇게 + 데이터 끝만 4px 라운드, 호버 툴팁은 카드 하단에 상시 노출, 단일 시리즈라 범례 없음. 표 뷰는 차트와 별개로 항상 제공. SVG 안 텍스트는 텍스트 토큰 색(`--text-dim`)을 `fill`로 준다.
- **데이터 수명**: 파일 내용은 React 상태(`HomeView`의 `data`)에만 존재하고 localStorage·IndexedDB·서버 어디에도 저장하지 않는다. **새로고침 = 초기화가 의도** — 민감한 매출 데이터의 흔적을 남기지 않는다.
- **샘플 데이터 (`samples.js`)**: 파일 없이 즉시 시연하도록 **도메인 4종**을 내장 — `SAMPLES` 배열의 각 항목은 `{ id, name, emoji, desc, make }`이고 `make()`가 CSV 문자열(첫 줄 헤더)을 반환한다. ① 카페 매출(날짜/지점/메뉴/수량/매출액, 주말 증가) ② 쇼핑몰 주문(날짜/카테고리/상품명/수량/결제금액/배송지역, 주말·격주 프로모션 증가) ③ 고객센터 문의(날짜/채널/문의유형/처리시간, 월요일 최다) ④ 채용 지원(지원일/포지션/유입경로/서류점수). 전부 도메인별 고정 seed의 선형 합동 의사난수(Math.random 금지)로 **빌드마다 동일한 모양**을 생성(결정론적). HomeView 드롭존 아래 이모지 칩 그리드에서 선택 → `load()`.
- **PWA**: 앱 셸만 프리캐시 — 사용자 데이터는 애초에 로컬(상태)이라 오프라인 완결. 폰트는 런타임 캐시.

## 규약 (데모 시리즈 공통)

- UI·주석 한국어. 배경 `#1E2126`(주철)·텍스트 `#F2EFE9`(초크), 데이터 색은 단일 `#4E8FD9`. Black Han Sans + Noto Sans KR.
- 앱 아이콘: 막대 차트 3개(바닥 y=76 앵커, 가장 높은 오른쪽 막대만 데이터 색). 재생성 `npm run icons`.
- 모바일 퍼스트(maxWidth 480). 입력 필드 font-size 16px(iOS 자동 확대 방지).
- **시리즈 상호 링크 + 교육 카드**: `data/series.js` — 새 데모 앱 추가 시 모든 형제 앱 갱신·재배포(마스터 지시 2026-07-22).
- SEO·교육 홍보 규약: sitemap/robots·JSON-LD creator(잇다)·푸터 교육 카드 적용됨.

## 배포

- Vercel 프로젝트 `itda-demo-dashboard-drop`, 프로덕션 https://itda-demo-dashboard-drop.vercel.app
- 문의 폼: Vercel 환경변수 `TELEGRAM_BOT_TOKEN`·`TELEGRAM_CHAT_ID`(Production) — 원본 `~/Apps/demo-apps/.env`
- 강의 배포 관례: 프로덕션 URL → QR. 샘플 데이터 → CSV 드롭 시연이 모바일 시연 포인트.

## 미착수 / 로드맵 후보

- [ ] XLSX 직접 지원 — 지금은 "CSV로 저장" 한 단계를 거쳐야 함. SheetJS 의존성 추가 여부 검토(번들·라이선스 트레이드오프)
- [ ] 다중 차트 동시 표시 — 축을 바꿔가며 여러 뷰를 한 화면에
- [ ] 대시보드 구성 저장 — 무전송 원칙과 충돌 없이(로컬 저장) 축·값 선택을 기억
