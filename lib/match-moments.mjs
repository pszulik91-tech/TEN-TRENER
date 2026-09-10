const MOMENTS = [
  { title: "Rywal zamyka środek", body: "Pierwsze podanie wraca jak bumerang. Trzeba zdecydować, gdzie zrobić miejsce.", choices: [["Rozciągnij grę", "Więcej przestrzeni, ale odkryte boki po stracie.", 0.2, 1, 0, 0], ["Graj bezpośrednio", "Szybsze dojście pod bramkę kosztem kontroli.", 0.45, 2, -1, 0], ["Czekaj na błąd", "Mniej ryzyka i mniej sytuacji.", -0.1, -1, 0, -1]] },
  { title: "Lewa strona prosi o pomoc", body: "Rywal tworzy przewagę przy linii. Ławka widzi problem, zanim zobaczy go tablica.", choices: [["Cofnij skrzydłowego", "Bezpieczniej z tyłu, słabsze wyjście do kontry.", 0.15, 1, 0, -1], ["Przesuń cały blok", "Lepsza asekuracja, lecz druga strona zostaje szerzej.", 0.35, 2, 0, 0], ["Zostaw pojedynek", "Zachowujesz plan, bierzesz ryzyko indywidualne.", -0.2, 0, 1, 1]] },
  { title: "Sędzia traci cierpliwość", body: "Kolejny ostry kontakt. Jeszcze jeden protest i notes arbitra może dostać nadgodziny.", choices: [["Uspokój zespół", "Mniej kartek, ale spada agresja w pojedynkach.", -0.05, -1, 0, -2], ["Broń swoich ludzi", "Szatnia to zapamięta, arbiter również.", 0.2, 0, 2, 2], ["Rozmawia kapitan", "Mały wpływ teraz, mniejsze ryzyko konfliktu.", 0.05, 0, 1, -1]] },
  { title: "Stały fragment przy ławce", body: "Masz kilka sekund na sygnał. Rywal jeszcze ustawia mur.", choices: [["Wariant ćwiczony", "Premia zależy od przygotowania tygodnia.", 0.5, 0, 1, 0], ["Krótko i cierpliwie", "Kontrola zamiast natychmiastowego strzału.", 0.2, 0, 0, -1], ["Piłka na chaos", "Duża zmienność i drugi kontakt dla odważnych.", 0.35, 1, 1, 1]] },
  { title: "Zespół siada fizycznie", body: "Powroty są o pół kroku wolniejsze. Plan nadal działa, nogi zaczynają negocjować.", choices: [["Obniż pressing", "Oszczędzasz energię, oddajesz część inicjatywy.", -0.15, -3, 0, -1], ["Jeszcze dziesięć minut", "Możesz docisnąć rywala, ale rachunek przyjdzie po meczu.", 0.55, 3, 0, 2], ["Zwolnij z piłką", "Mniej wymian ciosów, większa kontrola tempa.", 0.2, -1, 0, 0]] },
  { title: "Młody zawodnik popełnia błąd", body: "Trybuny reagują szybciej niż sztab. Kolejny kontakt może go odbudować albo pogrążyć.", choices: [["Daj mu prostą rolę", "Mniej swobody, więcej bezpieczeństwa.", 0.15, 0, 1, 0], ["Publicznie wesprzyj", "Morale rośnie, odpowiedzialność zostaje.", 0.25, 0, 2, 1], ["Zmień akcent strony", "Chronisz zawodnika kosztem przebudowy planu.", 0.1, 1, 0, 0]] },
  { title: "Rywal cofa się po golu", body: "Piłka jest twoja, miejsca jest mniej. Samo posiadanie nie otworzy drzwi.", choices: [["Drugi napastnik", "Więcej obecności w polu karnym, mniej kontroli środka.", 0.55, 2, 0, 2], ["Strzały z dystansu", "Więcej prób, nie każda będzie rozsądna.", 0.3, 1, 0, 0], ["Cierpliwa cyrkulacja", "Niższe ryzyko, czas pracuje przeciwko tobie.", 0.1, 0, 0, 1]] },
  { title: "Prowadzenie trzeba dowieźć", body: "Rywal podnosi tempo. Ławka pyta, czy bronimy wyniku, czy własnego pola karnego.", choices: [["Niższy blok", "Mniej przestrzeni za linią, więcej dośrodkowań rywala.", 0.2, -1, 0, 0], ["Pressing po stracie", "Możesz zgasić akcję wcześniej kosztem świeżości.", 0.45, 2, 0, 1], ["Utrzymuj piłkę", "Ryzyko straty przy wyjściu, ale rywal nie atakuje bez piłki.", 0.3, 1, 0, 0]] },
  { title: "Murawa zmienia zasady", body: "Piłka staje w kałuży albo odbija się jak od parkingu — zależnie od sektora.", choices: [["Uprość rozegranie", "Mniej błędów technicznych, mniejsza kontrola.", 0.3, 0, 0, -1], ["Graj górą", "Omijasz środek, liczysz na drugą piłkę.", 0.4, 1, 0, 0], ["Nie zmieniaj planu", "Zachowujesz automatyzmy i bierzesz ryzyko nawierzchni.", -0.15, 0, 1, 1]] },
  { title: "Trybuny żądają ataku", body: "Ważny mecz, remis i coraz głośniejsze podpowiedzi z miejsc, gdzie zawsze widać lepiej.", choices: [["Podkręć tempo", "Więcej zdarzeń po obu stronach.", 0.5, 2, 1, 2], ["Trzymaj plan", "Mniej chaosu, kibice mogą stracić cierpliwość.", 0.05, 0, 0, 1], ["Uspokój liderów", "Lepsze decyzje, mniejsza intensywność.", 0.15, -1, 1, -1]] },
  { title: "Rywal zmienia ustawienie", body: "Drugi napastnik wchodzi między stoperów. Dotychczasowe odległości przestają się zgadzać.", choices: [["Dodatkowa asekuracja", "Stabilniej w obronie, trudniej wyjść wysoko.", 0.3, 1, 0, 0], ["Zaatakuj wolny bok", "Przewaga może powstać po obu stronach boiska.", 0.45, 2, 0, 1], ["Poczekaj pięć minut", "Zbierasz dane, oddajesz rywalowi inicjatywę.", -0.1, 0, 0, -1]] },
  { title: "Końcówka bez planu B", body: "Wynik wymaga reakcji, ławka jest krótka. Zostały decyzje, nie idealne rozwiązania.", choices: [["Ryzyko i pole karne", "Najwyższy sufit oraz najwyższy koszt błędu.", 0.65, 3, 1, 3], ["Stałe fragmenty", "Szukasz jednej dobrze przygotowanej piłki.", 0.35, 1, 0, 1], ["Zachowaj strukturę", "Ograniczasz chaos, ale czasu nie odzyskasz.", 0.05, -1, 0, -1]] },
];

