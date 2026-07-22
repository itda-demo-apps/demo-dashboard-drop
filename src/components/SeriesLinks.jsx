import { SERIES, SELF_ID, REPO_URL } from "../data/series";

// 시리즈 다른 앱 링크 + 만드는 법 — 홈 하단 푸터
export default function SeriesLinks() {
  const others = SERIES.filter((s) => s.id !== SELF_ID);
  return (
    <div className="series">
      {others.length > 0 && (
        <>
          <div className="series-title">이런 데모 앱도 있어요</div>
          {others.map((s) => (
            <a key={s.id} className="series-item" href={s.url} target="_blank" rel="noreferrer">
              <span className="series-item-name">{s.name}</span>
              <span className="series-item-desc">{s.desc}</span>
              <span className="series-item-arrow">↗</span>
            </a>
          ))}
        </>
      )}
      <a className="series-repo" href={REPO_URL} target="_blank" rel="noreferrer">
        이 앱, 코딩 없이 만들었어요 — 만드는 법 보기 ↗
      </a>
      <div className="series-edu">
        <b className="series-edu-title">이런 앱, 우리 팀도 만들 수 있어요</b>
        <span className="series-edu-desc">
          이 데모는 <a href="https://itda.work" target="_blank" rel="noreferrer">잇다</a>의 기업·팀 AI 활용 교육
          예시입니다. 교육에서는 아이디어 정리부터 배포·운영까지, 앱을 체계적으로 만드는 방법을 배웁니다.
        </span>
        <a className="series-edu-cta" href="mailto:dev@itda.work">교육·강의·워크숍 문의 — dev@itda.work</a>
      </div>
    </div>
  );
}
