import {randomUUID} from 'node:crypto';
import {validateMission,requireThat,dependencies} from './schema.mjs';
import {currentTime,displayTime,effortLeft} from './clock.mjs';
import {planMission,recoveryOptions} from './planner.mjs';
import {verifySchedule} from './verify.mjs';

export function describe(s,analysis){
  const full=analysis.full,now=currentTime(s),fmt=n=>displayTime(n,s),pending=s.tasks.filter(t=>!['completed','deferred'].includes(t.status));
  if(!pending.length)return 'All retained tasks are reported complete. Deferred work remains saved for later.';
  if(full.status==='feasible'){const buffer=Math.max(0,s.deadline-full.finish);return `With your estimates, remaining work finishes at ${fmt(full.finish)}. ${buffer} minute${buffer===1?'':'s'} of planned buffer before ${fmt(s.deadline)}.`;}
  const laundry=s.tasks.find(t=>t.id==='laundry'&&t.status!=='completed'&&t.status!=='deferred'),defer=analysis.alternatives.find(x=>x.kind==='defer');
  const cause=laundry&&laundry.release>=s.deadline?`The washer is ready at ${fmt(laundry.release)}. Laundry needs ${effortLeft(laundry,now)} minutes, then the final check needs ${s.tasks.find(t=>t.barrier)?.duration??0}. `:'';
  if(full.status==='unknown_search_limit')return 'I could not establish an on-time plan within the search budget. That is not proof the deadline is impossible.';
  return `${cause}${full.schedule?`All retained work finishes at ${fmt(full.finish)}, ${Math.max(0,full.finish-s.deadline)} minutes after departure.`:'The remaining work cannot fit the supplied availability.'}${defer?` Defer ${defer.deferred.map(id=>id==='laundry'?'laundry':s.tasks.find(t=>t.id===id).title.toLowerCase()).join(' and ')} and finish at ${fmt(defer.finish)}. Keep your departure?`:' Required work cannot be silently deferred. Review a later departure or change a constraint.'}`;
}
export function analyze(s){return recoveryOptions(s);}
export function viewState(s){const analysis=analyze(s),now=currentTime(s);return {...s,now,analysis,summary:describe(s,analysis),nextActions:s.people.map(p=>{
    const active=s.tasks.find(t=>t.owner===p.id&&t.status==='active');
    const plan=analysis.full.schedule??[],next=active??plan.slice().sort((a,b)=>a.start-b.start).map(x=>s.tasks.find(t=>t.id===x.taskId)).find(t=>t&&t.owner===p.id&&['pending','paused'].includes(t.status));
    const ready=next&&next.release<=now&&p.available.some(([a,b])=>a<=now&&b>=now+effortLeft(next,now))&&dependencies(next,s.tasks.filter(t=>t.status!=='deferred')).every(id=>s.tasks.find(t=>t.id===id)?.status==='completed');
    return {person:p,task:next??null,ready:Boolean(ready),remaining:next?effortLeft(next,now):0};
  })};}
