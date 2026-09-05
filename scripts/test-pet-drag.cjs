const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
const fn = source.slice(source.indexOf('function clampPetPosition('), source.indexOf('\nfunction stopWandering('));
const clamp = vm.runInNewContext(`(${fn.trim()})`);
let cases = 0;
for (const scale of [.25, .6, 1, 1.65]) {
  const bounds = { width: Math.round(310 * Math.max(1, scale)), height: Math.round(400 * Math.max(1, scale)) };
  const anchor = { x: bounds.width / 2, y: bounds.height - 57 * scale };
  for (const area of [{x:0,y:0,width:1920,height:1080}, {x:-1600,y:-200,width:1600,height:900}]) {
    for (const [px,py] of [[area.x,area.y],[area.x+area.width-1,area.y],[area.x,area.y+area.height-1],[area.x+area.width-1,area.y+area.height-1],[area.x+area.width/2,area.y+area.height/2]]) {
      const wanted={x:px-anchor.x,y:py-anchor.y};
      const actual=clamp(bounds,area,wanted.x,wanted.y,anchor);
      assert.equal(actual.x,wanted.x);assert.equal(actual.y,wanted.y);cases++;
    }
    const outside=clamp(bounds,area,area.x-9999,area.y+9999,anchor);
    assert.equal(outside.x+anchor.x,area.x);
    assert.equal(outside.y+anchor.y,area.y+area.height-1);cases++;
  }
}
const old=clamp({width:310,height:400},{x:0,y:0,width:1920,height:1040},-9999,-9999);
assert.equal(old.x,-5);assert.equal(old.y,-80);
console.log(`PASS: ${cases} full-screen drag/scale/multi-monitor cases; other forms unchanged`);
