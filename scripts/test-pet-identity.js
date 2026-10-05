const assert=require('node:assert/strict'),identity=require('../src/pet-identity'),sim=require('../src/town-sim');
const now=Date.now();let state=sim.defaults(now);state.mainName='糯糯';state.mainSex='female';state.mainBirthDate='2026-01-03';
for(const syncTownProfile of [true,false]){assert.equal(identity.home({syncTownProfile},state).name,syncTownProfile?'糯糯':'鼠鼠');assert.equal(identity.town(state).name,'糯糯');const result=sim.recordSceneEvent(state,{id:'main',type:'activity',action:'休息',place:'中心广场'},now);assert.ok(result.state.events.at(-1).text.includes('糯糯'));}
state.mainGeneration=2;state.mainId='pup-1';state.mainSince=now-100;state.events=[{time:now-200,text:'鼠鼠在跑轮公园运动。'},{time:now,text:'糯糯住院休养结束。',mainId:'pup-1'},{time:now,text:'鼠鼠在鼠鼠小屋休息。'},{time:now,text:'上一任鼠鼠休息。',mainId:'main-original'}];state.birthNews=[{time:now,text:'鼠鼠和栗子迎来了幼鼠。',mainId:'pup-1'}];
state=sim.renameMain(state,'豆包');assert.equal(state.events[0].text,'鼠鼠在跑轮公园运动。');assert.equal(state.events[1].text,'豆包住院休养结束。');assert.equal(state.events[2].text,'豆包在鼠鼠小屋休息。');assert.equal(state.events[3].text,'上一任鼠鼠休息。');assert.ok(state.birthNews[0].text.startsWith('豆包和'));assert.deepEqual(sim.migrate(state,now).events,state.events);
assert.equal(identity.reference('鼠鼠医院、鼠鼠学校、鼠鼠小屋、鼠鼠纪念馆、鼠鼠殡仪馆','豆包'),'鼠鼠医院、鼠鼠学校、鼠鼠小屋、鼠鼠纪念馆、鼠鼠殡仪馆');
global.TownSimulation=sim;require('../src/town-interactions');const action=global.TownInteractions.perform(state,'home-tidy',now);assert.ok(action.state.events.at(-1).text.startsWith('豆包'));assert.equal(action.state.events.at(-1).mainId,'pup-1');
console.log('Home preference, independent town records, renaming and predecessor history passed');

assert.equal(identity.reference('鼠鼠宝宝在鼠鼠小屋休息。','鼠鼠宝宝'),'鼠鼠宝宝在鼠鼠小屋休息。');const overlap=sim.renameMain(state,'豆包二');assert.deepEqual(sim.migrate(overlap,now).events,overlap.events);
