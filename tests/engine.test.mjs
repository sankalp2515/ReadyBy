import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, mutate, candidates, coverage, command } from '../src/engine.mjs';

const act = (s, type, actor='maya', extra={}) => mutate(s, {type, actor, revision:s.revision, ...extra});
const moved = () => act(initialState(), 'reschedule', 'maya', {time:'14:00'});

test('appointment change creates uncovered task and filters full availability', () => {
  const s=moved();
  assert.equal(coverage(s).covered,false);
  assert.deepEqual(candidates(s).map(p=>p.id),['priya']);
  assert.equal(s.tasks[0].owner,'arun');
});
test('offer does not count as coverage; intended participant must accept', () => {
  let s=act(moved(),'offer','maya',{person:'priya'});
  assert.equal(coverage(s).covered,false);
  assert.throws(()=>act(s,'accept','maya'),/Only Priya/);
  s=act(s,'accept','priya');
  assert.equal(coverage(s).covered,true);
  assert.equal(s.tasks[0].owner,'priya');
});
test('stale revision and double acceptance are rejected', () => {
  let s=act(moved(),'offer','maya',{person:'priya'});
  assert.throws(()=>mutate(s,{type:'accept',actor:'priya',revision:0}),/changed/);
  s=act(s,'accept','priya');
  assert.throws(()=>act(s,'accept','priya'),/pending/);
});
test('reschedule invalidates an outstanding offer', () => {
  let s=act(moved(),'offer','maya',{person:'priya'});
  s=act(s,'reschedule','maya',{time:'13:00'});
  assert.equal(s.offer,null);
  assert.throws(()=>act(s,'accept','priya'),/pending/);
});
test('decline does not imply coverage and excludes candidate', () => {
  let s=act(moved(),'offer','maya',{person:'priya'});
  s=act(s,'decline','priya');
  assert.equal(coverage(s).covered,false);
  assert.deepEqual(candidates(s),[]);
});
test('availability conflict and unknown participant cannot be offered',()=>{
  assert.throws(()=>act(moved(),'offer','maya',{person:'dev'}),/available/);
  assert.throws(()=>act(moved(),'offer','maya',{person:'stranger'}),/available/);
});
test('planner excludes overlapping commitments',()=>{
  const s=moved(); s.tasks.push({id:'other',owner:'priya',status:'confirmed',start:840,end:900});
  assert.deepEqual(candidates(s),[]);
});
test('command fallback and malformed times leave state unchanged',()=>{
  const s=initialState();
  assert.equal(command(s,'maya','book an ambulance').state.revision,s.revision);
  assert.throws(()=>act(s,'reschedule','maya',{time:'25:00'}),/time/);
  assert.throws(()=>act(s,'reschedule','priya',{time:'14:00'}),/Maya/);
});
test('supported typed command calls real planner and emits activity',()=>{
  const r=command(initialState(),'maya','Move the appointment to 14:00');
  assert.equal(r.state.tasks[0].start,840);
  assert.ok(r.tools.some(t=>t.name==='check_availability'));
  assert.match(r.reply,/Priya/);
});
test('a new time always needs fresh acceptance even if the old owner is available',()=>{
  const s=act(initialState(),'reschedule','maya',{time:'15:30'});
  assert.equal(coverage(s).covered,false);
  assert.ok(candidates(s).some(p=>p.id==='arun'));
});
test('negations and questions containing action words never execute mutations',()=>{
  for(const text of ['Do not move the appointment to 14:00','Can you move the appointment to 14:00?','Do not ask Priya','Ask Priya or Dev']){
    const s=moved();assert.equal(command(s,'maya',text).state.revision,s.revision,text);
  }
});
test('typed offer supports the advertised Ask Priya command',()=>{
  const r=command(moved(),'maya','Ask Priya');
  assert.equal(r.state.offer?.person,'priya');
});
