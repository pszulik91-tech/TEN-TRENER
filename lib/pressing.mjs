const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// The existing XI condition; no separate stamina or in-match player attributes.
export function pressingStrength(pressing, condition) {
  if (!["Wysoki", "Bardzo wysoki"].includes(pressing)) return 0;
  const scale = clamp((condition - 76) / 20, -1, 1);
  return Number((scale * (pressing === "Bardzo wysoki" ? 0.65 : 0.45)).toFixed(2));
}

export function lineupCondition(players, assignments) {
  const ids = Object.values(assignments);
  return ids.length ? ids.reduce((sum, id) => sum + (100 - (players.find(p => p.id === id)?.fatigue ?? 100)), 0) / ids.length : 0;
}

// Old saves have no history: use their current instruction for elapsed minutes.
export function accruePressing(exposure, pressing, minute) {
  const previous = exposure ?? { high: 0, veryHigh: 0, minute: 0 };
  const until = clamp(minute, previous.minute, 90);
  const elapsed = until - previous.minute;
  return { high: previous.high + (pressing === "Wysoki" ? elapsed : 0), veryHigh: previous.veryHigh + (pressing === "Bardzo wysoki" ? elapsed : 0), minute: until };
}

export function pressingFatigueCost(exposure) {
  return Math.round((4 * exposure.high + 8 * exposure.veryHigh) / 90);
}

export function pressingAdvice(pressing, condition, exposure) {
  const intense = ["Wysoki", "Bardzo wysoki"].includes(pressing);
  const effectiveness = pressingStrength(pressing, condition);
  const benefit = !intense ? "bez premii intensywnego pressingu" : effectiveness > 0 ? "pressing korzysta ze świeżej XI" : effectiveness < 0 ? "zmęczenie XI osłabia pressing" : "kondycja XI nie daje premii pressingowi";
  const cost = pressingFatigueCost(exposure ?? { high: 0, veryHigh: 0 });
  const level = cost === 0 ? "minimalny" : cost <= 2 ? "mały" : cost <= 4 ? "podwyższony" : "wysoki";
  return `Kondycja XI ${Math.round(condition)}% — ${benefit}. Koszt fizyczny: ${pressing === "Bardzo wysoki" ? "bardzo wysoki" : pressing === "Wysoki" ? "wysoki" : "niski"}, rośnie z czasem stosowania. Zebrany koszt: ${level}. Obniżenie pressingu nie usuwa wcześniejszego obciążenia.`;
}
