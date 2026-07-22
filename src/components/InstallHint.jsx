import { useState } from "react";

// 홈 화면 추가 안내 — 브라우저로 접속했을 때만 노출 (standalone 실행이면 이미 추가된 것)
const isIOS =
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS는 Mac UA로 위장
const isAndroid = /Android/.test(navigator.userAgent);
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const DISMISS_KEY = "a2hs-hint-dismissed";

export default function InstallHint() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (isStandalone || dismissed || (!isIOS && !isAndroid)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="install-hint">
      <div className="install-hint-text">
        <b>홈 화면에 추가하면 앱처럼 쓸 수 있어요</b>
        <span>
          {isIOS
            ? "Safari 하단 공유 버튼(⬆) → “홈 화면에 추가”"
            : "Chrome 메뉴(⋮) → “홈 화면에 추가”"}
        </span>
      </div>
      <button className="btn install-hint-close" onClick={dismiss} title="닫기">
        ✕
      </button>
    </div>
  );
}