function next(seed) { const value = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0; return { seed: value, value: value / 4294967296 }; }

export function matchMomentCount({ tier = 5, round = 1, totalRounds = 20, pressure = 20, strengthGap = 0 }) {
  let count = 2;
  if (pressure >= 55 || Math.abs(strengthGap) <= 1.5) count += 1;
  if (round >= totalRounds - 3 || tier <= 2) count += 1;
  if (round === totalRounds || pressure >= 80) count += 1;
  return Math.max(2, Math.min(5, count));
}

export function generateMatchMoments(seed, context = {}) {
  let nextSeed = seed >>> 0;
  const count = matchMomentCount(context);
  const pool = [...MOMENTS];
  const minuteSets = { 2: [30, 67], 3: [24, 52, 76], 4: [18, 39, 61, 79], 5: [15, 33, 51, 69, 82] };
  const minutes = minuteSets[count];
  const moments = [];
  for (let index = 0; index < count; index += 1) {
    const roll = next(nextSeed); nextSeed = roll.seed;
    const template = pool.splice(Math.floor(roll.value * pool.length), 1)[0];
    moments.push({ id: `moment-${context.round ?? 1}-${index}`, minute: minutes[index], title: template.title, body: template.body, choices: template.choices.map((choice, choiceIndex) => ({ id: `choice-${choiceIndex}`, label: choice[0], preview: choice[1], strength: choice[2], fatigue: choice[3], morale: choice[4], pressure: choice[5] })) });
  }
  return { seed: nextSeed, moments };
}

export function resolveMatchMoment(seed, moment, choiceId) {
  const choice = moment.choices.find((item) => item.id === choiceId) ?? moment.choices[0];
  const roll = next(seed); const swing = (roll.value - 0.5) * 0.7;
  const strength = Number((choice.strength + swing).toFixed(2));
  const verdict = strength >= 0.45 ? "Reakcja trafiona — zespół dostał wyraźny impuls." : strength >= 0 ? "Korekta pomogła, ale nie zmieniła meczu sama." : "Ryzyko się nie zwróciło; przeciwnik znalazł odpowiedź.";
  return { seed: roll.seed, choice, strength, verdict };
}

export function matchMomentStats() { return { scenarios: MOMENTS.length, choices: MOMENTS.reduce((sum, item) => sum + item.choices.length, 0) }; }
