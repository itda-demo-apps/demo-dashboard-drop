import HomeView from "./views/HomeView";
import ContactView from "./views/ContactView";
import { useRoute, navigate } from "./router";

// 화면 이름 → 경로. Header 탭 등 setView 호출을 navigate로 이어 준다.
const PATHS = { home: "/", contact: "/contact" };

export default function App() {
  const { view } = useRoute();
  const setView = (v) => navigate(PATHS[v] ?? "/");
  if (view === "contact") return <ContactView view={view} setView={setView} />;
  return <HomeView view={view} setView={setView} />;
}
