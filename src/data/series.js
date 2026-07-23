// 데모 시리즈 목록 — 새 데모 앱이 나오면 여기(그리고 다른 앱들의 같은 파일)에 추가한다.
export const SELF_ID = "dashboard-drop";

export const SERIES = [
  {
    id: "circuit-workout",
    name: "홈트 뽑기",
    desc: "홈트 서킷 랜덤 생성기 + 음성 가이드 타이머",
    url: "https://circuit-workout-two.vercel.app",
  },
  {
    id: "lunch-pick",
    name: "점심 뽑기",
    desc: "팀 점심 메뉴 룰렛 — 최근 간 곳은 빼고",
    url: "https://itda-demo-lunch-pick.vercel.app",
  },
  {
    id: "fix-guide",
    name: "고장 길잡이",
    desc: "현장 AS 이슈 대응 가이드 — 오프라인 동작",
    url: "https://itda-demo-fix-guide.vercel.app",
  },
  {
    id: "ondevice-ai",
    name: "온디바이스 AI",
    desc: "내 기기에서 쓸 수 있는 AI 탐지·검증",
    url: "https://itda-demo-ondevice-ai.vercel.app",
  },
  {
    id: "receipt-box",
    name: "영수증 정리함",
    desc: "영수증 사진 드래그 → 분류·집계·CSV",
    url: "https://itda-demo-receipt-box.vercel.app",
  },
  {
    id: "dashboard-drop",
    name: "모두의 대시보드",
    desc: "CSV를 끌어놓으면 즉석 대시보드",
    url: "https://itda-demo-dashboard-drop.vercel.app",
  },
];

export const REPO_URL = "https://github.com/itda-demo-apps/demo-dashboard-drop";
