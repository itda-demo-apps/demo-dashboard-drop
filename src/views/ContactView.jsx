import { useState } from "react";

import Header from "../components/Header";

// 문의 폼 — /api/contact(Vercel 함수)를 거쳐 Telegram으로 전달된다
export default function ContactView({ view, setView }) {
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // 허니팟 — 사람은 채우지 않는 숨은 필드
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const submit = async () => {
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), contact: contact.trim(), website }),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("done");
      setMessage("");
      setContact("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="app">
      <Header view={view} setView={setView} />

      <div className="add-card">
        <div className="display add-title">문의하기</div>
        <div className="contact-desc">
          궁금한 점, 불편한 점, 추가됐으면 하는 이슈·기능을 자유롭게 남겨주세요.
        </div>
        <textarea
          className="input input--textarea"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="문의 내용"
          maxLength={2000}
        />
        <input
          className="input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="답변받을 연락처 — 이메일 등 (선택)"
          maxLength={200}
        />
        <input
          className="contact-hp"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          placeholder="website"
        />
        <button
          className="btn add-submit"
          disabled={!message.trim() || status === "sending"}
          onClick={submit}
        >
          {status === "sending" ? "보내는 중..." : "보내기"}
        </button>
        {status === "done" && (
          <div className="contact-result contact-result--ok">전송됐어요. 확인 후 연락드릴게요!</div>
        )}
        {status === "error" && (
          <div className="contact-result contact-result--err">
            전송에 실패했어요 — 네트워크 확인 후 다시 시도해 주세요.
          </div>
        )}
      </div>
    </div>
  );
}
