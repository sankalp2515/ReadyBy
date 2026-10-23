export const currentTime=s=>s.clock.mode==='demo'?s.clock.now:Math.floor(Date.now()/60000);
export function displayTime(n,s){if(n==null||!Number.isFinite(n))return '—';if(s?.clock?.mode==='realtime')return new Intl.DateTimeFormat('en-GB',{timeZone:s.clock.timezone||'Asia/Kolkata',hour:'2-digit',minute:'2-digit'}).format(new Date(n*60000));return `${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
export function effortLeft(t,now){if(t.status==='active')return Math.max(1,t.remaining-Math.max(0,now-t.startedAt));return t.remaining??t.duration;}
