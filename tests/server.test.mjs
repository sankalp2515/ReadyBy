import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server.mjs';

test('API persists handoff, rejects stale actions and cross-origin mutations',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'kinrelay-'));
  let server;const start=async()=>{server=await createApp({dataFile:join(dir,'state.json')});await new Promise(r=>server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${server.address().port}`;};
  try{
    let base=await start();
    const post=async(path,body,origin)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
    let r=await post('/api/action',{actor:'maya',revision:0,type:'reschedule',time:'14:00'});assert.equal(r.status,200);
    r=await post('/api/action',{actor:'maya',revision:0,type:'offer',person:'priya'});assert.equal(r.status,409);
    r=await post('/api/reset',{},'https://evil.example');assert.equal(r.status,403);
    r=await post('/api/reset',{},'null');assert.equal(r.status,403);
    r=await post('/api/action',{actor:'maya',revision:1,type:'offer',person:'priya'});assert.equal(r.status,200);
    r=await post('/api/action',{actor:'priya',revision:2,type:'accept'});assert.equal(r.status,200);
    await new Promise(r=>server.close(r));base=await start();
    const s=await (await fetch(base+'/api/state')).json();assert.equal(s.tasks[0].owner,'priya');assert.equal(s.revision,3);
    const home=await fetch(base+'/');assert.equal(home.status,200);
    assert.match(await home.text(),/KinRelay/);
  }finally{if(server)await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
