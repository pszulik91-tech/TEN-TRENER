import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { createServer } from 'vite';

test('NOWA KARIERA → cztery etapy → klub → dwa cele → pierwszy dzień w klubie', async t => {
  // Only browser services are stubbed; all components and career logic are real.
  const storage = new Map();
  const restoreGlobals = [];
  const stubGlobal = (key, value) => {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    restoreGlobals.push(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  };
  stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  stubGlobal('window', {
    requestAnimationFrame: callback => { callback(); return 1; },
    cancelAnimationFrame() {}, addEventListener() {}, removeEventListener() {}, scrollTo() {},
  });
  stubGlobal('localStorage', {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  });
  const root = new URL('../', import.meta.url).pathname;
  const vite = await createServer({ appType: 'custom', configFile: false, root,
    resolve: { alias: { '@': root } }, server: { middlewareMode: true, hmr: { port: 0 } } });
  let view;
  t.after(async () => {
    try { if (view) await act(() => view.unmount()); }
    finally { await vite.close(); restoreGlobals.reverse().forEach(restore => restore()); }
  });
  const { default: App } = await vite.ssrLoadModule('/app/page.tsx');
  await act(() => { view = create(React.createElement(App)); });
  const text = node => typeof node === 'string' ? node : node.children.map(text).join('');
  const button = label => view.root.findAllByType('button').find(node => text(node).trim() === label);
  const click = async node => {
    assert.ok(node, 'expected button is rendered');
    assert.ok(!node.props.disabled, 'button is enabled');
    await act(() => node.props.onClick());
  };
  const stage = number => assert.ok(view.root.findAllByType('b').some(node => text(node) === `ETAP ${number} / 4`));
  await click(button('NOWA KARIERA'));
  stage(1);
  assert.equal(button('O doświadczeniu').props.disabled, true);
  await act(() => view.root.findByType('input').props.onChange({ target: { value: '  Test kariery  ' } }));
  await click(button('O doświadczeniu'));
  stage(2);
  await click(button('Porozmawiajmy o szatni'));
  for (let question = 1; question <= 8; question++) {
    assert.ok(view.root.findAllByType('b').some(node => text(node) === `PYTANIE ${question} / 8`));
    await click(view.root.findAllByType('button').find(node => text(node).startsWith('A')));
  }
  stage(4);
  await click(button('Wybierz pierwszy klub'));
  const clubs = view.root.findAllByType('button').filter(node => node.props.className?.startsWith('club-card'));
  const chosenClub = text(clubs[2].findByType('strong'));
  await click(clubs[2]);
  await click(button('Cele sezonu'));
  assert.equal(button('Rozpocznij karierę').props.disabled, true);
  const goals = () => view.root.findAllByType('button').filter(node => node.props.className?.startsWith('goal-card'));
  await click(goals()[0]);
  assert.equal(button('Rozpocznij karierę').props.disabled, true);
  await click(goals()[3]);
  await click(button('Rozpocznij karierę'));
  assert.equal(text(view.root.findByProps({ id: 'arrival-heading' })), `Witamy w ${chosenClub}.`);
  assert.ok(button('Ułóż pierwszy mikrocykl'));
  const { activeCareer } = await vite.ssrLoadModule('/app/save-storage.ts');
  const career = activeCareer();
  assert.equal(career.coach.name, 'Test kariery');
  assert.equal(career.coach.license, 'Grassroots C');
  assert.equal(career.club.name, chosenClub);
  assert.deepEqual(career.developmentGoals.map(goal => goal.id), ['tactics', 'analysis']);
  assert.equal(career.round, 1);
  assert.equal(career.careerStats.matches, 0);
});
