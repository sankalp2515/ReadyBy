export class DomainError extends Error { constructor(message,code='INVALID_ACTION'){super(message);this.code=code;} }
export const requireThat=(condition,message,code)=>{if(!condition)throw new DomainError(message,code);};
export function validateMission(s){
  requireThat(s?.schemaVersion===1,'Unsupported ReadyBy state.');
  requireThat(Number.isInteger(s.revision)&&s.revision>=0,'Invalid revision.');
  requireThat(['demo','realtime'].includes(s.clock?.mode),'Invalid clock.');
  requireThat(Number.isInteger(s.clock.now)&&Number.isInteger(s.deadline),'Invalid mission times.');
  requireThat(Array.isArray(s.people)&&s.people.length>=1&&s.people.length<=2,'Use one or two adults.');
  const people=new Set(s.people.map(p=>p.id));requireThat(people.size===s.people.length,'Duplicate participant.');
  for(const p of s.people){requireThat(typeof p.name==='string'&&p.name.length<=60,'Invalid participant name.');requireThat(Array.isArray(p.available)&&p.available.every(w=>w.length===2&&w.every(Number.isInteger)&&w[0]<w[1]),'Invalid availability.');}
  requireThat(Array.isArray(s.tasks)&&s.tasks.length>=1&&s.tasks.length<=8,'Use one to eight tasks.');
  const ids=new Set(s.tasks.map(t=>t.id));requireThat(ids.size===s.tasks.length,'Duplicate task.');
  for(const t of s.tasks){
    requireThat(typeof t.id==='string'&&/^[a-z][a-z0-9_-]{0,39}$/.test(t.id),'Invalid task ID.');
    requireThat(typeof t.title==='string'&&t.title.length>0&&t.title.length<=100,'Invalid task title.');
    requireThat(Number.isInteger(t.duration)&&t.duration>=1&&t.duration<=90,'Task duration must be 1–90 minutes.');
    requireThat(typeof t.required==='boolean'&&Number.isInteger(t.release),'Invalid task constraints.');
    requireThat(!t.barrier||t.required,'The final departure check must remain required.');
    requireThat(Array.isArray(t.deps)&&t.deps.every(id=>ids.has(id)&&id!==t.id),'Unknown prerequisite.');
    requireThat(Array.isArray(t.eligible)&&t.eligible.length>0&&t.eligible.every(id=>people.has(id)),'Invalid eligible participant.');
    requireThat(t.eligible.includes(t.owner),'Task owner is not eligible.');
    requireThat(['pending','active','paused','completed','deferred'].includes(t.status),'Invalid execution status.');
    if(t.status==='completed')requireThat(Number.isInteger(t.completedAt),'Completion needs a reported time.');
    if(t.status==='active')requireThat(Number.isInteger(t.startedAt)&&Number.isInteger(t.remaining)&&t.remaining>0,'Invalid active task.');
  }
  const visiting=new Set(),done=new Set();
  function visit(id){requireThat(!visiting.has(id),'Task prerequisites contain a cycle.');if(done.has(id))return;visiting.add(id);for(const dep of dependencies(s.tasks.find(t=>t.id===id),s.tasks))visit(dep);visiting.delete(id);done.add(id);}
  for(const id of ids)visit(id);
  requireThat(s.tasks.filter(t=>t.barrier).length<=1,'Use at most one final departure check.');
  return s;
}
export function dependencies(task,tasks){return task.barrier?[...new Set([...task.deps,...tasks.filter(t=>t.id!==task.id&&t.status!=='deferred').map(t=>t.id)])]:task.deps;}
