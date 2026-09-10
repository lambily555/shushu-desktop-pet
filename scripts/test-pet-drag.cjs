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
const dragSource = source.slice(source.indexOf("ipcMain.on('drag-start'"), source.indexOf("ipcMain.on('drag-end'"));
for (const form of ['real','ai-drama']) {
  for (const viaTimer of [true,false]) {
    const handlers = {};
    let timer, position, pointer = {x:500,y:500};
    const area = {x:0,y:0,width:1920,height:1080};
    const context = {
      settings:{petForm:form}, process:{env:{}},
      ipcMain:{on:(name,fn)=>handlers[name]=fn,handle:(name,fn)=>handlers[name]=fn},
      stopDragging(){},stopWandering(){},clampPetPosition:clamp,
      setInterval(fn){timer=fn;return 1},
      screen:{getCursorScreenPoint:()=>pointer,getDisplayNearestPoint:()=>({bounds:area,workArea:{...area,height:1040}})},
      win:{getPosition:()=>[345,157],getBounds:()=>({width:310,height:400}),isDestroyed:()=>false,setIgnoreMouseEvents(){},setPosition:(x,y)=>position={x,y}}
    };
    vm.runInNewContext(dragSource,context);
    handlers['drag-start']();
    for (const [x,y] of [[0,0],[1919,0],[0,1079],[1919,1079]]) {
      pointer={x,y};
      if(viaTimer)timer();else handlers['drag-move']();
      assert.equal(position.x+155,x,`${form}: horizontal drag`);
      assert.equal(position.y+343,y,`${form}: vertical drag`);
      cases++;
    }
  }
}
console.log(`PASS: ${cases} full-screen drag/scale/multi-monitor cases, including real and ai-drama IPC paths`);
