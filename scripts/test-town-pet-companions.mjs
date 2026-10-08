import assert from 'node:assert/strict';
import * as THREE from 'three';
import {petRoomPath,petOutsideZ} from '../src/town-pet-companions.js';
import {buildingLayouts,placeRoom,localDoor} from '../src/town-building-portals.js';
import {destinations,facing,blocked} from '../src/town-life.js';
import {canWalk} from '../src/town-player.js';
import {cottagePetFurniture} from '../src/town-pet-layout.js';
import {cottageFloor,cottageFurniture} from '../src/town-cottage-interior.js';
const actor={inside:'鼠鼠小屋',position:{x:0,z:4.05},doorway:{x:0,z:3,width:2.6,open:true},petCompanion:true,petFacilities:{bed:true,toy:true,food:5,hasPets:true}};
for(const slot of ['table','window'])for(const [x,z] of cottagePetFurniture.beds){actor.cottageTableSlot=slot;const path=petRoomPath(actor,{x,z});assert.ok(path.length,'pets can walk from the entrance to their beds with either table layout');for(const point of path)assert.equal(canWalk(actor,point.x,point.z),true);const returning={...actor,position:{x,z}};assert.ok(petRoomPath(returning,{x:0,z:4.1}).length,'pet can return to the open doorway');}
for(const [x,z,w,d] of [...cottagePetFurniture.beds.map(([x,z])=>[x,z,.39,.39]),cottagePetFurniture.grain,cottagePetFurniture.toy,...cottagePetFurniture.bowls.map(([x,z])=>[x,z,.16,.16])])for(const dx of [-w,w])for(const dz of [-d,d])assert.ok((((x+dx)*2.15/8)/cottageFloor.x)**2+(((z+dz)*2.14/6)/cottageFloor.z)**2<1,'pet furniture fits the oval cottage floor');
const player={...actor,petCompanion:false};assert.equal(canWalk(player,...cottagePetFurniture.beds[0]),false);assert.equal(canWalk(player,...cottagePetFurniture.grain),false);assert.equal(canWalk(player,...cottagePetFurniture.toy),false);for(let z=1.3;z<2.8;z+=.1)assert.equal(canWalk(player,0,z),true,'new furniture leaves the main doorway clear');
assert.ok(Math.abs(cottagePetFurniture.beds[0][0]-.38-cottageFurniture.bed[0])>.98,'pet bed is separate from the hamster bed');
for(const [name,layout] of Object.entries(buildingLayouts)){const destination=destinations.find(d=>d[0]===name),model=new THREE.Group();model.position.set(destination[1],0,destination[2]);model.rotation.y=facing(name);const portal={name,layout,model,angle:1.45,front:layout.z+layout.depth/2},room=new THREE.Group();model.updateMatrixWorld(true);placeRoom(room,portal);room.updateMatrixWorld(true);const gate=localDoor(portal),outer=room.localToWorld(new THREE.Vector3(gate.x,0,petOutsideZ(portal)));assert.equal(blocked(outer.x,outer.z),false,name+' has an approach outside the building footprint');for(let z=4.05;z<=petOutsideZ(portal);z+=.05){const point=room.localToWorld(new THREE.Vector3(gate.x,0,z));assert.equal(canWalk({position:point,entryPortal:portal},point.x,point.z),true,name+' has a continuous outdoor door corridor')}}
console.log('Pet paths, alternate table layouts, door corridor, solid facilities and oval-floor containment passed');
