import { LICENSE_COURSES, nextLicense, sortedTable } from "./game-data";
import type { GameState } from "./game-data";

// Used by the career screen and functional tests; no separate test-only rules.
export function startLicenseCourse(game: GameState, funding: "self" | "club"): GameState {
  const target = nextLicense(game.coach.license);
  const course = target ? LICENSE_COURSES[target] : undefined;
  const tablePosition = sortedTable(game.teams).findIndex(team => team.id === game.club.id) + 1;

    if (!target || !course || game.licenseCourse || game.careerEnded) return game;
    if (funding === "self" && game.finances.personalFunds < course.cost) { return { ...game, licenseMessage: `Brakuje ${course.cost - game.finances.personalFunds} zł do samodzielnego finansowania.` }; }
    if (funding === "club") {
      const score = game.president.ambition * .35 + game.president.footballKnowledge * .3 - game.president.financialCaution * .22 + game.coach.reputation * .25 + (tablePosition <= Math.ceil(game.teams.length / 2) ? 8 : 0);
      if (score < 26) { return { ...game, licenseMessage: `${game.presidentName} odmówił finansowania. Wpływ: ostrożność finansowa, wyniki i reputacja trenera. Możesz opłacić kurs sam.` , history: [`${game.date} — Klub odmówił finansowania kursu ${target}.`, ...game.history].slice(0, 40) }; }
    }
    return { ...game, licenseCourse: { target, weeksRemaining: course.weeks, totalWeeks: course.weeks, funding }, licenseMessage: funding === "club" ? `Klub finansuje kurs ${target}.` : `Opłacono kurs ${target}: ${course.cost.toLocaleString("pl-PL")} zł.`, finances: { ...game.finances, personalFunds: funding === "self" ? game.finances.personalFunds - course.cost : game.finances.personalFunds }, history: [`${game.date} — Rozpoczęto kurs ${target} (${funding === "club" ? "finansuje klub" : "finansowanie własne"}).`, ...game.history].slice(0, 40) };
}
