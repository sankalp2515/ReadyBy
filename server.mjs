import http from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {initialState,mutate,command,explain} from './src/engine.mjs';
const root=dirname(fileURLToPath(import.meta.url));
export async function createApp({dataFile=join(root,'data','state.json')}={}){
  let state;try{state=JSON.parse(await readFile(dataFile,'utf8'));if(!Number.isInteger(state.revision)||!Array.isArray(state.tasks))throw Error('Invalid state file.');}catch(e){if(e.code!=='ENOENT')throw e;state=initialState();}
  let queue=Promise.resolve();
  const persist=async next=>{await mkdir(dirname(dataFile),{recursive:true});await writeFile(dataFile+'.tmp',JSON.stringify(next,null,2));await rename(dataFile+'.tmp',dataFile);state=next;};
  const server=http.createServer(async(req,res)=>{
    const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const expected=new Set([`127.0.0.1:${server.address()?.port}`,`localhost:${server.address()?.port}`]);
    if(!expected.has(req.headers.host)){send(403,{error:'Local requests only.'});return;}
    const path=new URL(req.url,'http://127.0.0.1').pathname;
    if(req.method==='GET'){
      if(path==='/api/state'){send(200,state);return;}
      const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
      if(!files[path]){send(404,{error:'Not found.'});return;}
      try{const [file,type]=files[path];const data=await readFile(join(root,'public',file));res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data);}catch{send(500,{error:'Unable to load the interface.'});}return;
    }
    if(req.method!=='POST'||!['/api/action','/api/command','/api/reset'].includes(path)){send(404,{error:'Not found.'});return;}
    if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{send(403,{error:'Invalid origin.'});return;}if(origin.protocol!=='http:'||!expected.has(origin.host)){send(403,{error:'Cross-origin requests are not allowed.'});return;}}
    if(!req.headers['content-type']?.startsWith('application/json')){send(415,{error:'Use application/json.'});return;}
    let body;try{let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw Error('Request too large.');}body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Expected an object.');}catch{send(400,{error:'Invalid JSON or request too large.'});return;}
    const work=queue.then(async()=>{
      if(path==='/api/reset'){await persist(initialState());return {state,reply:'The fictional household scenario has been reset.',tools:[]};}
      if(body.revision!==state.revision)throw Error('The plan changed. Refresh and review it before trying again.');
      const result=path==='/api/command'?command(state,body.actor,body.text):{state:mutate(state,body)};
      if(result.state!==state)await persist(result.state);
      return {...result,state,reply:result.reply??explain(state),tools:result.tools??[{name:body.type,detail:state.events.at(-1).text}]};
    });queue=work.catch(()=>{});
    try{send(200,await work);}catch(e){send(e.message.includes('changed')?409:400,{error:e.message});}
  });return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.PORT||4173);const server=await createApp();server.listen(port,'127.0.0.1',()=>console.log(`KinRelay prototype: http://127.0.0.1:${port}`));
}
