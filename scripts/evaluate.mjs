import {spawnSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {initialState} from '../src/readyby/fixtures.mjs';
import {planMission} from '../src/readyby/planner.mjs';
import {verifySchedule} from '../src/readyby/verify.mjs';

// Independent tiny-instance oracle: enumerate every minute and person, not SGS.
function oracle(s){const scheduled=[];function place(i){if(i===s.tasks.length)return true;const t=s.tasks[i];for(const p of s.people){if(!t.eligible.includes(p.id))continue;for(let start=Math.max(0,t.release);start+t.duration<=s.deadline;start++){const end=start+t.duration;if(!p.available.some(([a,b])=>a<=start&&end<=b))continue;if(t.deps.some(id=>!scheduled.some(x=>x.id===id&&x.end<=start)))continue;if(scheduled.some(x=>x.person===p.id&&x.start<end&&start<x.end))continue;scheduled.push({id:t.id,person:p.id,start,end});if(place(i+1))return true;scheduled.pop();}}return false;}return place(0);}
let seed=20261022;const rnd=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
const cases=[];for(let i=0;i<48;i++){const s=initialState();s.start=0;s.clock.now=0;s.deadline=5+rnd(5);s.people.forEach(p=>p.available=[[0,12]]);s.tasks=s.tasks.slice(0,2+rnd(3));for(let j=0;j<s.tasks.length;j++){const t=s.tasks[j];t.duration=1+rnd(5);t.release=rnd(3);t.deps=j&&rnd(2)?[s.tasks[j-1].id]:[];t.eligible=rnd(3)===0?[t.owner]:['maya','arun'];t.required=true;t.barrier=false;}const expected=oracle(s),actual=planMission(s,{budget:100000});const pass=expected===(actual.status==='feasible')&&(!actual.schedule||verifySchedule(s,actual.schedule,0).valid);cases.push({id:i+1,expectedFeasible:expected,actualStatus:actual.status,pass,visited:actual.visited});}
const tests=spawnSync(process.execPath,['--test'],{encoding:'utf8'});
await mkdir('docs/evidence',{recursive:true});await writeFile('docs/evidence/tests.tap',tests.stdout+tests.stderr);const passed=cases.filter(x=>x.pass).length;
const report={at:new Date().toISOString(),node:process.version,testExitCode:tests.status,oracle:{seed:20261022,cases:cases.length,passed,scope:'2–4 tasks, two people, integer minutes; independent all-start-time enumeration',results:cases}};await writeFile('docs/evidence/system-evaluation.json',JSON.stringify(report,null,2));
console.log(`Tests exit: ${tests.status}; independent oracle: ${passed}/${cases.length}.`);console.log('Evidence saved in docs/evidence.');
if(tests.status!==0||passed!==cases.length)process.exitCode=1;
