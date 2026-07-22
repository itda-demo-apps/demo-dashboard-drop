import { useState } from "react";

import HomeView from "./views/HomeView";
import ContactView from "./views/ContactView";

export default function App() {
  const [view, setView] = useState("home"); // home | contact
  if (view === "contact") return <ContactView view={view} setView={setView} />;
  return <HomeView view={view} setView={setView} />;
}
