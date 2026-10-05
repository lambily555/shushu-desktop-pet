const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../src/main.js'),'utf8');
const handler=source.slice(source.indexOf("ipcMain.on('pet-status'"),source.indexOf("ipcMain.on('wander-start'"));
function run(controlWin,status='休息'){let callback,records=0,sends=0;const context={controlWin,lastWheelRecord:'',localDate:()=> '2026-10-05',recordActivity:()=>records++,ipcMain:{on:(_,fn)=>callback=fn}};vm.runInNewContext(handler,context);callback({},status);return records;}
const destroyed={isDestroyed:()=>true,get webContents(){throw new Error('Object has been destroyed')}};
assert.doesNotThrow(()=>run(destroyed));
assert.doesNotThrow(()=>run(null));
assert.doesNotThrow(()=>run({isDestroyed:()=>false,webContents:{isDestroyed:()=>true,send(){throw new Error('Destroyed contents')}}}));
let sent;assert.equal(run({isDestroyed:()=>false,webContents:{isDestroyed:()=>false,send:(channel,status)=>sent=[channel,status]}},'正在跑跑轮'),1);assert.deepEqual(sent,['pet-status','正在跑跑轮']);assert.equal(run(destroyed,'正在跑跑轮'),1);
console.log('Destroyed window/content status forwarding and wheel recording passed');
