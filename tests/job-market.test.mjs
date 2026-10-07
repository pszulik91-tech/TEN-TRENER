import test from 'node:test';
import assert from 'node:assert/strict';
import { assessClubProject, generateWorldJobOffers } from '../lib/job-market.mjs';
import { createGame, generateJobOffers, skillSet, currentFixture } from '../app/game-engine.ts';
import { gameActions, migrateGame } from '../app/game-actions.ts';
import { LEAGUE_PACKS } from '../app/game-data.ts';
import { licenseCoversCompetition, sortedTable, updateTeamResult } from '../lib/game-rules.mjs';
import { encodeSave, decodeSave } from '../lib/save-codec.mjs';

function start() {
  const pack = LEAGUE_PACKS.find(p => p.competition === 'Klasa B' && p.teams.length >= 10 && p.teams.length % 2 === 0);
  return createGame({ name: 'Tester rynku', age: 35, region: pack.association, playingExperience: 'Amator', coachingExperience: 'Debiutant', profile: 'Mentor', license: 'Grassroots C', ...skillSet('Mentor', 'Amator', 'Debiutant') }, pack, pack.teams[0], ['analysis', 'tactics']);
}
function action(g, name, ...args) { let next = g; gameActions(g, value => next = value, () => {})[name](...args); return next; }
const league = Array.from({ length: 16 }, (_, i) => ({ id: `club-${i}`, name: `Klub ${i}`, ovr: 80-i, played: 10, won: 0, drawn: 0, lost: 10, points: 40-i*2, gf: 20-i, ga: 20 }));
function findCompetition(g, offer) {
  if (g.nextWorld) return g.nextWorld.competitions.find(c => c.id === offer.packId);
  const own = LEAGUE_PACKS.find(p => p.association === g.club.association && p.competition === g.club.competition && p.group === g.club.group);
  return own?.id === offer.packId ? { ...own, teams: g.teams } : g.world.competitions.find(c => c.id === offer.packId);
}
function verifyOffers(g, offers) {
  assert.ok(offers.length <= 3);
  for (const offer of offers) {
    const competition = findCompetition(g, offer);
    const team = competition.teams.find(t => t.id === offer.clubId);
    assert.equal(team.name, offer.clubName);
    assert.notEqual(team.id, g.club.id);
    const project = assessClubProject(competition.teams, team.id);
    assert.equal(offer.reason, project.reason);
    assert.equal(offer.situation, project.situation);
    const { seasonYear, asOf, ...sporting } = offer.sporting;
    assert.deepEqual(sporting, project.sporting);
    assert.equal(seasonYear, (g.nextWorld ?? g.world).seasonYear);
    assert.equal(asOf, g.nextWorld ? g.nextWorld.simulatedTo : g.date);
    assert.ok(licenseCoversCompetition(g.coach.license, competition.competition));
    assert.equal(offer.sporting.place, team.played ? sortedTable(competition.teams).findIndex(t => t.id === team.id)+1 : undefined);
  }
}

test('rynek wybiera maksymalnie trzy rzeczywiste kluby; dane uzasadnienia pochodzą z właściwego świata', () => {
  const g = start();
  const original = structuredClone(g);
  const winter = generateJobOffers(g, 123);
  assert.ok(winter.offers.length > 0);
  verifyOffers(g, winter.offers);
  assert.deepEqual(g, original);
  assert.equal(winter.seed, 123);
  assert.deepEqual(generateJobOffers(g, 123), winter);
  assert.deepEqual(generateJobOffers(g, 456).offers, winter.offers);
  const empty = { ...g, world: { ...g.world, competitions: [] }, teams: [g.teams.find(t => t.id === g.club.id)] };
  assert.deepEqual(generateJobOffers(empty, 123).offers, []); // No fallback to catalog-only clubs.
});

test('aktywna liga używa game.teams; liczniki managerChanges nie są dowodem potrzeby klubu', () => {
  const g = start();
  const pack = LEAGUE_PACKS.find(p => p.association === g.club.association && p.competition === g.club.competition && p.group === g.club.group);
  const teams = g.teams.map((t, i) => ({ ...t, ovr: 60-i, played: 10, points: t.id === g.club.id ? 99 : 0 }));
  const context = { ...g, coach: { ...g.coach, reputation: 30 }, teams, world: { ...g.world, competitions: [{ ...pack, teams: [], managerChanges: 100 }] } };
  const offers = generateJobOffers(context, 1).offers;
  assert.ok(offers.length);
  verifyOffers(context, offers);
  assert.ok(offers.every(o => o.packId === pack.id));
  const changed = { ...context, world: { ...context.world, competitions: context.world.competitions.map(c => ({ ...c, managerChanges: 999 })) } };
  assert.deepEqual(generateJobOffers(changed, 1).offers, offers);
});

