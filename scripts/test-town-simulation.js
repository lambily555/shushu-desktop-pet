const assert=require('node:assert/strict');
const sim=require('../src/town-sim.js');
const HOUR=3600000,DAY=24*HOUR,start=new Date(2026,8,13,0,0,0).getTime();

assert.equal(sim.daypart(new Date(2026,8,13,5).getTime()),'深夜');
assert.equal(sim.daypart(new Date(2026,8,13,12).getTime()),'白天');
assert.equal(sim.daypart(new Date(2026,8,13,18).getTime()),'傍晚');
assert.equal(sim.daypart(new Date(2026,8,13,22).getTime()),'夜晚');
assert.deepEqual(sim.weather(start),sim.weather(start));
assert.equal(sim.migrate({...sim.defaults(start),version:1,stamina:88},start).stamina,100);
assert.equal(sim.migrate({...sim.defaults(start),version:2,stamina:42},start).stamina,42);
const migrated=sim.migrate({version:2,npcs:sim.defaults(start).npcs.map(({sex,...npc})=>npc),offspring:[{id:'old-pup',name:'旧幼鼠',stage:'幼鼠'}]},start);assert.equal(migrated.version,6);assert.ok(migrated.npcs.every(n=>['male','female'].includes(n.sex)));assert.ok(['male','female'].includes(migrated.offspring[0].sex));assert.deepEqual(migrated.npcBonds[0],[0,1]);
const sexes=new Set(sim.defaults(start).npcs.map(n=>n.sex));assert.deepEqual([...sexes].sort(),['female','male']);

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
let social=sim.defaults(start);social.ageYearsValue=.7;social.lifeStage='成年';social.npcs[0].relationship=75;({state:social}=sim.interact(social,'npc-0',start));assert.equal(sim.relationship(social.npcs[0].relationship),'伴侣');
assert.equal(sim.breedingEligibility(social,'npc-0',start).allowed,true);const sameSex=structuredClone(social);sameSex.npcs[0].sex=sameSex.mainSex;assert.equal(sim.breedingEligibility(sameSex,'npc-0',start).allowed,false);assert.match(sim.breed(sameSex,'npc-0').message,/性别相同/);
const family=sim.breed(social,'npc-0');assert.equal(family.ok,true);assert.ok(family.state.offspring.length>=1&&family.state.offspring.length<=3);
assert.ok(family.state.offspring.every(p=>['male','female'].includes(p.sex)));
const npcFamily=sim.breedNpcPair(sim.defaults(start),'npc-0','npc-1',start);assert.equal(npcFamily.ok,true);assert.ok(npcFamily.state.npcOffspring.length>=1&&npcFamily.state.npcOffspring.length<=2);assert.equal(npcFamily.state.stamina,100);assert.ok(npcFamily.state.npcOffspring.every(p=>p.parents.includes('轮轮')&&p.parents.includes('白大夫')));assert.equal(sim.breedNpcPair(npcFamily.state,'npc-0','npc-1',start).ok,false);

let limited=sim.defaults(start);assert.equal(limited.stamina,100);let socialResult;for(const id of ['npc-0','npc-0','npc-1','npc-1','npc-2','npc-2']){socialResult=sim.interact(limited,id,start);assert.equal(socialResult.ok,true);limited=socialResult.state}socialResult=sim.interact(limited,'npc-3',start);assert.equal(socialResult.ok,false);assert.equal(limited.social.total,6);assert.equal(limited.stamina,28);
let rested=sim.settle(limited,start+12*HOUR);assert.ok(rested.stamina>limited.stamina);const workout=sim.exercise(rested,start+12*HOUR);assert.equal(workout.ok,true);assert.ok(workout.state.stamina<rested.stamina);

let farewell=sim.defaults(start);Object.assign(farewell,{mortality:true,ageYearsValue:3,health:70});farewell=sim.settle(farewell,start+HOUR);assert.equal(farewell.alive,false);farewell=sim.finishFarewell(farewell).state;assert.equal(farewell.memorials.length,1);assert.equal(farewell.pendingFarewell.phase,'buried');const adopted=sim.adopt(farewell,'npc-0');assert.equal(adopted.ok,true);assert.equal(adopted.state.alive,true);
assert.equal(adopted.state.mainSex,adopted.state.npcs[0].sex);