function event(s,kind,text,details={}){s.events.push({id:randomUUID(),revision:s.revision,at:currentTime(s),kind,text,...details});}
function buildProposal(s,analysis){const reassigned=analysis.full.status==='feasible'&&analysis.full.schedule?.some(x=>s.tasks.find(t=>t.id===x.taskId).owner!==x.personId);const candidates=reassigned?[{...analysis.full,kind:'reassign'}]:analysis.alternatives;const options=candidates.filter(x=>x.kind==='defer'||x.kind==='reassign'||x.proposedDeadline>s.deadline).map(x=>({id:randomUUID(),kind:x.kind,baseRevision:s.revision,evaluatedAt:currentTime(s),validUntil:currentTime(s)+2,deferred:x.deferred??[],deadline:x.kind==='later'?x.proposedDeadline:s.deadline,finish:x.finish,schedule:x.schedule,verification:x.verification}));s.proposal=options.length?{id:randomUUID(),baseRevision:s.revision,options}:null;}
function recompute(s,{propose=true}={}){const a=analyze(s);if(propose&&s.phase==='active')buildProposal(s,a);else s.proposal=null;return a;}
export function applyAction(state,input){
  requireThat(input&&typeof input==='object','Expected an action.');
  requireThat(typeof input.idempotencyKey==='string'&&input.idempotencyKey.length>=4&&input.idempotencyKey.length<=120,'Provide an idempotency key.');
  const duplicate=state.requests.find(r=>r.key===input.idempotencyKey);if(duplicate){requireThat(duplicate.payload===JSON.stringify({...input,expectedRevision:undefined}),'Idempotency key was used for a different action.');return {state,reply:duplicate.reply,duplicate:true};}
  requireThat(input.expectedRevision===state.revision,'The mission changed. Review it before applying this action.','STALE_REVISION');
  const s=structuredClone(state);s.revision++;const now=currentTime(s);let reply,analysis;
  const task=()=>{const t=s.tasks.find(t=>t.id===input.taskId);requireThat(t,'Unknown task.');return t;};
  if(input.type==='draft_mission'){
    requireThat(s.phase==='draft','Create a new draft only before starting a mission.');
    if(input.deadline!==undefined){requireThat(Number.isInteger(input.deadline)&&input.deadline>now&&input.deadline<=now+180,'Departure must be within the next three hours.');s.deadline=input.deadline;}
    if(input.tasks!==undefined){requireThat(Array.isArray(input.tasks)&&input.tasks.length>=1&&input.tasks.length<=8,'Use one to eight tasks.');s.tasks=input.tasks.map((t,i)=>({id:t.id,title:t.title,duration:t.duration,owner:t.owner??s.people[i%s.people.length].id,deps:t.deps??[],required:t.required??true,eligible:s.people.map(p=>p.id),release:now+(t.waitMinutes??0),status:'pending',estimateSource:'AI estimate; review before starting',barrier:t.barrier===true}));}
    validateMission(s);analysis=recompute(s);event(s,'draft_updated','Mission draft updated. Estimates and priorities need household approval.');reply=`Draft ready for review. ${describe(s,analysis)}`;
  }else if(input.type==='start_mission'){
    requireThat(s.phase==='draft','This mission has already started.');analysis=analyze(s);requireThat(analysis.full.schedule,'Cannot start without a checked schedule.');s.phase='active';s.plan=analysis.full.schedule;for(const slot of s.plan)s.tasks.find(t=>t.id===slot.taskId).owner=slot.personId;buildProposal(s,analysis);event(s,'mission_started','Household approved the draft, allocations and estimates.');reply=describe(s,analysis);
  }else if(input.type==='progress'){
    requireThat(s.phase==='active','Start the mission first.');const t=task();
    requireThat(['start','complete','pause','resume'].includes(input.operation),'Unknown progress action.');
    if(input.operation==='start'||input.operation==='resume'){
      requireThat(input.operation==='start'?t.status==='pending':t.status==='paused','This task cannot start from its current state.');
      requireThat(t.release<=now,'This task is still waiting on its release time.');requireThat(dependencies(t,s.tasks.filter(t=>t.status!=='deferred')).every(id=>s.tasks.find(t=>t.id===id).status==='completed'),'Finish the prerequisites first.');
      requireThat(!s.tasks.some(x=>x.id!==t.id&&x.owner===t.owner&&x.status==='active'),'This person already has active work.');
      const duration=t.remaining??t.duration,p=s.people.find(p=>p.id===t.owner);requireThat(p.available.some(([a,b])=>a<=now&&b>=now+duration),'This person is unavailable for the task.');
      t.status='active';t.remaining=duration;t.startedAt=now;t.actualStart=now;t.workSegments??=[];
    }else if(input.operation==='pause'){
      requireThat(t.status==='active','Only active work can be paused.');requireThat(Number.isInteger(input.remainingMinutes)&&input.remainingMinutes>=1&&input.remainingMinutes<=90,'Confirm 1–90 minutes of remaining work.');t.workSegments??=[];t.workSegments.push({start:t.actualStart??t.startedAt,end:now,source:'Explicit pause'});t.status='paused';t.remaining=input.remainingMinutes;delete t.startedAt;
    }else{
      requireThat(['pending','active','paused'].includes(t.status),'Task already complete or deferred.');requireThat(t.release<=now,'Cannot confirm this task before its release.');requireThat(dependencies(t,s.tasks.filter(t=>t.status!=='deferred')).every(id=>s.tasks.find(t=>t.id===id).status==='completed'),'Cannot complete work whose prerequisites are unconfirmed.');
      if(t.status==='active'){t.workSegments??=[];t.workSegments.push({start:t.actualStart??t.startedAt,end:now,source:'Explicit completion'});}else{t.actualStart=now;}t.status='completed';t.completedAt=now;t.actualStart??=now;delete t.startedAt;delete t.remaining;t.completionSource='Explicit household report';
    }
    event(s,'progress',`${t.title}: ${input.operation==='complete'?'reported complete':input.operation}.`,{taskId:t.id});analysis=recompute(s);reply=input.operation==='complete'?`${t.title} is recorded complete. ${describe(s,analysis)}`:`${t.title}: ${input.operation}.`;
  }else if(input.type==='delay'){
    requireThat(s.phase==='active','Start the mission first.');const t=task();requireThat(!['completed','deferred'].includes(t.status),'This task is not in the remaining departure plan.');
    requireThat(Number.isInteger(input.minutes)&&input.minutes>=0&&input.minutes<=120,'Use 0–120 minutes.');
    if(input.kind==='remaining'){requireThat(t.status==='active'||t.status==='paused','Remaining effort applies to active or paused work.');requireThat(input.minutes>=1&&input.minutes<=90,'Use 1–90 minutes remaining.');t.remaining=input.minutes;if(t.status==='active')t.startedAt=now;}
    else {requireThat(t.status==='pending','Release updates apply to pending work.');t.release=now+input.minutes;t.releaseSource='Explicit household estimate';}
    event(s,'disruption',`${t.title}: ${input.kind==='remaining'?'remaining work':'ready in'} ${input.minutes} minutes.`,{taskId:t.id});analysis=recompute(s);reply=describe(s,analysis);
  }else if(input.type==='edit_task'){
    const t=task();requireThat(!['active','completed','deferred'].includes(t.status),'Edit pending or paused work only.');
    requireThat(['duration','required','owner','release'].includes(input.field),'Unsupported task field.');
    if(input.field==='duration'){requireThat(Number.isInteger(input.value)&&input.value>=1&&input.value<=90,'Use a duration from 1–90 minutes.');t.duration=input.value;if(t.status==='paused')t.remaining=input.value;}
    if(input.field==='required'){requireThat(typeof input.value==='boolean','Required must be true or false.');requireThat(!t.barrier||input.value,'Final check must stay required.');t.required=input.value;}
    if(input.field==='owner'){requireThat(t.eligible.includes(input.value),'Unknown or ineligible participant.');t.owner=input.value;}
    if(input.field==='release'){requireThat(Number.isInteger(input.value)&&input.value>=now&&input.value<=now+180,'Release must be within the next three hours.');t.release=input.value;}
    event(s,'constraint_changed',`${t.title}: ${input.field} changed by the household.`,{taskId:t.id});validateMission(s);analysis=recompute(s);reply=describe(s,analysis);
  }else if(input.type==='availability'){
    requireThat(s.phase==='active','Start the mission first.');const p=s.people.find(p=>p.id===input.personId);requireThat(p,'Unknown participant.');requireThat(Number.isInteger(input.minutes)&&input.minutes>=1&&input.minutes<=120,'Use 1–120 minutes.');requireThat(!s.tasks.some(t=>t.owner===p.id&&t.status==='active'),'Pause active work before changing this person’s availability.');p.available=p.available.flatMap(([a,b])=>b<=now?[[a,b]]:b<=now+input.minutes?[]:[[Math.max(a,now+input.minutes),b]]);event(s,'disruption',`${p.name} unavailable for ${input.minutes} minutes.`);analysis=recompute(s);reply=describe(s,analysis);
  }else if(input.type==='approve'){
    const option=s.proposal?.options.find(x=>x.id===input.proposalId);requireThat(option&&s.proposal.baseRevision===state.revision,'This proposal changed. Review a fresh revision.','STALE_REVISION');requireThat(now<=option.validUntil,'This proposal expired. Ask for a fresh calculation.','STALE_REVISION');
    const fresh=planMission(s,{deferred:option.deferred,deadline:option.deadline});requireThat(fresh.status==='feasible','The proposed revision no longer fits. Recalculate first.','STALE_REVISION');
    const checked=verifySchedule(s,fresh.schedule,now,{deferred:option.deferred,deadline:option.deadline});requireThat(checked.valid&&checked.onTime,'Revision failed independent validation.');
    for(const id of option.deferred){const t=s.tasks.find(t=>t.id===id);t.status='deferred';t.deferredAt=now;t.deferredReason='Household-approved departure recovery';}
    const previous=s.deadline;s.deadline=option.deadline;s.plan=fresh.schedule;s.proposal=null;for(const slot of fresh.schedule){const t=s.tasks.find(t=>t.id===slot.taskId);if(t.status!=='completed'&&t.status!=='active')t.owner=slot.personId;}
    event(s,'revision_approved',`Approved ${option.kind==='defer'?'deferral of '+option.deferred.join(', '):option.kind==='reassign'?'new task allocation':'departure change from '+displayTime(previous,s)+' to '+displayTime(s.deadline,s)}.`,{proposalId:option.id});analysis=analyze(s);reply=`Revision saved. ${describe(s,analysis)}`;
  }else if(input.type==='reject'){
    requireThat(s.proposal,'There is no pending revision.');s.proposal=null;event(s,'revision_rejected','Household kept current commitments; observed changes remain saved.');analysis=analyze(s);reply=`Current commitments kept. ${describe(s,analysis)}`;
  }else if(input.type==='recalculate'){
    analysis=recompute(s);event(s,'recalculated','Remaining work checked against current time.');reply=describe(s,analysis);
  }else if(input.type==='clock'){
    requireThat(s.clock.mode==='demo','Time controls are available only in demo mode.');requireThat(Number.isInteger(input.minute)&&input.minute>=now&&input.minute<=s.start+180,'Demo time can advance within this three-hour mission.');s.clock.now=input.minute;event(s,'demo_clock',`Explicit demo clock advanced to ${displayTime(input.minute,s)}. No tasks were auto-completed.`);analysis=recompute(s);reply=describe(s,analysis);
  }else if(input.type==='resume_deferred'){
    const t=task();requireThat(t.status==='deferred','This task is not deferred.');requireThat(s.tasks.filter(t=>t.status!=='deferred').every(t=>t.status==='completed'),'Finish the current departure work before resuming deferred work.');requireThat(input.readyConfirmed===true,'Confirm the washer and assigned person are ready now before resuming.');requireThat(Number.isInteger(input.deadline)&&input.deadline>now&&input.deadline<=now+180,'Choose a new execution deadline within three hours.');s.people.find(p=>p.id===t.owner).available=[[now,now+180]];
    s.previousDepartures??=[];s.previousDepartures.push({deadline:s.deadline,at:now});s.deadline=input.deadline;s.title='Finish deferred work';t.status='pending';t.release=now;t.resumedAt=now;s.phase='active';event(s,'resumed',`${t.title} resumed in a new execution context; readiness explicitly confirmed.`);analysis=recompute(s);reply=describe(s,analysis);
  }else throw new Error('Unknown action.');
  validateMission(s);s.requests.push({key:input.idempotencyKey,payload:JSON.stringify({...input,expectedRevision:undefined}),reply});s.requests=s.requests.slice(-150);return {state:s,reply,analysis};
}