test('wyniki poniżej potencjału zmieniają potrzebę, priorytet i opis konkretnego klubu', () => {
  const good = assessClubProject(league, 'club-5');
  assert.equal(good.sporting.place, 6);
  assert.equal(good.sporting.ovrRank, 6);
  const poor = league.map(t => t.id === 'club-5' ? { ...t, points: 17, gf: 7, ga: 20 } : t);
  const bad = assessClubProject(poor, 'club-5');
  assert.equal(bad.sporting.place, 12);
  assert.equal(bad.sporting.ovrRank, 6);
  assert.match(bad.reason, /poniżej potencjału/);
  assert.match(bad.situation, /12\. miejsce; 17 pkt w 10 meczach; bramki 7:20/);
  assert.ok(bad.need > good.need);
  const g = start();
  const pack = LEAGUE_PACKS.find(p => p.competition === 'Klasa B' && p.association === g.club.association && p.group !== g.club.group);
  const context = teams => ({ ...g, teams: [], world: { ...g.world, competitions: [{ ...pack, teams }] } });
  const before = generateJobOffers(context(league), 1).offers;
  const after = generateJobOffers(context(poor), 1).offers;
  assert.ok(!before.some(o => o.clubId === 'club-5'));
  assert.equal(after[0].clubId, 'club-5');
  assert.notDeepEqual(before, after);
  const weak = assessClubProject(league, 'club-15');
  assert.match(weak.reason, /najsłabszych kadr/);
  assert.equal(weak.sporting.ovrRank, 16);
  const waiting = assessClubProject(league.map(t => t.id === 'club-0' ? { ...t, played: 0, points: 0 } : t), 'club-0');
  assert.match(waiting.situation, /Klub bez rozegranych meczów/);
  assert.doesNotMatch(waiting.situation, /Tabela bez rozegranych meczów/);
});

test('licencja, reputacja i rzeczywisty bonus tego samego ZPN nadal ograniczają rynek i fit', () => {
  const g = start();
  const local = LEAGUE_PACKS.find(p => p.competition === 'Klasa B' && p.association === g.club.association && p.group !== g.club.group);
  const remote = LEAGUE_PACKS.find(p => p.competition === 'Klasa B' && p.association !== g.club.association);
  const higher = LEAGUE_PACKS.find(p => p.competition === 'Klasa okręgowa');
  const context = { ...g, teams: [], world: { ...g.world, competitions: [local, remote, higher].map((p, i) => ({ ...p, teams: [{ ...league[0], id: `candidate-${i}`, name: `Kandydat ${i}` }] })) } };
  const low = { ...context, coach: { ...g.coach, reputation: 5 + (10-local.tier)*5 - 11 } };
  assert.deepEqual(generateJobOffers(low, 1).offers.map(o => o.packId), [local.id]);
  const normal = generateJobOffers({ ...context, coach: { ...g.coach, reputation: 15 } }, 1).offers;
  assert.equal(normal.length, 2); // Klasa okręgowa requires UEFA B.
  assert.equal(normal[0].fit - normal[1].fit, 6);
  assert.match(normal[0].coachReason, /Ten sam ZPN/);
  assert.doesNotMatch(normal[1].coachReason, /Ten sam ZPN/);
  const licensed = generateJobOffers({ ...context, coach: { ...g.coach, license: 'UEFA B', reputation: 50 } }, 1).offers;
  assert.equal(licensed.length, 3);
  const raised = generateJobOffers({ ...context, coach: { ...g.coach, reputation: 16 } }, 1).offers;
  assert.equal(raised[0].fit, normal[0].fit + 1);
});

test('równe kandydatury mają stabilny tie-break niezależny od kolejności i seed', () => {
  const g = start();
  const pack = LEAGUE_PACKS.find(p => p.competition === 'Klasa B' && p.association === g.club.association && p.group !== g.club.group);
  const teams = league.slice(0, 5).map(t => ({ ...t, ovr: 50, points: 0, played: 0 }));
  const context = { ...g, teams: [], world: { ...g.world, competitions: [{ ...pack, teams }] } };
  const before = generateJobOffers(context, 1).offers;
  const reversed = { ...context, world: { ...context.world, competitions: [{ ...pack, teams: [...teams].reverse() }] } };
  assert.deepEqual(generateWorldJobOffers(reversed, [...LEAGUE_PACKS].reverse(), 8).offers, before);
  assert.deepEqual(before.map(o => o.clubId), ['club-0', 'club-1', 'club-2']);
});

