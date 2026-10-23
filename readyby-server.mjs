import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {openStore} from './src/readyby/store.mjs';
import {initialState} from './src/readyby/fixtures.mjs';
import {applyAction,viewState,analyze,describe} from './src/readyby/reducer.mjs';
import {interpret,actionFromIntent,agentHealth} from './src/readyby/agent.mjs';
import {requireThat} from './src/readyby/schema.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const assets={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css'],'/favicon.svg':['favicon.svg','image/svg+xml']};
function record(s,{text,reply,receipt,source}){if(text)s.messages.push({role:'user',text,at:new Date().toISOString()});if(reply)s.messages.push({role:'assistant',text:reply,at:new Date().toISOString()});s.messages=s.messages.slice(-80);s.receipts.push(receipt??{id:randomUUID(),kind:'domain',source,revision:s.revision,at:new Date().toISOString()});s.receipts=s.receipts.slice(-60);}
export async function createReadyByApp({dataFile=join(root,'data','readyby.json'),interpreter=interpret,health=agentHealth}={}){
  const store=await openStore(dataFile,{mode:process.env.READYBY_CLOCK==='realtime'?'realtime':'demo'});
  const server=http.createServer(async(req,res)=>{
    const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const hosts=new Set([`127.0.0.1:${server.address()?.port}`,`localhost:${server.address()?.port}`,`[::1]:${server.address()?.port}`]);
    if(!hosts.has(req.headers.host)){json(403,{error:'Local access only.'});return;}
    const path=new URL(req.url,'http://127.0.0.1').pathname;
    try{
      if(req.method==='GET'){
        if(path==='/api/state'){json(200,viewState(store.get()));return;}
        if(path==='/api/health'){json(200,await health());return;}
        if(path==='/api/export'){json(200,{...viewState(store.get()),disclosure:'Alexa+ web simulation. Reported physical work, not sensor-verified. Demo scenario fixtures are not live AI evidence.'});return;}
        if(!assets[path]){json(404,{error:'Not found.'});return;}
        const [file,type]=assets[path];const content=await readFile(join(root,'readyby','public',file));res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(content);return;
      }
      if(req.method!=='POST'||!['/api/action','/api/command','/api/reset','/api/scenario'].includes(path)){json(404,{error:'Not found.'});return;}
      if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{json(403,{error:'Invalid origin.'});return;}if(origin.protocol!=='http:'||!hosts.has(origin.host)){json(403,{error:'Cross-origin requests are not allowed.'});return;}}
      if(!req.headers['content-type']?.startsWith('application/json')){json(415,{error:'Use JSON.'});return;}
      let body;try{let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>20000)throw Error();}body=JSON.parse(raw);requireThat(body&&typeof body==='object'&&!Array.isArray(body),'Expected object.');}catch{json(400,{error:'Invalid JSON or request too large.'});return;}
      requireThat(typeof body.idempotencyKey==='string'&&body.idempotencyKey.length>=4&&body.idempotencyKey.length<=120,'Provide an idempotency key.');
      let ai=null;const snapshot=store.get();
      const previous=snapshot.commandRequests?.find(x=>x.key===body.idempotencyKey);
      if(path==='/api/command'&&previous){requireThat(previous.text===body.text,'Command key was used for different input.');json(200,{state:viewState(snapshot),reply:previous.reply,duplicate:true});return;}
      if(path==='/api/command'){requireThat(body.expectedRevision===snapshot.revision,'Mission changed; review and retry.','STALE_REVISION');ai=await interpreter(snapshot,body.text);}
      const result=await store.transaction(async s=>{
        if(path==='/api/action'){
          const result=applyAction(s,body);if(!result.duplicate)record(result.state,{reply:result.reply,source:'Household control',receipt:{id:randomUUID(),kind:'domain',tool:body.type,args:body,revision:result.state.revision,at:new Date().toISOString()}});return result;
        }
        requireThat(s.revision===body.expectedRevision,'The mission changed. Review and retry.','STALE_REVISION');
        if(path==='/api/reset'){
          const next=initialState({mode:body.mode==='realtime'?'realtime':'demo'});next.revision=s.revision+1;record(next,{reply:'New editable mission draft. No reported completion has been carried into this new mission.',source:'Explicit reset'});return {state:next,reply:'New draft ready.'};
        }
        if(path==='/api/scenario'){
          requireThat(['opening','delay','essential','return'].includes(body.scenario),'Unknown rehearsal.');
          let next=initialState();next.revision=s.revision+1;
          const run=a=>{next=applyAction(next,{...a,expectedRevision:next.revision,idempotencyKey:randomUUID()}).state;};
          run({type:'start_mission'});
          if(body.scenario!=='opening'){
            run({type:'progress',taskId:'bag',operation:'start'});run({type:'progress',taskId:'lunch',operation:'start'});
            run({type:'clock',minute:484});run({type:'progress',taskId:'lunch',operation:'complete'});run({type:'progress',taskId:'bottles',operation:'start'});
            run({type:'clock',minute:485});run({type:'progress',taskId:'bag',operation:'complete'});run({type:'progress',taskId:'breakfast',operation:'start'});
            run({type:'clock',minute:486});
            if(body.scenario==='essential')run({type:'edit_task',taskId:'laundry',field:'required',value:true});
            if(body.scenario==='return'){
              run({type:'delay',taskId:'laundry',minutes:15});const option=next.proposal.options.find(x=>x.kind==='defer');run({type:'approve',proposalId:option.id});
              run({type:'clock',minute:487});run({type:'progress',taskId:'bottles',operation:'complete'});run({type:'clock',minute:491});run({type:'progress',taskId:'breakfast',operation:'complete'});run({type:'progress',taskId:'shoes',operation:'start'});run({type:'clock',minute:494});run({type:'progress',taskId:'shoes',operation:'complete'});run({type:'progress',taskId:'final',operation:'start'});run({type:'clock',minute:496});run({type:'progress',taskId:'final',operation:'complete'});run({type:'clock',minute:540});
            }
          }
          next.messages=[{role:'assistant',text:`Rehearsal fixture loaded: ${body.scenario}. Time and reported progress were explicitly seeded through the real action engine. This fixture is not a live AI interaction.`}];record(next,{source:'Explicit rehearsal fixture'});return {state:next,reply:'Rehearsal ready. Use conversation or controls for the next live action.'};
        }
        const action=actionFromIntent(s,ai.intent);let result;
        if(action)result=applyAction(s,{...action,idempotencyKey:body.idempotencyKey,expectedRevision:body.expectedRevision});
        else result={state:s,reply:ai.intent.action==='clarify'?(ai.intent.question||'Which task or change do you mean?'):describe(s,analyze(s))};
        record(result.state,{text:body.text,reply:result.reply,receipt:{...ai.receipt,tool:action?.type??'get_mission',args:action??{},revision:result.state.revision,explanationSource:'Deterministic checked result'}});
        result.state.commandRequests??=[];result.state.commandRequests.push({key:body.idempotencyKey,text:body.text,reply:result.reply});result.state.commandRequests=result.state.commandRequests.slice(-60);return result;
      });
      json(200,{state:viewState(result.state),reply:result.reply,duplicate:result.duplicate??false});
    }catch(e){const code=e.code??'INVALID_ACTION';const status=code==='STALE_REVISION'?409:code.startsWith('AI_')?503:code==='INVALID_ACTION'||e.name==='DomainError'?400:500;json(status,{error:status===500?'Unable to save or process the request. No success has been recorded.':e.message,code});}
  });server.keepAliveTimeout=1000;return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=await createReadyByApp({dataFile:process.env.READYBY_DATA_FILE||undefined});server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`ReadyBy: http://127.0.0.1:${server.address().port} (Alexa+ simulation)`));}
