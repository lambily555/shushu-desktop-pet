import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
const context=new Proxy({},{get:()=>()=>{}});globalThis.document={createElement:()=>({getContext:()=>context})};
const {createPetHome,petHomeFurniture}=await import('../src/town-pet-home.js');
const {installBuildingPortal,placeRoom,localDoor}=await import('../src/town-building-portals.js');
const {destinations,facing,blocked,entrance}=await import('../src/town-life.js');
const {canWalk}=await import('../src/town-player.js');
const model=createPetHome(),portal=installBuildingPortal(model,'宠物之家'),room=new THREE.Group();placeRoom(room,portal);const gate=localDoor(portal);
const point=room.localToWorld(new THREE.Vector3(gate.x,0,gate.z));assert.ok(point.distanceTo(new THREE.Vector3(portal.layout.doorX,portal.layout.floor,portal.front))<1e-6);
portal.door.rotation.y=-1.45;model.updateMatrixWorld(true);assert.equal(new THREE.Raycaster(new THREE.Vector3(portal.layout.doorX,.7,portal.front+.4),new THREE.Vector3(0,0,-1),0,.8).intersectObject(model,true).length,0,'open doorway has no blocking facade');
const actor={inside:'宠物之家',doorway:{...gate,open:false}};assert.equal(canWalk(actor,gate.x,3.2),false);actor.doorway.open=true;assert.equal(canWalk(actor,gate.x,3.2),true);
assert.equal(canWalk(actor,2.75,.9),false,'counter solid');assert.equal(canWalk(actor,0,-2.4),false,'shelf solid');assert.equal(canWalk(actor,-1.4,1.6),true,'door to activity area clear');
for(const [x,z] of petHomeFurniture.animals)assert.equal(canWalk(actor,x,z),false,'cannot walk into cat/dog');
for(let z=1.4;z<2.9;z+=.1)assert.equal(canWalk(actor,gate.x,z),true,'doorway to pet area has a clear walking lane');
const base=model.children.find(m=>m.geometry?.parameters.width===3.95);assert.ok(base.position.y+base.geometry.parameters.height/2<portal.layout.floor,'foundation top is below interior floor to avoid z fighting');
for(const [x,z,w,d] of [petHomeFurniture.counter,petHomeFurniture.shelf,...petHomeFurniture.beds.map(([x,z])=>[x,z,.6,.6])]){assert.ok(Math.abs(x)+w<4);assert.ok(Math.abs(z)+d<3)}
const home=destinations.find(d=>d[0]==='宠物之家');assert.ok(home[1]>0);assert.equal(facing('宠物之家'),-Math.PI/2);assert.equal(blocked(home[1],home[2]),true);assert.ok(home[1]-1.5>14,'building clears the far end of the central road');
for(const d of destinations){if(['中心广场','墓地'].includes(d[0]))continue;const e=entrance(d[0]),near=Math.abs(e.x)<Math.abs(e.z+1.3)?{x:0,z:e.z}:{x:e.x,z:-1.3};for(let t=0;t<=1;t+=.01){const x=near.x+(e.x-near.x)*t,z=near.z+(e.z-near.z)*t;assert.ok(Math.abs(x-home[1])>1.5+.375||Math.abs(z-home[2])>2+.375,'building clears every branch road')}}for(let x=-1.5;x<=1.5;x+=.25)for(let z=-2;z<=2;z+=.25){assert.equal(blocked(home[1]+x,home[2]+z,'宠物之家'),false,'no neighboring footprint overlaps');assert.ok(Math.hypot(home[1]+x,home[2]+z)<17.4,'building stays within town land')}
for(const kind of fs.readdirSync(new URL('../assets/models/cube-pets/',import.meta.url)).filter(n=>/^animal-.*\.glb$/.test(n)).map(n=>n.slice(7,-4))){const data=fs.readFileSync(new URL('../assets/models/cube-pets/animal-'+kind+'.glb',import.meta.url));assert.equal(data.toString('utf8',0,4),'glTF');const length=data.readUInt32LE(12),json=JSON.parse(data.toString('utf8',20,20+length));assert.ok(json.meshes.length);assert.ok(json.animations.length);assert.ok(!json.buffers.some(b=>b.uri),'geometry is self-contained');for(const image of json.images||[])if(image.uri)assert.ok(fs.existsSync(new URL('../assets/models/cube-pets/'+image.uri,import.meta.url)),'required texture exists')}
console.log('Pet home shared doorway, facade aperture, interior furniture bounds, collisions, placement and animated GLB assets passed');