test('zimowa ocena po meczu używa zaktualizowanego świata i tabeli; obserwacji nie można przyjąć', () => {
  let g = start();
  const halfway = Math.ceil(Math.max(...g.fixtures.map(f => f.round))/2);
  let teams = g.teams;
  const fixtures = g.fixtures.map(f => {
    if (f.round >= halfway) return f;
    teams = updateTeamResult(teams, f.home, f.away, 1, 1);
    return { ...f, played: true, homeGoals: 1, awayGoals: 1 };
  });
  const fixture = fixtures.find(f => f.round === halfway && (f.home === g.club.id || f.away === g.club.id));
  g = { ...g, teams, fixtures, round: halfway, date: fixture.date, training: { ...g.training, completedRound: halfway } };
  g = action(g, 'prepareMatch');
  let steps = 0;
  while (!g.matchState.completed) {
    assert.ok(++steps < 40);
    if (g.matchState.activeMomentId) {
      const moment = g.matchState.coachMoments.find(m => m.id === g.matchState.activeMomentId);
      g = action(g, 'resolveMatchMoment', moment.id, moment.choices[0].id);
    } else g = action(g, 'advanceMatch');
  }
  assert.equal(g.winterEvaluatedRound, halfway);
  assert.ok(g.jobOffers.length);
  assert.ok(g.jobOffers.every(o => o.stage === 'obserwacja'));
  verifyOffers({ ...g, date: fixture.date }, g.jobOffers);
  assert.deepEqual(action(g, 'acceptJob', g.jobOffers[0].id), g);
  assert.deepEqual(action({ ...g, pendingSeason: { year: 2027, targetTier: g.club.tier, place: 5, outcome: 'utrzymanie' } }, 'acceptJob', g.jobOffers[0].id).club, g.club);
});

test('lato używa nextWorld z wyzerowaną tabelą, formalna oferta prowadzi do nowego sezonu', () => {
  let g = action({ ...start(), newSeasonPending: true }, 'beginNextSeason');
  assert.ok(g.nextWorld);
  assert.ok(g.jobOffers.length);
  assert.ok(g.jobOffers.every(o => o.stage === 'oferta'));
  verifyOffers(g, g.jobOffers);
  for (const offer of g.jobOffers) {
    assert.equal(offer.sporting.played, 0);
    assert.equal(offer.sporting.place, undefined);
    assert.match(offer.situation, /brak wyników do oceny/);
    assert.doesNotMatch(offer.reason, /poniżej potencjału/);
  }
  const offer = g.jobOffers[0];
  const next = action(g, 'acceptJob', offer.id);
  assert.equal(next.club.name, offer.clubName);
  assert.equal(next.club.id, offer.clubId);
  assert.equal(next.season, '2027/28');
  assert.equal(next.round, 1);
  assert.ok(currentFixture(next));
  assert.equal(next.employmentStatus, 'employed');
});

test('odczyt zachowuje historyczny opis; starszy zapis bez nowych pól pozostaje użyteczny', async () => {
  const g = start();
  const offers = generateJobOffers(g, 1).offers.map(o => ({ ...o, stage: 'obserwacja' }));
  const recorded = { ...g, jobOffers: offers, teams: g.teams.map(t => ({ ...t, points: 999, ovr: 1 })) };
  const loaded = migrateGame(await decodeSave(await encodeSave(recorded)));
  assert.deepEqual(loaded.jobOffers, offers);
  const { id, clubName, packId, tier, competition, expectation } = offers[0];
  const old = { ...g, jobOffers: [{ id, clubName, packId, tier, competition, expectation }] };
  const legacy = migrateGame(await decodeSave(await encodeSave(old)));
  assert.deepEqual(legacy.jobOffers, old.jobOffers);
  assert.equal(legacy.jobOffers[0].sporting, undefined);
  const next = action({ ...legacy, pendingSeason: { year: 2027, targetTier: tier, place: 5, outcome: 'utrzymanie' } }, 'acceptJob', id);
  assert.equal(next.club.name, clubName);
  assert.equal(next.season, '2027/28');
});

test('karty pokazują dowody, dopasowanie i etapy bez twierdzenia o konkretnym wakacie', async () => {
  const { createServer } = await import('vite');
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const root = new URL('../', import.meta.url).pathname;
  const vite = await createServer({ appType: 'custom', configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, hmr: false } });
  try {
    const { Jobs } = await vite.ssrLoadModule('/app/game-screens.tsx');
    const g = start();
    const winter = { ...g, jobOffers: generateJobOffers(g, 1).offers.map(o => ({ ...o, stage: 'obserwacja' })) };
    const render = game => renderToStaticMarkup(React.createElement(Jobs, { game, acceptJob() {}, stayAtClub() {} }));
    const html = render(winter);
    for (const text of ['Powód zainteresowania:', 'Sytuacja sportowa:', 'Dlaczego ty:', 'OBSERWACJA', 'sesji/tydz.', 'dopasowanie']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /wakat/i);
    assert.doesNotMatch(html, /Przyjmij ofertę|FORMALNA OFERTA/);
    const summer = action({ ...g, newSeasonPending: true }, 'beginNextSeason');
    assert.match(render(summer), /FORMALNA OFERTA/);
    assert.match(render(summer), /Przyjmij ofertę/);
    const old = { ...winter, jobOffers: [{ id: 'old', clubName: 'Klub dawny', competition: 'Klasa B', tier: 8, expectation: 'stabilizacja', stage: 'obserwacja' }] };
    assert.match(render(old), /Brak zapisanej sytuacji sportowej z chwili propozycji/);
    assert.match(render({ ...g, jobOffers: [] }), /Brak zainteresowania/);
  } finally { await vite.close(); }
});
