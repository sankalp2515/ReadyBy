import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createReadyByApp} from '../readyby-server.mjs';
import {openStore} from '../src/readyby/store.mjs';
import {initialState} from '../src/readyby/fixtures.mjs';
import {interpret} from '../src/readyby/agent.mjs';

test('ReadyBy API preserves recovery across restart, rejects stale/cross-origin actions',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'readyby-'));let server,base;
  async function start(){server=await createReadyByApp({dataFile:join(dir,'mission.json')});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
  async function post(path,body,origin){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify({idempotencyKey:randomUUID(),...body})});}
  try{await start();let r=await post('/api/scenario',{scenario:'delay',expectedRevision:0});let {state:s}=await r.json();assert.equal(s.now,486);
    r=await post('/api/action',{type:'delay',taskId:'laundry',minutes:15,expectedRevision:s.revision});s=(await r.json()).state;assert.equal(s.analysis.full.finish,508);
    const proposalId=s.proposal.options.find(x=>x.kind==='defer').id;
    r=await post('/api/action',{type:'approve',proposalId,expectedRevision:s.revision});s=(await r.json()).state;assert.equal(s.tasks.find(t=>t.id==='laundry').status,'deferred');
    r=await post('/api/action',{type:'resume_deferred',taskId:'laundry',readyConfirmed:true,deadline:510,expectedRevision:s.revision});assert.equal(r.status,400);assert.match((await r.json()).error,/Finish the current departure/);
    assert.equal((await post('/api/action',{type:'recalculate',expectedRevision:0})).status,409);
    assert.equal((await post('/api/reset',{expectedRevision:s.revision},'https://evil.example')).status,403);
    assert.equal((await post('/api/reset',{expectedRevision:s.revision},'null')).status,403);
    await new Promise(r=>server.close(r));await start();s=await (await fetch(base+'/api/state')).json();assert.equal(s.tasks.find(t=>t.id==='bag').status,'completed');assert.equal(s.tasks.find(t=>t.id==='laundry').status,'deferred');assert.equal(s.analysis.full.finish,496);
    const home=await fetch(base+'/');assert.equal(home.status,200);assert.match(await home.text(),/ReadyBy/);
    r=await post('/api/scenario',{scenario:'return',expectedRevision:s.revision});s=(await r.json()).state;assert.equal(s.now,540);assert.equal(s.tasks.find(t=>t.id==='final').status,'completed');
    r=await post('/api/action',{type:'resume_deferred',taskId:'laundry',readyConfirmed:true,deadline:555,expectedRevision:s.revision});assert.equal(r.status,200);s=(await r.json()).state;assert.equal(s.analysis.full.finish,545);
  }finally{if(server)await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
test('AI request is persisted with a real tool receipt; duplicate command does not call model again',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'readyby-agent-'));let calls=0;
  const server=await createReadyByApp({dataFile:join(dir,'mission.json'),interpreter:async()=>{calls++;return {intent:{action:'start_mission'},receipt:{kind:'ai',model:'test-double',latencyMs:1}};}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const base=`http://127.0.0.1:${server.address().port}`,body={text:'Start the mission',expectedRevision:0,idempotencyKey:'test-command'};const post=()=>fetch(base+'/api/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let r=await post();const x=await r.json();assert.equal(x.state.phase,'active');assert.equal(x.state.receipts[0].tool,'start_mission');r=await post();assert.ok((await r.json()).duplicate);assert.equal(calls,1);}finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
test('corrupt storage is not silently replaced; failed durable write cannot advance state',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'readyby-store-'));try{const file=join(dir,'broken.json');await writeFile(file,'{}');await assert.rejects(()=>openStore(file),/invalid/);
    const usable=await openStore(join(dir,'unwritable','mission.json'));await writeFile(join(dir,'unwritable'),'blocks directory creation');await assert.rejects(()=>usable.transaction(async s=>{s.revision++;return {state:s};}));assert.equal(usable.get().revision,0);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('AI parsing guard rejects unsupported tools and negated physical completion',async()=>{
  const fake=intent=>async()=>({ok:true,json:async()=>({model:'test-double',message:{content:JSON.stringify(intent)}})});
  const s=initialState();let x=await interpret(s,"Don't mark the bag complete",{fetcher:fake({action:'progress',taskId:'bag',operation:'complete'})});assert.equal(x.intent.action,'clarify');
  await assert.rejects(()=>interpret(s,'Hi',{fetcher:fake({action:'delete_database'})}),/Unsupported/);
  await assert.rejects(()=>interpret(s,'Hi',{fetcher:async()=>{throw Error('offline');}}),/mission is unchanged/);
  s.proposal={options:[]};x=await interpret(s,'No, keep the current commitments',{fetcher:fake({action:'approve',optionKind:'later'})});assert.equal(x.intent.action,'reject');assert.equal(x.receipt.rawIntent.action,'approve');assert.ok(x.receipt.normalizations.length);
  x=await interpret(s,'The washer needs more time',{fetcher:fake({action:'delay',taskId:'laundry',kind:'release'})});assert.equal(x.intent.action,'clarify');assert.equal(x.intent.taskId,'laundry');assert.match(x.receipt.normalizations[0],/Missing delay/);
  x=await interpret(s,'Please check the plan',{fetcher:fake({action:'availability',personId:'maya',minutes:18})});assert.equal(x.intent.action,'clarify');assert.match(x.receipt.normalizations[0],/Ungrounded/);
});
