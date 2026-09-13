const assert=require('node:assert/strict');
const sim=require('../src/town-sim.js');
const HOUR=3600000,DAY=24*HOUR,start=new Date(2026,8,13,0,0,0).getTime();

assert.equal(sim.daypart(new Date(2026,8,13,5).getTime()),'深夜');
assert.equal(sim.daypart(new Date(2026,8,13,12).getTime()),'白天');
assert.equal(sim.daypart(new Date(2026,8,13,18).getTime()),'傍晚');
assert.equal(sim.daypart(new Date(2026,8,13,22).getTime()),'夜晚');
assert.deepEqual(sim.weather(start),sim.weather(start));

const initial=sim.defaults(start);initial.food=30;
const continuous=sim.settle(structuredClone(initial),start+3*DAY);
let segmented=structuredClone(initial);for(let i=1;i<=72;i++)segmented=sim.settle(segmented,start+i*HOUR);
for(const key of ['fullness','health','mood','food','ageYearsValue'])assert.ok(Math.abs(continuous[key]-segmented[key])<.001,`${key} differs`);

for(const aging of [false,true])for(const mortality of [false,true])for(const illness of [false,true]){
  const state=sim.defaults(start);Object.assign(state,{aging,mortality,illness,ageYearsValue:2.8,health:70,food:20});
  const next=sim.settle(state,start+HOUR);assert.equal(next.ageYearsValue>2.8,aging);assert.equal(next.alive,!(mortality&&aging));
}

let economy=sim.defaults(start);economy.seeds=20;({state:economy}=sim.buyFood(economy));assert.equal(economy.food,17);assert.equal(economy.seeds,10);
economy.garden.ready=true;({state:economy}=sim.harvest(economy));assert.equal(economy.food,20);assert.equal(economy.seeds,14);
let social=sim.defaults(start);for(let i=0;i<14;i++)({state:social}=sim.interact(social,'npc-0'));assert.equal(sim.relationship(social.npcs[0].relationship),'伴侣');
const family=sim.breed(social,'npc-0');assert.equal(family.ok,true);assert.ok(family.state.offspring.length>=1&&family.state.offspring.length<=3);

let farewell=sim.defaults(start);Object.assign(farewell,{mortality:true,ageYearsValue:3,health:70});farewell=sim.settle(farewell,start+HOUR);assert.equal(farewell.alive,false);farewell=sim.finishFarewell(farewell).state;assert.equal(farewell.memorials.length,1);assert.equal(farewell.pendingFarewell.phase,'buried');const adopted=sim.adopt(farewell,'npc-0');assert.equal(adopted.ok,true);assert.equal(adopted.state.alive,true);

console.log(JSON.stringify({passed:true,dayparts:4,toggleCombinations:8,offlineEquivalenceHours:72,economy:true,family:true,farewell:true},null,2));

