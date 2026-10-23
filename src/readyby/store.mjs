import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {initialState} from './fixtures.mjs';
import {validateMission} from './schema.mjs';
export async function openStore(file,{mode='demo'}={}){
  let state;try{state=JSON.parse(await readFile(file,'utf8'));validateMission(state);}catch(e){if(e.code!=='ENOENT')throw new Error('Saved ReadyBy data is invalid. Preserve it and choose a different data path to recover.');state=initialState({mode});}
  let queue=Promise.resolve();
  return {get:()=>structuredClone(state),transaction(fn){const work=queue.then(async()=>{const result=await fn(structuredClone(state));if(result.state){validateMission(result.state);await mkdir(dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(result.state,null,2));await rename(file+'.tmp',file);state=result.state;}return result;});queue=work.catch(()=>{});return work;}};
}
