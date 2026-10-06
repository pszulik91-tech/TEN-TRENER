import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

// Check the real HTTP server in the same isolated execution environment.
for (const mode of ['dev','preview']) {
  const port=mode==='dev'?5187:4187;
  const args=['node_modules/vite/bin/vite.js',...(mode==='preview'?['preview']:[]),'--config','vite.web.config.ts','--port',String(port),'--strictPort'];
  const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe']});
  let output=''; child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
  try {
    const origin=`http://127.0.0.1:${port}`;let response;
    for(let n=0;n<80;n++) {
      if(child.exitCode!==null)throw new Error(output);
      try{response=await fetch(origin);break;}catch{await delay(100);}
    }
    assert.ok(response?.ok,`${mode}: server not responding: ${output}`);
    const html=await response.text();assert.match(html,/TEN TRENER — Pre-Alpha/);
    const assets=[...html.matchAll(/(?:src|href)="(\/(?:assets\/[^\"]+|src\/main.tsx|favicon.svg))"/g)].map(m=>m[1]);
    assert.ok(assets.length>=2);
    for(const asset of assets){const result=await fetch(origin+asset);assert.equal(result.status,200,asset);assert.ok((await result.text()).length>0);}
    console.log(`${mode}: HTTP 200, page and ${assets.length} resources OK`);
  } finally { child.kill('SIGTERM'); }
}
