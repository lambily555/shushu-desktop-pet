const assert=require('node:assert/strict');
const sim=require('../src/town-sim'),pets=require('../src/town-pets');
const time=Date.now(),DAY=86400000;
const base=()=>Object.assign(sim.defaults(time),{ageYearsValue:.5,aging:false,mortality:false,illness:false,seeds:40,currentActivity:'休息'});
assert.equal(pets.adoptionPrice(base()).cost,5);
let state=base();pets.recordIncome(state,20);assert.equal(pets.adoptionPrice(state).cost,10);
assert.equal(pets.perform(state,'adopt-cat').ok,false,'permanent care consent required');
let result=pets.perform(state,'adopt-cat',{consent:true,time});assert.equal(result.ok,true);state=result.state;assert.equal(state.seeds,30);assert.equal(state.petHome.pets.length,1);
assert.equal(pets.perform(state,'adopt-cat',{consent:true}).ok,false,'cannot double-adopt');
for(const action of ['abandon','sell','return'])assert.equal(pets.perform(state,action).ok,false);
const before=JSON.stringify(state.petHome);assert.equal(pets.perform({...state,seeds:0},'food').ok,false);assert.equal(JSON.stringify(state.petHome),before);
state=pets.perform(state,'food').state;assert.equal(state.petHome.food,5);
state=pets.perform(state,'bed').state;assert.equal(state.petHome.facilities.bed,true);assert.equal(pets.perform(state,'bed').ok,false);
state=pets.perform(state,'toy').state;assert.equal(state.petHome.facilities.toy,true);
let offline=structuredClone(state);pets.settle(offline,offline.calendarTime,offline.calendarTime+3*DAY);assert.equal(offline.petHome.food,2);
let hourly=structuredClone(state);for(let h=0;h<72;h++)pets.settle(hourly,state.calendarTime+h*3600000,state.calendarTime+(h+1)*3600000);assert.equal(hourly.petHome.food,offline.petHome.food);
assert.equal(sim.migrate(state).petHome.pets.length,1,'ownership survives migration');const next=structuredClone(state);next.alive=false;next.offspring.push({id:'future-main',name:'新伙伴',ageYears:.5,alive:true,sex:'female',coat:'silver'});const inherited=sim.adopt(next,'future-main');assert.equal(inherited.ok,true);assert.equal(inherited.state.petHome.pets.length,1,'successor keeps the town pet');
assert.equal(pets.perform({...state,autoSleep:true},'pet').ok,false,'sleep blocks pet interactions');
const visit=pets.perform(base(),'visit').state;assert.equal(pets.perform(visit,'pet').ok,true);assert.equal(pets.perform({...visit,calendarTime:visit.petHome.visitUntil},'pet').ok,false,'day pass expires');
const starvation=structuredClone(state);pets.settle(starvation,state.calendarTime,state.calendarTime+20*DAY);assert.equal(starvation.petHome.food,0);assert.equal(starvation.petHome.pets[0].fullness,0);assert.ok(starvation.notifications.at(-1).text.includes('宠物粮用完'));
console.log('Pet adoption consent, unique ownership, atomic charges, facilities, food settlement, persistence, expiry and sleeping guards passed');

assert.equal(pets.normalize({calendarTime:time,petHome:{pets:[{id:'cat'}]}}).follow,false,'old pets live at home by default');
assert.equal(result.state.petHome.follow,true,'new adoption enables following');
const stopped=pets.perform(result.state,'follow',{time});assert.equal(stopped.ok,true);assert.equal(stopped.state.petHome.follow,false);assert.equal(stopped.state.seeds,result.state.seeds);assert.equal(stopped.state.stamina,result.state.stamina);assert.equal(pets.perform(stopped.state,'follow',{time}).state.petHome.follow,true);assert.equal(pets.perform(base(),'follow',{time}).ok,false);

const pair=pets.perform(pets.perform(base(),'adopt-cat',{consent:true,time}).state,'adopt-dog',{consent:true,time}).state;pair.petHome.food=2;const fed=pets.perform(pair,'feed',{petId:'cat',time});assert.equal(fed.ok,true);assert.equal(fed.state.petHome.food,1);assert.equal(fed.state.petHome.pets[0].fullness,100);assert.equal(fed.state.petHome.pets[1].fullness,80);assert.equal(pets.perform(pair,'feed',{petId:'missing',time}).ok,false);
