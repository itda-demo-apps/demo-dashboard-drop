// 경량 라우터 — 의존성 없이 history API. URL로 화면을 복원한다.
// 경로 체계:
//   /         대시보드(홈) — 데이터는 메모리라 홈 단일
//   /contact  문의
import { useEffect, useState } from "react";

// 현재 위치 → { view }
export function parseLocation(loc = window.location) {
  const path = (loc.pathname || "/").replace(/\/+$/, "") || "/";
  if (path === "/contact") return { view: "contact" };
  return { view: "home" }; // "/" 및 알 수 없는 경로 → 홈
}

const listeners = new Set();
function emit() {
  const r = parseLocation();
  listeners.forEach((fn) => fn(r));
}

// 경로 이동 — 기본 pushState, replace 옵션 시 replaceState. 이후 구독자에 통지.
export function navigate(path, { replace = false } = {}) {
  if (replace) window.history.replaceState(null, "", path);
  else window.history.pushState(null, "", path);
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", emit); // 뒤로/앞으로
}

// 현재 라우트 구독 훅
export function useRoute() {
  const [route, setRoute] = useState(() => parseLocation());
  useEffect(() => {
    listeners.add(setRoute);
    return () => listeners.delete(setRoute);
  }, []);
  return route;
}
