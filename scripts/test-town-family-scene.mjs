import assert from 'node:assert/strict';
import {createTownLife} from '../src/town-life.js';
const life=createTownLife(),first=life.add('a','跑轮公园',{name:'甲'}),second=life.add('b','诊所',{name:'乙'}),plan=[{parentIds:['a','b']}];
life.setFamilyPlans(plan);const firstPath=first.phase;life.setFamilyPlans(plan);assert.equal(first.phase,firstPath,'refresh does not restart movement');
for(let i=0;i<2400;i++)life.tick(.25);
for(const a of [first,second]){assert.equal(a.inside,'鼠鼠小屋');assert.equal(a.phase,'family-wait');assert.equal(a.action,'迎接幼鼠');assert.match(a.speech,/准备迎接小鼠/)}
assert.ok(Math.hypot(first.position.x-second.position.x,first.position.z-second.position.z)>1,'parents use separate places');
life.setCelebration({key:'holiday',birthdays:[]});assert.equal(first.phase,'family-wait','celebration does not interrupt nursery preparation');
life.setFamilyPlans([]);assert.equal(first.familyPartner,undefined);assert.equal(first.phase,'exit-room');
for(let i=0;i<1600;i++)life.tick(.25);assert.notEqual(first.inside,'鼠鼠小屋','parents resume life after birth');
console.log('Parents travel to cottage, wait separately with hearts, and resume life after birth');
