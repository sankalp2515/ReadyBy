import {validateMission,dependencies} from './schema.mjs';
import {currentTime,effortLeft} from './clock.mjs';
import {verifySchedule} from './verify.mjs';

// Serial schedule generation enumerates precedence-ready orders and assignments.
// Only independent checked schedules can become executable plans.
export function planMission(s,{now=currentTime(s),deferred=[],budget=40000,deadline=s.deadline}={}){
  validateMission(s);const skip=new Set(deferred),tasks=s.tasks.filter(t=>t.status!=='deferred'&&!skip.has(t.id));
  if([...skip].some(id=>s.tasks.some(t=>t.id===id&&(t.required||['active','completed'].includes(t.status)))))return {status:'invalid_input',reason:'A required, active or completed task cannot be deferred.'};
  if(tasks.some(t=>t.deps.some(id=>skip.has(id)||s.tasks.find(x=>x.id===id)?.status==='deferred')))return {status:'invalid_input',reason:'A retained task needs a deferred prerequisite.'};
  const fixed=tasks.filter(t=>t.status==='completed').map(t=>({taskId:t.id,personId:t.owner,start:t.actualStart??t.completedAt,end:t.completedAt,completed:true}));
  const active=tasks.filter(t=>t.status==='active').map(t=>({taskId:t.id,personId:t.owner,start:now,end:now+effortLeft(t,now),active:true}));
  const todo=tasks.filter(t=>!['completed','active'].includes(t.status));
  const earliestBound=new Map(fixed.map(x=>[x.taskId,x.end]));for(const x of active)earliestBound.set(x.taskId,x.end);
  function bound(t,seen=new Set()){if(earliestBound.has(t.id))return earliestBound.get(t.id);if(seen.has(t.id))return Infinity;seen.add(t.id);const v=Math.max(now,t.release,...dependencies(t,tasks).map(id=>bound(tasks.find(x=>x.id===id),new Set(seen))))+effortLeft(t,now);earliestBound.set(t.id,v);return v;}
  const lowerBound=Math.max(tasks.every(t=>t.status==='completed')?s.start:now,...tasks.map(t=>bound(t)));
  let best=null,visited=0,cut=false;const memo=new Set();
  function slotFor(t,p,slots){let start=Math.max(now,t.release,...dependencies(t,tasks).map(id=>slots.find(x=>x.taskId===id)?.end??Infinity));const duration=effortLeft(t,now),busy=slots.filter(x=>x.personId===p.id&&x.end>now).sort((a,b)=>a.start-b.start);
    for(const [a,b] of p.available){let candidate=Math.max(start,a);for(const x of busy){if(candidate+duration<=x.start)break;if(candidate<x.end&&candidate+duration>x.start)candidate=x.end;}if(candidate+duration<=b)return {taskId:t.id,personId:p.id,start:candidate,end:candidate+duration};}return null;
  }
  function visit(remaining,slots,changes){if(++visited>budget){cut=true;return;}const finish=Math.max(now,...slots.map(x=>x.end)),boundFinish=Math.max(finish,lowerBound),late=Math.max(0,boundFinish-deadline);if(best&&(late>Math.max(0,best.finish-deadline)||(late===Math.max(0,best.finish-deadline)&&(changes>best.changes||(changes===best.changes&&boundFinish>=best.finish)))))return;
    const key=slots.map(x=>`${x.taskId}:${x.personId}:${x.start}:${x.end}`).sort().join('|');if(memo.has(key))return;memo.add(key);
    if(!remaining.length){const checked=verifySchedule(s,slots,now,{deferred,deadline});if(checked.valid)best={schedule:slots,finish:checked.finish,changes,verification:checked};return;}
    for(const t of remaining){if(!dependencies(t,tasks).every(id=>slots.some(x=>x.taskId===id)))continue;for(const p of [...s.people].sort((a,b)=>Number(b.id===t.owner)-Number(a.id===t.owner))){if(!t.eligible.includes(p.id))continue;const x=slotFor(t,p,slots);if(x)visit(remaining.filter(x=>x.id!==t.id),[...slots,x],changes+Number(p.id!==t.owner));if(cut)return;}}
  }
  visit(todo,[...fixed,...active],0);
  if(!best)return {status:cut?'unknown_search_limit':'infeasible_proven',lowerBound,visited,optimizationComplete:!cut,reason:cut?'Search budget reached. No infeasibility claim.':'No valid allocation within supplied availability.'};
  const onTime=best.finish<=deadline;
  return {...best,status:onTime?'feasible':(lowerBound>deadline||!cut?'infeasible_proven':'unknown_search_limit'),lowerBound,visited,optimizationComplete:!cut,onTime,deadline,deferred,computedAt:now};
}
export function recoveryOptions(s,{now=currentTime(s)}={}){
  const full=planMission(s,{now});if(full.status==='feasible')return {full,alternatives:[]};
  const optional=s.tasks.filter(t=>!t.required&&['pending','paused'].includes(t.status));let best=null;
  for(let mask=1;mask<(1<<optional.length);mask++){const ids=optional.filter((_,i)=>mask&(1<<i)).map(t=>t.id);if(best&&ids.length>best.deferred.length)continue;const candidate=planMission(s,{now,deferred:ids,budget:25000});if(candidate.status==='feasible'&&(!best||ids.length<best.deferred.length||candidate.finish<best.finish))best=candidate;}
  return {full,alternatives:[...(best?[{kind:'defer',...best}]:[]),...(full.schedule?[{kind:'later',...full,proposedDeadline:full.finish}]:[])]};
}
