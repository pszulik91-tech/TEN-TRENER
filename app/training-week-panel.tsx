import { Button } from '@/components/ui/button';
import type { GameState } from './game-data';
import { conditionStatus, TEAM_PLANS } from './game-data';
import { diagnoseTrainingWeek, trainingWeekOptions } from './training-week';
const signed=(n:number)=>`${n>=0?'+':''}${n}`;
export function TrainingWeekChoices({game,choose}:{game:GameState;choose:(id:string)=>void}) {
 const diagnosis=diagnoseTrainingWeek(game), options=trainingWeekOptions(game,diagnosis);
 return <section className="panel training-week-diagnosis" aria-label="Priorytet tygodnia"><small>PRIORYTET TYGODNIA</small><h2>{diagnosis.title}</h2><p>{diagnosis.evidence}</p><p>Dwa warianty sztabu. Wybierz kompromis lub dostosuj pozostałe presety i sesje poniżej.</p><div className="training-week-options">{options.map((p,i)=><article key={p.id} data-training-option={p.id}><h3>Wariant {i===0?'A':'B'} • {p.label}</h3><p>{p.description}</p><dl><div><dt>Kondycja XI po treningu</dt><dd>{p.after.condition}% • {conditionStatus(p.after.condition)}</dd></div><div><dt>Gotowość</dt><dd>{p.before.readiness}% → {p.after.readiness}%</dd></div><div><dt>Morale / forma XI</dt><dd>{p.before.morale} → {p.after.morale} / {p.before.form} → {p.after.form}</dd></div><div><dt>Ryzyko przeciążenia mikrocyklu</dt><dd>{p.effect.risk}</dd></div>{p.synergy.shortTerm!==0&&<div><dt>Synergia z planem „{TEAM_PLANS[game.teamPlan]?.label}”</dt><dd>{signed(p.synergy.shortTerm)} do siły meczowej{p.synergy.reasons.length?` • ${p.synergy.reasons.join(', ')}`:''}</dd></div>}</dl><Button variant="outline" onClick={()=>choose(p.id)}>Wybierz {p.label}</Button></article>)}</div><p className="source-note">Prognoza obejmuje naturalną regenerację i cały mikrocykl. Automat może dobrać inną XI po treningu; morale i forma są średnimi XI. Ryzyko mikrocyklu opisuje jego obciążenie, a nie procentową szansę kontuzji.</p></section>;
}
export function TrainingWeekResult({game}:{game:GameState}) {
 const summary=game.training.weekSummary;
 if(!summary||summary.round!==game.round||game.training.completedRound!==game.round)return null;
 return <section className="panel training-week-result" aria-label="Podsumowanie mikrocyklu"><h3>Problem tygodnia: {summary.diagnosis.title}</h3><p>{summary.diagnosis.evidence}</p><p>Wybrano: <b>{summary.chosen}</b></p><p>Rzeczywisty efekt: kondycja XI {summary.before.condition}% → {summary.after.condition}% • {conditionStatus(summary.after.condition)}; gotowość {summary.before.readiness}% → {summary.after.readiness}%; morale XI {summary.before.morale} → {summary.after.morale}; forma XI {summary.before.form} → {summary.after.form}.</p></section>;
}
