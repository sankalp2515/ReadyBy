export const clock = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export function initialState(){return {revision:0,date:'2026-10-22',people:[
  {id:'maya',name:'Maya',role:'Coordinator',color:'#4057c9',available:[[540,720]]},
  {id:'arun',name:'Arun',role:'Family',color:'#b86b36',available:[[900,1020]]},
  {id:'priya',name:'Priya',role:'Family',color:'#007f78',available:[[840,990]]},
  {id:'dev',name:'Dev',role:'Family',color:'#8760a0',available:[[780,840]]}
],tasks:[
  {id:'ride',title:'Take Leela to her appointment',kind:'Appointment ride',owner:'arun',status:'confirmed',start:900,end:960,detail:'Maple Centre · allow the full hour for the ride and visit'},
  {id:'meal',title:'Bring lunch to Leela',kind:'Lunch',owner:'maya',status:'confirmed',start:690,end:720,detail:'Leela requested vegetable soup'},
  {id:'visit',title:'Evening visit',kind:'Check-in',owner:'dev',status:'confirmed',start:1080,end:1110,detail:'Dev has already confirmed this visit'}
],offer:null,declined:[],events:[{id:1,text:'Tomorrow’s rides, lunch and visit were confirmed.',kind:'confirmed'}]};}
const person=(s,id)=>s.people.find(p=>p.id===id);
const available=(s,p,t)=>p.available.some(([a,b])=>a<=t.start&&b>=t.end)&&!s.tasks.some(x=>x.id!==t.id&&x.owner===p.id&&x.status==='confirmed'&&x.start<t.end&&x.end>t.start);
export function candidates(s){const t=s.tasks[0];return s.people.filter(p=>!s.declined.includes(p.id)&&available(s,p,t));}
export function coverage(s){const risks=s.tasks.filter(t=>t.status!=='confirmed');return {covered:risks.length===0,confirmed:s.tasks.length-risks.length,total:s.tasks.length};}
function minutes(time){if(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Use a valid 24-hour time, such as 14:00.');const [h,m]=time.split(':').map(Number);if(h*60+m>1380)throw Error('Choose a time with room for the full one-hour appointment.');return h*60+m;}
export function mutate(state,input){
  if(input.revision!==state.revision)throw Error('The plan changed. Refresh and review it before trying again.');
  if(!person(state,input.actor))throw Error('Unknown demo participant.');
  const s=structuredClone(state),t=s.tasks[0];let event;
  if(input.type==='reschedule'){
    if(input.actor!=='maya')throw Error('Only Maya can change the appointment in this scenario.');
    const start=minutes(input.time);if(start===t.start)throw Error('The appointment is already at that time.');
    t.start=start;t.end=start+60;s.offer=null;s.declined=[];
    t.status='at_risk';
    event=`Maya moved the appointment to ${clock(t.start)}. ${available(s,person(s,t.owner),t)?'The previous owner is available but must accept the new time.':'The existing owner cannot cover the new time; a replacement must accept.'}`;
  }else if(input.type==='offer'){
    if(input.actor!=='maya')throw Error('Only Maya can propose a handoff in this scenario.');
    if(t.status==='confirmed')throw Error('This task is already covered.');
    if(s.offer)throw Error('An offer is already pending. Wait for a response or change the appointment.');
    const p=candidates(s).find(p=>p.id===input.person);if(!p)throw Error('This person is not available for the entire task.');
    s.offer={person:p.id,start:t.start,end:t.end};event=`Maya offered the ${clock(t.start)} appointment ride to ${p.name}. Awaiting acceptance; the ride is still uncovered.`;
  }else if(input.type==='accept'||input.type==='decline'){
    if(!s.offer)throw Error('There is no pending offer.');
    const p=person(s,s.offer.person);if(input.actor!==p.id)throw Error(`Only ${p.name} can respond to this offer.`);
    if(input.type==='accept'){
      if(!available(s,p,t))throw Error('This person is no longer available. Review the plan.');
      t.owner=p.id;t.status='confirmed';event=`${p.name} accepted the ${clock(t.start)} appointment ride. The handoff is confirmed.`;
    }else{s.declined.push(p.id);event=`${p.name} declined the appointment ride. It remains uncovered.`;}
    s.offer=null;
  }else throw Error('Unsupported action.');
  s.revision++;s.events.push({id:s.revision+1,text:event,kind:t.status==='confirmed'?'confirmed':'attention'});return s;
}
export function explain(s){
  const t=s.tasks[0],owner=person(s,t.owner),ready=coverage(s);
  if(ready.covered)return `All ${ready.total} tasks are confirmed. ${owner.name} has accepted the appointment ride at ${clock(t.start)}. Lunch and the evening visit are unchanged.`;
  if(s.offer)return `${person(s,s.offer.person).name} has a pending offer for ${clock(t.start)}–${clock(t.end)}. The ride is still uncovered until they accept. Lunch and the evening visit are confirmed.`;
  const next=candidates(s);return `${available(s,owner,t)?`${owner.name} has not accepted the changed time`:`${owner.name} cannot cover ${clock(t.start)}–${clock(t.end)} with the supplied availability`}. ${next.length?`${next.map(p=>p.name).join(', ')} can cover the full hour. Review the candidate and offer the handoff.`:'No available replacement remains. Keep the ride uncovered and coordinate another arrangement.'}`;
}
export function command(s,actor,text){
  if(typeof text!=='string'||text.length>500)throw Error('Enter a message of 500 characters or fewer.');
  const q=text.trim().toLowerCase().replace(/[.!]$/,'');let input;
  const time=q.match(/^(?:please )?(?:move|reschedule|change) (?:the )?appointment to ([0-2]?\d:[0-5]\d)$/);
  if(time)input={type:'reschedule',time:time[1].padStart(5,'0')};
  else{const offer=q.match(/^(?:please )?(?:ask |offer (?:the ride to )?)(maya|arun|priya|dev)$/);if(offer){const p=s.people.find(p=>p.name.toLowerCase()===offer[1]);input={type:'offer',person:p.id};}}
  if(/^(i accept|accept|yes,? i can)$/.test(q))input={type:'accept'};
  if(/^(decline|i decline|i can'?t)$/.test(q))input={type:'decline'};
  if(input){const state=mutate(s,{...input,actor,revision:s.revision});return {state,reply:explain(state),tools:[{name:input.type==='reschedule'?'update_appointment':input.type==='offer'?'create_offer':'record_response',detail:state.events.at(-1).text},{name:'check_availability',detail:'Compared the complete task interval with supplied availability and other confirmed tasks.'},{name:'read_coverage',detail:`${coverage(state).confirmed}/${state.tasks.length} tasks confirmed. No external messages sent.`}]};}
  if(/\b(plan|covered|summary|tomorrow|unconfirmed|status|who|available)\b/.test(q))return {state:s,reply:explain(s),tools:[{name:'read_household_plan',detail:'Read persisted local tasks, supplied availability and acceptance states.'}]};
  return {state:s,reply:'This local prototype supports: “Move the appointment to 14:00”, “Who is available?”, “Ask Priya”, “I accept”, “I decline”, and “What is the plan?”. Use the participant switch to respond as the recipient. Other requests do not change the plan.',tools:[]};
}
