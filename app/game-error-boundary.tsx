"use client";
import { Component, type ReactNode } from "react";
import { BUILD } from "./build-info";
import { SAVE_KEY } from "./game-data";

export class GameErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="release-recovery"><h1>Przerwa techniczna w szatni.</h1><p>Gra napotkała błąd. Ostatni zapis nie został usunięty.</p><p>{BUILD}</p><button className="primary-cta" onClick={() => window.location.reload()}>Uruchom ponownie</button><button onClick={() => {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const url = URL.createObjectURL(new Blob([raw], { type: "text/plain" }));
        const link = document.createElement("a"); link.href = url; link.download = "TEN-TRENER-zapis-ratunkowy.txt"; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch { /* Storage can be disabled. Reload remains available. */ }
    }}>Pobierz zapis ratunkowy</button></main>;
  }
}