console.log(JSON.stringify({passed:true,dayparts:4,toggleCombinations:8,offlineEquivalenceHours:72,economy:true,family:true,npcFamily:true,sexes:true,breedingEligibility:true,farewell:true,stamina:true,dailySocialLimit:6,perNpcSocialLimit:2},null,2));

// Water follows real time, including offline periods, with safe migration.
const oldSave=sim.defaults(start);delete oldSave.water;delete oldSave.waterChangedAt;oldSave.version=4;
const upgraded=sim.settle(oldSave,start+7*DAY);assert.equal(upgraded.water,100);
let water=sim.defaults(start);water.food=100;
const dayWater=sim.settle(water,start+DAY);assert.ok(Math.abs(dayWater.water-200/3)<.001);assert.equal(sim.waterStatus(dayWater,start+DAY).quality,'待换水');
const stale=sim.settle(water,start+2*DAY);assert.equal(sim.waterStatus(stale,start+2*DAY).quality,'变质');
assert.equal(sim.settle(water,start+4*DAY).water,0);
const fresh=sim.refillWater(stale,start+2*DAY).state;assert.equal(fresh.water,100);assert.equal(sim.waterStatus(fresh,start+2*DAY).quality,'新鲜');
assert.ok(sim.settle(fresh,start+3*DAY).health>sim.settle(stale,start+3*DAY).health);
assert.ok(Math.abs(continuous.water-segmented.water)<.001);
for(const id of ['npc-0','npc-1'])assert.equal(sim.childrenOf(npcFamily.state,id).length,npcFamily.state.npcOffspring.length);
const successor=structuredClone(npcFamily.state);successor.npcs[0].id='npc-0-g2';assert.equal(sim.childrenOf(successor,'npc-0-g2').length,0);
assert.ok(sim.growthScale(0)<sim.growthScale(.18));assert.ok(sim.growthScale(.18)<sim.growthScale(.65));assert.equal(sim.growthScale(2),1);
console.log('Water migration, offline consumption, freshness, parent identity and growth passed');
let scene=sim.defaults(start);scene.food=0;
let purchase=sim.recordSceneEvent(scene,{id:'main',type:'activity',action:'购买粮食',place:'零食铺'},start);
assert.ok(purchase.state.food>0);assert.ok(purchase.state.seeds<scene.seeds);
assert.equal(sim.recordSceneEvent(purchase.state,{id:'main',type:'activity',action:'购买粮食',place:'零食铺'},start+1000).ok,false);
let friends=sim.recordSceneEvent(scene,{id:'npc-0',otherId:'npc-1',type:'social'},start);
assert.equal(friends.state.npcs[0].friendships['npc-1'],3);
for(let i=1;i<6;i++)friends=sim.recordSceneEvent(friends.state,{id:'npc-0',otherId:'npc-1',type:'social'},start+i);
assert.equal(sim.recordSceneEvent(friends.state,{id:'npc-0',otherId:'npc-1',type:'social'},start+7).ok,false);
const chat=sim.recordSceneEvent(scene,{id:'main',otherId:'npc-1',type:'social'},start);
assert.equal(chat.state.stamina,scene.stamina-12);assert.equal(chat.state.social.total,1);
console.log('Scene resource effects, cooldowns, friendships and social limits passed');


for(const speed of [1,4,12,48]){const rate=sim.calendarRate(speed),base=sim.defaults(start);base.speed=speed;base.stamina=0;base.mortality=false;assert.ok(Math.abs(sim.settle(base,start+5*HOUR/rate).stamina-50)<.001);assert.equal(sim.settle(base,start+10*HOUR/rate).stamina,100);const offline=sim.settle(base,start+10*HOUR/rate);let stepped=base;for(let i=1;i<=10;i++)stepped=sim.settle(stepped,start+i*HOUR/rate);assert.ok(Math.abs(offline.stamina-stepped.stamina)<.001)}console.log('All four speeds restore 50 stamina in 5 town hours and 100 in 10; offline matches stepwise settlement');
