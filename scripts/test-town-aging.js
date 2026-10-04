const assert=require('node:assert/strict'),sim=require('../src/town-sim.js');const H=3600000,start=new Date(2026,9,4,12).getTime();
assert.equal(sim.stageFor(1.49),'成年');assert.equal(sim.stageFor(1.5),'老年');assert.equal(sim.stageFor(2),'长寿');assert.equal(sim.stageFor(3),'无敌长寿');
for(const age of [1.5,1.8,2,2.5,3]){const p=sim.agingProfile(age),young=sim.agingProfile(1);assert.ok(p.movement<=young.movement&&p.appetite<=young.appetite&&p.sleep>=young.sleep&&p.illnessRisk>=young.illnessRisk)}
let hitAt;for(let i=1;i<5000;i++){const at=start+i*H;if(sim.illnessHits('main:2024-06-09',at-H,at,1)){hitAt=at;break}}assert.ok(hitAt);
const base=sim.defaults(hitAt-H);Object.assign(base,{ageYearsValue:1,aging:false,illness:true,mortality:false,health:90,food:100,activityUntil:hitAt+H});
const once=sim.settle(structuredClone(base),hitAt);let minute=structuredClone(base);for(let i=1;i<=60;i++)minute=sim.settle(minute,hitAt-H+i*60000);
const illness=s=>s.events.filter(e=>e.type==='health');assert.equal(illness(once).length,1);assert.deepEqual(illness(minute).map(e=>e.time),illness(once).map(e=>e.time));assert.ok(Math.abs(once.health-minute.health)<1e-6);
assert.equal(illness(sim.settle({...base,illness:false},hitAt)).length,0);assert.equal(illness(sim.settle(once,hitAt)).length,1);
let young=0,old=0;for(let i=0;i<10000;i++){young+=sim.illnessHits('sample',start+i*H,start+(i+1)*H,1);old+=sim.illnessHits('sample',start+i*H,start+(i+1)*H,2.8)}assert.ok(old>young*4);
const lives=Array.from({length:10000},(_,i)=>sim.lifespan('sample-'+i));assert.ok(lives.every(v=>v>=1.85&&v<=3.05));assert.ok(lives.filter(v=>v<2.25).length>7500);assert.ok(lives.filter(v=>v>=3).length<50);
const aged=sim.defaults(start);Object.assign(aged,{ageYearsValue:3.1,health:100,mortality:true});assert.equal(sim.settle(aged,start+H).alive,false);assert.equal(sim.settle({...aged,mortality:false},start+H).alive,true);
console.log('Aging stages, illness online/offline equivalence, risk growth, toggle and lifespan distribution passed');
const youngState=sim.defaults(start);Object.assign(youngState,{ageYearsValue:1,aging:false,activityUntil:start+H*2,fullness:100});const oldState={...structuredClone(youngState),ageYearsValue:2.8};const y=sim.settle(youngState,start+H),o=sim.settle(oldState,start+H);assert.ok(o.fullness>y.fullness,'older residents need less food');assert.ok(o.health<y.health,'older residents gradually lose resilience');
const family=sim.defaults(start);family.offspring=[{id:'elder-child',name:'老小鼠',ageYears:3.2,stage:'无敌长寿',alive:true}];const gone=sim.settle(family,start+H);assert.equal(gone.offspring[0].alive,false);assert.equal(gone.memorials.filter(n=>n.id==='elder-child').length,1);assert.equal(sim.settle(gone,start+2*H).memorials.filter(n=>n.id==='elder-child').length,1);assert.equal(sim.adopt(gone,'elder-child').ok,false);
console.log('Age-dependent appetite, health decline and offspring farewell passed');
