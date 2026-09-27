import assert from 'node:assert/strict';
import {destinations} from '../src/town-life.js';
import {lampLayout,lampPositionClear} from '../src/town-lights.js';
const lights=lampLayout();assert.deepEqual(lights,lampLayout());for(const l of lights)assert.ok(lampPositionClear(l.x,l.z),'Lamp avoids roads and buildings');for(const d of destinations)assert.equal(lights.filter(l=>l.place===d[0]).length,2,'Two lamps at '+d[0]);const extras=lights.filter(l=>!l.place);assert.equal(extras.length,6);for(const l of extras)assert.ok(lights.every(other=>l===other||Math.hypot(l.x-other.x,l.z-other.z)>=4));console.log('Building side pairs and six spaced open-area lights avoid roads and buildings');
