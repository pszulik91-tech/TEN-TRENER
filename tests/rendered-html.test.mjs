import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Validate the actual artifact Netlify will serve, not a legacy Worker build.
test('statyczny build ma wejście, polskie metadane i wszystkie lokalne zasoby', async () => {
  const directory = new URL('../dist/', import.meta.url);
  const html = await readFile(new URL('index.html', directory), 'utf8');
  assert.match(html, /lang="pl"/);
  assert.match(html, /TEN TRENER — Pre-Alpha/);
  assert.match(html, /noindex, nofollow/);
  assert.match(html, /id="root"/);
  const assets = [...html.matchAll(/(?:src|href)="(\/(?:assets\/[^\"]+|favicon.svg))"/g)].map(match => match[1]);
  assert.ok(assets.some(asset => asset.endsWith('.js')));
  assert.ok(assets.some(asset => asset.endsWith('.css')));
  for (const asset of assets) assert.ok((await stat(new URL('.' + asset, directory))).size > 0, path.basename(asset));
  assert.doesNotMatch(html, /src\/main|localhost|\.tsx/);
});
