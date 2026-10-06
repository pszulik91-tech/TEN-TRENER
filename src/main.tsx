import React from "react";
import { createRoot } from "react-dom/client";
import App from "../app/page";
import { ThemeStudio } from "../app/theme-studio";
import { AboutProject } from "../app/about-project";
import { GameErrorBoundary } from "../app/game-error-boundary";
import "../app/globals.css";
import "../app/themes.css";
import "../app/onboarding.css";
import "../app/release.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><GameErrorBoundary><App /><ThemeStudio /><AboutProject /></GameErrorBoundary></React.StrictMode>,
);
