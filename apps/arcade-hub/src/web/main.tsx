import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";
import { HostApp } from "./host";
import { Landing, Leaderboard } from "./pages";
import { PhoneApp } from "./phone";

/** A tiny path router: three screens do not need a routing library. */
const App = () => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const host = path.match(/^\/host\/([A-Za-z]{4})$/);
  if (host) return <HostApp code={host[1]!.toUpperCase()} />;
  const play = path.match(/^\/play\/([A-Za-z]{4})$/);
  if (play) return <PhoneApp code={play[1]!.toUpperCase()} />;
  if (path === "/leaderboard") return <Leaderboard />;
  return <Landing />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
