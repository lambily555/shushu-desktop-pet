import assert from 'node:assert/strict';
import * as THREE from 'three';
const context=new Proxy({measureText:t=>({width:t.length*16}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context}),createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(v){}})};
const {createMariahHall}=await import('../src/town-mariah-hall.js');const {createRestaurant,createClinic,createSnackShop,createRemembranceHouse,createSchool}=await import('../src/town-grounds.js');const {createCottage}=await import('../src/town-cottage.js');const {buildingLayouts,installBuildingPortal,placeRoom,localDoor}=await import('../src/town-building-portals.js');const {canWalk}=await import('../src/town-player.js');
const makers={'Mariah Carey名人堂':createMariahHall,'鼠鼠饭馆':createRestaurant,'诊所':createClinic,'零食铺':createSnackShop,'纪念馆':()=>createRemembranceHouse(true),'殡仪馆':()=>createRemembranceHouse(false),'鼠鼠学校':createSchool,'鼠鼠小屋':()=>{const g=new THREE.Group(),c=createCottage({density:.01});c.scale.setScalar(.8);g.add(c);return g}};
for(const [name,make] of Object.entries(makers)){const model=make();if(name==='诊所'){const seats=model.children.filter(o=>o.userData.townAction==='clinic-seat');assert.equal(seats.length,2,'clinic has two interactive outdoor chairs');assert.ok(seats.every(o=>[-1,1].includes(o.userData.seatSide)));assert.equal(model.children.some(o=>o.geometry?.type==='TubeGeometry'),false,'old metal bed rails are removed')}const portal=installBuildingPortal(model,name),room=new THREE.Group();model.updateMatrixWorld(true);placeRoom(room,portal);const gate=localDoor(portal),world=room.localToWorld(new THREE.Vector3(gate.x,0,3));assert.ok(world.distanceTo(new THREE.Vector3(portal.layout.doorX,portal.layout.floor,portal.front))<1e-6,name+' doorway aligns');const ray=new THREE.Raycaster(new THREE.Vector3(portal.layout.doorX,portal.layout.floor+portal.layout.doorHeight*.5,portal.front+.45),new THREE.Vector3(0,0,-1),0,.8);model.updateMatrixWorld(true);const closed=ray.intersectObject(model,true);assert.ok(closed.some(h=>h.object.userData.buildingDoor===name),name+' closed door visible');portal.door.rotation.y=-1.45;model.updateMatrixWorld(true);const open=ray.intersectObject(model,true);assert.equal(open.length,0,name+' open aperture has no solid facade behind door');const actor={inside:name,doorway:{...gate,open:false}};assert.equal(canWalk(actor,gate.x,3.2),false,name+' closed blocks');actor.doorway.open=true;assert.equal(canWalk(actor,gate.x,3.2),true,name+' open passes');assert.equal(canWalk(actor,3.95,3.2),false,name+' wall blocks');if(name==='诊所'){let blocked=false;model.traverse(mesh=>{if(mesh.isMesh&&mesh.geometry.type==='ExtrudeGeometry'&&mesh.geometry.parameters.options?.depth>.2)blocked=true});assert.equal(blocked,false,'clinic raised blue plinth must not obscure the shared room')}if(name==='Mariah Carey名人堂'){assert.equal(buildingLayouts[name].glass,true);assert.ok(portal.shell.children.some(m=>m.material?.transparent&&m.geometry.parameters.height===portal.layout.height));assert.equal(portal.shell.children.filter(m=>m.userData.hallFoundation).length,4,'hall foundation skirt connects the walls to the lower base');assert.ok(portal.shell.children.filter(m=>m.userData.hallFoundation).every(m=>m.position.y+m.geometry.parameters.height/2>=portal.layout.floor),'hall skirt reaches the shell floor');assert.equal(model.children.some(m=>m.geometry?.parameters.width===3.1&&m.geometry?.parameters.height===.22),false,'solid plinth must not cover the room floor')}}
const school=createSchool(),schoolSeats=school.userData.schoolSeats;
assert.equal(schoolSeats.length,4,'school has two stools, a swing and a front bench');
assert.ok(school.children.some(o=>o.userData.townAction==='school-seat'&&o.userData.seatIndex===2),'swing is interactive');
assert.ok(school.children.some(o=>o.userData.townAction==='school-platform'),'raised blocks are marked as platforms');
const schoolPortal=installBuildingPortal(school,'鼠鼠学校');
assert.equal(schoolPortal.roof.geometry.type,'CylinderGeometry','school cutaway roof follows the round building');
assert.equal(school.children.some(o=>o.geometry?.type==='CylinderGeometry'&&o.position.y<.25),false,'old school plinth cannot obscure the room');
console.log('Eight shared shells: aligned doors, school platform and swing, open/closed apertures, collision and full-height hall glass passed');
const cottage=makers['鼠鼠小屋'](),cottagePortal=installBuildingPortal(cottage,'鼠鼠小屋');cottagePortal.door.rotation.y=-1.45;cottage.updateMatrixWorld(true);
for(const x of [-.2,0,.2])for(const y of [.35,.52,.7]){
 const hits=new THREE.Raycaster(new THREE.Vector3(x,y,1.6),new THREE.Vector3(0,0,-1),0,1.7).intersectObject(cottage,true);
 assert.equal(hits.length,0,`cottage deep doorway ${x},${y}: ${hits.map(h=>h.object.name)}`);
 const reverse=new THREE.Raycaster(new THREE.Vector3(x,y,-.1),new THREE.Vector3(0,0,1),0,1.7).intersectObject(cottage,true);
 assert.equal(reverse.length,0,'cottage doorway is clear from inside too');
}
for(const x of [-.7,.7]){
 const hits=new THREE.Raycaster(new THREE.Vector3(x,.65,0),new THREE.Vector3(0,0,1),0,2).intersectObject(cottage,true);
 assert.ok(hits.some(h=>h.object.name==='Cottage inner curved wall'),'interior front wall exists beside the door');
}
assert.equal(cottagePortal.shell.visible,true,'cottage lining remains visible from outdoors');
console.log('Cottage deep doorway, reverse doorway and inner front wall passed');

const {cottageRadius,cottageFloor}=await import('../src/town-cottage-interior.js');
const inner=cottage.getObjectByName('Cottage inner curved wall');
for(let i=0;i<inner.geometry.attributes.position.count;i++){
 const v=new THREE.Vector3().fromBufferAttribute(inner.geometry.attributes.position,i);
 assert.ok(Math.hypot(v.x/1.184,v.z/.912)<=cottageRadius(v.y)+1e-5,'every inner-wall vertex remains beneath the outer curved shell');
}
for(let i=0;i<64;i++){
 const a=i*Math.PI*2/64,eye=new THREE.Vector3(Math.cos(a)*3,.7,Math.sin(a)*3),ray=new THREE.Raycaster(eye,new THREE.Vector3().sub(eye).setY(0).normalize(),0,6);
 const outside=ray.intersectObject(cottage.getObjectByName('Rounded grey cottage'))[0],inside=ray.intersectObject(inner)[0];
 if(outside&&inside)assert.ok(inside.distance>outside.distance,'inner wall never appears in front of the exterior silhouette');
}
for(const [x,z] of [[3,2],[-3,2],[3,-2],[-3,-2]])assert.equal(canWalk({inside:'鼠鼠小屋'},x,z),false,'old square room corners are not walkable');
assert.equal(canWalk({inside:'鼠鼠小屋',doorway:{open:true,x:0,width:2.9}},0,3.2),true,'rounded room retains its open-door route');
console.log('Cottage curved shell containment, 64 outside views and rounded movement boundary passed');
