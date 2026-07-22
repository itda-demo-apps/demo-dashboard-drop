// 문의 폼 → Telegram 전달 (Vercel 서버리스 함수)
// 봇 토큰·챗 ID는 Vercel 환경변수에만 존재 — 클라이언트/저장소에 노출되지 않는다.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { message, contact, website } = req.body || {};
  if (website) return res.status(200).json({ ok: true }); // 허니팟 — 봇 제출은 조용히 무시

  const text = typeof message === "string" ? message.trim() : "";
  if (!text || text.length > 2000) return res.status(400).json({ ok: false });
  const who = typeof contact === "string" ? contact.trim().slice(0, 200) : "";

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ ok: false });

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `📮 [대시보드 드롭 문의]\n\n${text}\n\n― 연락처: ${who || "미기재"}`,
    }),
  });
  if (!r.ok) return res.status(502).json({ ok: false });
  return res.status(200).json({ ok: true });
}
