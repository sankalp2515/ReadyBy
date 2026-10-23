import {dependencies} from './schema.mjs';
import {effortLeft} from './clock.mjs';
export function verifySchedule(s,schedule,now,{deferred=[],deadline=s.deadline}={}){
  const errors=[],skip=new Set(deferred),tasks=s.tasks.filter(t=>t.status!=='deferred'&&!skip.has(t.id));
  for(const id of skip){const t=s.tasks.find(t=>t.id===id);if(!t||t.required||['completed','active'].includes(t.status))errors.push(`Cannot defer ${id}.`);}
  if(schedule.length!==tasks.length)errors.push('Schedule must contain every retained task exactly once.');
  const byId=new Map();for(const slot of schedule){if(byId.has(slot.taskId))errors.push(`Duplicate ${slot.taskId}.`);byId.set(slot.taskId,slot);}
  for(const t of tasks){const x=byId.get(t.id);if(!x){errors.push(`Missing ${t.id}.`);continue;}if(!Number.isInteger(x.start)||!Number.isInteger(x.end)||x.end<x.start)errors.push(`Invalid times for ${t.id}.`);
    if(!t.eligible.includes(x.personId))errors.push(`Ineligible person for ${t.id}.`);
    if(t.status==='completed'){if(x.end!==t.completedAt||x.personId!==t.owner)errors.push(`Changed completion ${t.id}.`);continue;}
    if(x.start<now||x.start<t.release)errors.push(`Started too early: ${t.id}.`);
    if(x.end-x.start!==effortLeft(t,now))errors.push(`Wrong effort: ${t.id}.`);
    if(t.status==='active'&&(x.personId!==t.owner||x.start!==now))errors.push(`Moved active work: ${t.id}.`);
    for(const id of dependencies(t,tasks)){const predecessor=byId.get(id);if(!predecessor||predecessor.end>x.start)errors.push(`Prerequisite ${id} not ready for ${t.id}.`);}
    const p=s.people.find(p=>p.id===x.personId);if(!p?.available.some(([a,b])=>a<=x.start&&b>=x.end))errors.push(`Unavailable participant for ${t.id}.`);
  }
  for(const x of schedule){if(!tasks.some(t=>t.id===x.taskId))errors.push(`Unexpected task ${x.taskId}.`);for(const y of schedule){if(x.taskId>=y.taskId||x.personId!==y.personId)continue;if(x.start<y.end&&y.start<x.end)errors.push(`Overlapping ${x.taskId} and ${y.taskId}.`);}}
  const finish=Math.max(tasks.every(t=>t.status==='completed')?s.start:now,...schedule.map(x=>x.end));return {valid:errors.length===0,errors,finish,deadline,onTime:errors.length===0&&finish<=deadline,buffer:deadline-finish,checks:['All retained tasks accounted for','Prerequisites and releases','Participant eligibility and availability','No overlapping work','Reported completions preserved','Deadline compared to actual schedule']};
}
