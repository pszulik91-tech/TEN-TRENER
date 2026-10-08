import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {INTERVIEW_STEPS,initialCoachDraft} from '../app/coach-onboarding.ts';
import {PSYCH_QUESTIONS} from '../app/game-data.ts';
const root=new URL('../',import.meta.url).pathname;
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {StartScreen}=await vite.ssrLoadModule('/app/setup-screens.tsx');
const {Creator}=await vite.ssrLoadModule('/app/coach-interview.tsx');
const noop=()=>{};
const render=props=>renderToStaticMarkup(React.createElement(StartScreen,{hasSave:false,onNew:noop,onLoad:noop,...props}));

test('start pokazuje pięć rzeczywistych elementów tygodnia i wielosezonową obietnicę przed CTA',()=>{
 const html=render();
 assert.ok(html.indexOf('sezon po sezonie')<html.indexOf('NOWA KARIERA'));
 assert.match(html,/TYDZIEŃ TRENERA/);assert.equal((html.match(/<li>/g)||[]).length,5);
 for(const label of ['Drużyna','Trening','Mecz','Decyzje','Kariera','automatyczną XI','problem tygodnia','pressing i mentalność','licencje'])assert.ok(html.includes(label));
 assert.doesNotMatch(html,/quiz psychologiczny|transfery|mecz 2D|ręczna XI|negocjacje|najlepsz|rewolucyj/i);
});

test('fragment właściwej gry jest wyłącznie prezentacją, bez kontrolek lub stanu',()=>{
 const props=Object.freeze({hasSave:true,hasDraft:true,onNew:()=>{throw Error('new called during render');},onLoad:()=>{throw Error('load called during render');},onResumeDraft:()=>{throw Error('resume called during render');}});
 const a=render(props),b=render(props);assert.equal(a,b);
 const preview=a.slice(a.indexOf('<section class="start-game-preview"'),a.indexOf('<div class="build-row"'));
 assert.match(preview,/FRAGMENT GRY • PRZYKŁAD/);assert.match(preview,/72′.*0:1/);assert.match(preview,/MENTALNOŚĆ: OFENSYWNA/);assert.match(preview,/Problem tygodnia:/);
 assert.doesNotMatch(preview,/<button|<input|<select|role="button"|tabindex=/i);
});

test('menu zachowuje nową karierę, kontynuację, szkic i potwierdzenie zastąpienia zapisu',async()=>{
 const ReactV=React;const {default:Renderer,act}=await import('react-test-renderer');
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;let tree,newCalls=0,loadCalls=0,resumeCalls=0;
 const props={hasSave:false,onNew:()=>newCalls++,onLoad:()=>loadCalls++,hasDraft:false,onResumeDraft:()=>resumeCalls++};
 try{
  await act(()=>{tree=Renderer.create(ReactV.createElement(StartScreen,props));});
  const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):'';
  const find=label=>tree.root.findAllByType('button').find(b=>text(b.props.children).includes(label));
  assert.equal(find('KONTYNUUJ').props.disabled,true);
  await act(()=>find('NOWA KARIERA').props.onClick());assert.equal(newCalls,1);
  await act(()=>tree.update(ReactV.createElement(StartScreen,{...props,hasSave:true,hasDraft:true})));
  assert.equal(find('KONTYNUUJ').props.disabled,false);
  await act(()=>find('KONTYNUUJ').props.onClick());assert.equal(loadCalls,1);
  await act(()=>find('WZNÓW KREATOR').props.onClick());assert.equal(resumeCalls,1);
  await act(()=>find('NOWA KARIERA').props.onClick());assert.equal(newCalls,1);assert.ok(find('Zachowaj obecną'));
  await act(()=>find('Zachowaj obecną').props.onClick());assert.equal(newCalls,1);
  await act(()=>find('NOWA KARIERA').props.onClick());await act(()=>find('Rozpocznij nową karierę').props.onClick());assert.equal(newCalls,2);
 }finally{if(tree)await act(()=>tree.unmount());delete globalThis.IS_REACT_ACT_ENVIRONMENT;}
});

test('kreator nadal ma cztery etapy, stepper i jedno pytanie psychologiczne naraz',()=>{
 assert.equal(INTERVIEW_STEPS.length,4);
 const props={draft:initialCoachDraft(),setDraft:noop,setStage:noop,setQuestionIndex:noop,onNext:noop,onBack:noop};
 const identity=renderToStaticMarkup(React.createElement(Creator,{...props,stage:0,questionIndex:0}));
 assert.match(identity,/age-stepper/);assert.match(identity,/ETAP 1 \/ 4/);
 for(let questionIndex=0;questionIndex<PSYCH_QUESTIONS.length;questionIndex++){
  const html=renderToStaticMarkup(React.createElement(Creator,{...props,stage:2,questionIndex}));
  assert.equal((html.match(/id="interview-question"/g)||[]).length,1);
  assert.equal((html.match(/aria-pressed=/g)||[]).length,PSYCH_QUESTIONS[questionIndex].choices.length);
 }
 assert.doesNotMatch(readFileSync(new URL('../app/coach-interview.tsx',import.meta.url),'utf8'),/klawiatur/i);
});

test('mobile markup i reguły układu ograniczają szerokość oraz zawijają karty i CTA',()=>{
 const html=render({hasSave:true,hasDraft:true});const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8').split('/* UX-01:')[1];
 assert.match(html,/start-game-intro/);assert.doesNotMatch(html,/<table|width="[4-9]\d\d"/);
 assert.match(css,/width: min\(100%, 72rem\)/);assert.match(css,/grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
 assert.match(css,/min-width: 0/);assert.match(css,/white-space: normal/);assert.match(css,/flex-wrap: wrap/);assert.match(css,/overflow-wrap: anywhere/);
 assert.match(css,/@media \(min-width: 960px\)/);assert.match(css,/@media \(max-width: 639px\)/);
});
