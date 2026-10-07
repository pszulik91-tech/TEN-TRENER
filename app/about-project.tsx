"use client";
import { useEffect, useRef, useState } from "react";
import { BUILD, PROJECT_DESCRIPTION, RELEASE_STAGE } from "./build-info";

export function AboutButton() {
  return <button className="about-link" onClick={() => window.dispatchEvent(new Event("open-about-project"))}>O PROJEKCIE</button>;
}

export function AboutProject() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("open-about-project", show);
    return () => window.removeEventListener("open-about-project", show);
  }, []);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <dialog ref={dialog} className="about-project" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby="about-title">
    <header><span className="eyebrow">{RELEASE_STAGE} · wersja testowa</span><h2 id="about-title">TEN TRENER</h2><p>{BUILD}</p></header>
    <div className="about-content"><p>{PROJECT_DESCRIPTION}</p>
      <h3>Już możesz zagrać</h3><ul><li>Stwórz trenera i wybierz pierwszy klub.</li><li>Poprowadź treningi, wybierz plan drużyny i reaguj podczas meczów.</li><li>Rozwiązuj problemy szatni, zarządu i mediów.</li><li>Rozwijaj umiejętności i licencje, zmieniaj kluby i rozgrywaj kolejne sezony.</li><li>Zapisuj karierę i przenoś ją przez kopię do pliku.</li></ul>
      <h3>Jeszcze w produkcji</h3><p>Oficjalne baraże, Puchar Polski i rozgrywki europejskie. Awanse i spadki działają według uproszczonych zasad. Zmiana klubu jest dostępna latem. Trwa weryfikacja składów lig oraz balansu długich karier.</p>
      <h3>Twój zapis</h3><p>Kariera jest zapisywana w tej przeglądarce. Przed zmianą urządzenia, adresu gry lub usunięciem danych przeglądarki pobierz kopię w ustawieniach.</p>
      <p>Wersja do testów. Nie jest to premiera gry.</p>
    </div><footer><button className="primary-cta" onClick={() => setOpen(false)}>Wróć do gry</button></footer>
  </dialog>;
}
