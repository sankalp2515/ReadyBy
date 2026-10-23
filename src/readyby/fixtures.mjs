import {randomUUID} from 'node:crypto';
export function initialState({mode='demo'}={}){
  const start=mode==='realtime'?Math.floor(Date.now()/60000):480;
  const task=(id,title,duration,owner,deps=[],required=true,extra={})=>({id,title,duration,owner,deps,required,eligible:['maya','arun'],release:start,status:'pending',estimateSource:'Editable household template',...extra});
  return {schemaVersion:1,id:randomUUID(),revision:0,title:'Morning departure',phase:'draft',createdAt:new Date().toISOString(),clock:{mode,now:start,timezone:'Asia/Kolkata'},start,deadline:start+20,people:[{id:'maya',name:'Maya',available:[[start,start+180]]},{id:'arun',name:'Arun',available:[[start,start+180]]}],tasks:[
    task('bag','Pack school bag',5,'maya'),task('lunch','Pack lunch',4,'arun'),task('bottles','Fill bottles',3,'arun',['lunch']),task('breakfast','Clear breakfast',6,'maya',[],false),task('shoes','Get shoes ready',3,'maya',['bag']),task('laundry','Hang laundry',5,'arun',[],false,{release:start+12,waitLabel:'Washer finishes'}),task('final','Final check and lock up',2,'maya',[],true,{barrier:true})
  ],proposal:null,plan:null,events:[],receipts:[],messages:[{role:'assistant',text:'When do you need to leave? Review this editable morning template, or tell me what to change.'}],requests:[]};
}
