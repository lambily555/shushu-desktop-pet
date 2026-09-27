import assert from 'node:assert/strict';
import {movePlayer,canWalk} from '../src/town-player.js';
const actor={position:{x:0,z:3.9},inside:null};movePlayer(actor,0,-2);assert.ok(actor.position.z>3.5,'Cannot walk through house');actor.position={x:4,z:0};movePlayer(actor,1,0);assert.ok(Math.abs(actor.position.x-5)<1e-8);assert.equal(canWalk(actor,14,0),false);actor.inside='鼠鼠小屋';actor.position={x:0,z:2.6};movePlayer(actor,0,-1);assert.ok(actor.position.z<2);assert.equal(canWalk(actor,-2.2,-1.6),false);console.log('Player movement, map boundary, building and furniture collisions passed');
