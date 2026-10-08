// Only played events inform the score. Stored homeGoals/awayGoals include the future.
export function mentalityScore(match, clubId) {
  const userHome = match.fixture.home === clubId;
  const goals = side => match.plannedEvents.filter(e => e.minute <= match.minute && e.kind === 'goal' && e.side === side).length;
  const own = goals(userHome ? 'home' : 'away');
  const opponent = goals(userHome ? 'away' : 'home');
  return { userHome, own, opponent, balance: own - opponent };
}

export function mentalityProfile(mentality, minute = 0, balance = 0, userHome = true) {
  const time = Math.max(0, Math.min(90, minute)) / 90;
  let own = 1, opponent = 1;
  if (mentality === 'Ofensywna') {
    own += .10 + .30 * time + (balance < 0 ? .12 * time : 0);
    opponent += .08 + .32 * time + (balance > 0 ? .12 * time : 0);
  } else if (mentality === 'Defensywna') {
    own -= .12 + .30 * time;
    opponent -= .08 + .30 * time + (balance > 0 ? .08 * time : 0);
  }
  return { homeAttack: userHome ? own : opponent, awayAttack: userHome ? opponent : own, afterMinute: Math.max(0, Math.min(90, minute)) };
}

export function mentalityForMatch(match, clubId, mentality) {
  const { userHome, balance } = mentalityScore(match, clubId);
  return mentalityProfile(mentality, match.minute, balance, userHome);
}

export function mentalityAdvice(match, clubId, mentality) {
  const { own, opponent, balance } = mentalityScore(match, clubId);
  const score = `${balance > 0 ? 'prowadzimy' : balance < 0 ? 'przegrywamy' : 'remis'} ${own}:${opponent}`;
  const heading = `${mentality.toUpperCase()} • ${match.minute}' • ${score}. `;
  if (mentality === 'Ofensywna') return heading + 'Więcej zagrożenia pod bramką rywala, ale także więcej okazji dla niego.' + (match.minute >= 60 ? balance < 0 ? ' W końcówce rośnie szansa odrobienia wyniku oraz ryzyko kolejnej straty.' : balance > 0 ? ' W końcówce otwierasz mecz i narażasz prowadzenie.' : ' W końcówce korzyść i ryzyko rosną.' : ' Wpływ jest jeszcze umiarkowany.');
  if (mentality === 'Defensywna') return heading + 'Ogranicza zagrożenie rywala kosztem własnych okazji.' + (match.minute >= 60 ? balance < 0 ? ' Mniej okazji oznacza też trudniejsze odrabianie wyniku.' : balance > 0 ? ' Chronisz prowadzenie, ale rzadziej możesz je powiększyć.' : ' Zmniejszasz otwartość końcówki.' : ' Wpływ jest jeszcze umiarkowany.');
  return heading + 'Neutralny balans ryzyka i ataku.';
}
