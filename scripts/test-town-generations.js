const assert=require('node:assert/strict'),sim=require('../src/town-sim.js');
const now=Date.now();let state=sim.defaults(now);state.lifeStage='成年';state.ageYearsValue=1;state.mainSex='female';
state.offspring.push({id:'child-2',name:'二代',generation:2,ageYears:.1,stage:'幼鼠',birthDate:'2026-10-04',mainParentId:state.mainId,parentId:'npc-0',sex:'male'});
state.npcOffspring.push({id:'child-5',name:'五代',generation:5,ageYears:1,stage:'成年',health:95,relationship:80,birthDate:'2025-10-04',sex:'male'});
state.npcs.push({id:'legacy',name:'旧居民',birthDate:'2025-10-04',sex:'male'});
state=sim.migrate(state);assert.equal(sim.resident(state,'child-2').relationship,5);
for(const id of ['child-2','child-5','legacy']){const result=sim.interact(state,id,now);assert.equal(result.ok,true,id);assert.equal(sim.resident(result.state,id).relationship,(sim.resident(state,id).relationship??5)+5);state=result.state;}
assert.equal(sim.interact(state,'child-2',now).ok,true);let limited=sim.interact(state,'child-2',now).state;assert.equal(sim.interact(limited,'child-2',now).ok,false);
state.stamina=100;state.offspring[0].stage='少年';assert.equal(sim.breedingEligibility(state,'child-2').allowed,false);assert.equal(sim.breedingEligibility(state,'child-5').allowed,true);const born=sim.breed(state,'child-5');assert.equal(born.ok,true);assert.equal(born.state.offspring.at(-1).generation,6);
state.calendarTime=Date.UTC(2026,9,4);for(const id of ['child-2','child-5','legacy']){assert.ok(sim.townCalendar(state).birthdays.some(n=>n.id===id));assert.ok(sim.townCalendar(state).event.birthdays.includes(id));assert.ok(sim.calendarMonth(state,'2026-10').find(d=>d.date==='2026-10-04').items.some(n=>n.type==='birthday'&&n.id===id));}
for(const id of ['child-2','child-5','legacy'])sim.resident(state,id).alive=false;
for(const id of ['child-2','child-5','legacy']){assert.ok(!sim.townCalendar(state).birthdays.some(n=>n.id===id));assert.equal(sim.interact(state,id,now).ok,false);assert.equal(sim.breedingEligibility(state,id).allowed,false);}
console.log('All-generation chat, persisted relationships, limits, adult breeding, generation, living birthdays and automatic removal passed');
const aged=sim.defaults(now);aged.calendarTime=Date.UTC(2026,9,4);aged.npcOffspring=[{id:'old-7',name:'七代老鼠',generation:7,sex:'female',ageYears:3.3,stage:'长寿',birthDate:'2023-10-04',alive:true}];assert.ok(sim.townCalendar(aged).birthdays.some(n=>n.id==='old-7'));const deceased=sim.settle(aged,now+3600000);assert.equal(deceased.npcOffspring[0].alive,false);assert.ok(!sim.townCalendar(deceased).birthdays.some(n=>n.id==='old-7'));assert.ok(sim.townCalendar(deceased).anniversaries.some(n=>n.id==='old-7'));console.log('Automatic higher-generation death removes birthday and records anniversary');
