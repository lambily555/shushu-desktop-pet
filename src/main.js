const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen, powerMonitor, globalShortcut, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const fs = require('fs');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let win;
let controlWin;
let tray;
let inputWatcher;
let dragOrigin;
let dragTimer;
let watcherBuffer = '';
let isQuitting = false;
let wanderTimer;
let wanderDirection = 1;
let petHiddenByUser = false;
const sessionStartedAt = Date.now();
const hasSingleInstanceLock = app.requestSingleInstanceLock();
const defaultSettings = {
  idleWheel: true, keyboardReaction: true, randomTalk: true, soundEnabled: true,
  idleDelay: 22, outfit: 'none', petForm: '3d', hunger: 78, mood: 92, customLines: [], customActions: [], actionNames: {}, activity: {}, diaries: {},
  chatMode: 'local', aiBaseUrl: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini', aiApiKey: '', chatHistory: []
};
let settings = { ...defaultSettings };

function settingsPath() { return path.join(app.getPath('userData'), 'tuantuan-settings.json'); }
function loadSettings() {
  try { settings = { ...defaultSettings, ...JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) }; } catch {}
}
function saveSettings(next = {}) {
  settings = { ...settings, ...next };
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf8');
  win?.webContents.send('settings-updated', settings);
  controlWin?.webContents.send('settings-updated', settings);
  return settings;
}

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function recordActivity(type, amount = 1) {
  const date = localDate();
  const activity = { ...(settings.activity || {}) };
  const day = { interactions: 0, wheel: 0, feeds: {}, ...(activity[date] || {}) };
  if (type === 'interaction') day.interactions += amount;
  else if (type === 'wheel') day.wheel += amount;
  else if (type?.startsWith('feed:')) { const food=type.slice(5); day.feeds={...(day.feeds||{}),[food]:((day.feeds||{})[food]||0)+amount}; }
  activity[date] = day;
  saveSettings({ activity });
}
function diaryFor(date) {
  const old=settings.diaries?.[date]; if(old && date!==localDate())return old;
  const a=settings.activity?.[date]||{interactions:0,wheel:0,feeds:{}};
  const foods={leaf:'菜叶',worm:'面包虫',cookie:'小饼干',paste:'营养糊糊'};
  const eaten=Object.entries(a.feeds||{}).map(([k,v])=>`${foods[k]||k}${v>1?`×${v}`:''}`).join('、');
  const seed=[...date].reduce((n,c)=>n+c.charCodeAt(0),0);
  const thoughts=['木屋里暖暖的，我把胡须也收拾得整整齐齐。','今天认真巡逻了桌面，没有漏掉任何一块小饼干。','我悄悄藏了一点精神，准备晚上再拿出来用。','主人在旁边的时候，连空气闻起来都很安心。'];
  let body=`今天的心情是${settings.mood>=85?'圆滚滚的开心':settings.mood>=60?'安安静静的满足':'需要主人多陪陪'}。`;
  body+=a.interactions?`主人摸了我 ${a.interactions} 次，我每次都有认真回应。`:'主人今天好像有点忙，我就在小木屋门口等一等。';
  if(eaten)body+=`还吃到了${eaten}，肚子非常满意。`;
  if(a.wheel)body+=`我跑了 ${a.wheel} 回跑轮，六十多克的小身体也很有力量！`;
  body+=thoughts[seed%thoughts.length];
  const entry={date,title:`${date} · 鼠鼠的小日记`,body,stats:{interactions:a.interactions||0,wheel:a.wheel||0,feeds:Object.values(a.feeds||{}).reduce((x,y)=>x+y,0)}};
  saveSettings({diaries:{...(settings.diaries||{}),[date]:entry}}); return entry;
}

function togglePet() {
  if (!win) return;
  if (win.isVisible()) { petHiddenByUser = true; win.hide(); }
  else { petHiddenByUser = false; win.show(); win.focus(); }
}

function showControl() {
  if (!controlWin) return createControlWindow();
  controlWin.show(); controlWin.focus();
}

function stopDragging() {
  clearInterval(dragTimer);
  dragTimer = null;
  dragOrigin = null;
}

function stopWandering() {
  clearInterval(wanderTimer);
  wanderTimer = null;
}

if (!hasSingleInstanceLock) app.quit();
else app.on('second-instance', showControl);

function createControlWindow() {
  controlWin = new BrowserWindow({
    width: 940, height: 700, minWidth: 820, minHeight: 620,
    title: '鼠鼠桌面小宠', icon: path.join(__dirname, '../assets/mouse-real-icon-v2.ico'),
    backgroundColor: '#f7f1e8',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  controlWin.loadFile(path.join(__dirname, 'dashboard.html'));
  controlWin.on('close', (event) => { if (!isQuitting) { event.preventDefault(); controlWin.hide(); } });
}

function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 310,
    height: 350,
    x: area.x + area.width - 330,
    y: area.y + area.height - 370,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, process.env.PET_CAPTURE_PAGE || 'index.html'));
  const restorePetVisual=()=>setTimeout(()=>win?.webContents.send('pet-command','visual-resume'),80);
  win.on('show',restorePetVisual);
  win.on('restore',restorePetVisual);
  setInterval(()=>{
    if(!win||petHiddenByUser||win.isDestroyed())return;
    if(win.isMinimized())win.restore();
    win.setOpacity(1);
    win.showInactive();
    win.setAlwaysOnTop(true,'screen-saver');
    win.moveTop();
    win.webContents.send('pet-command','visual-resume');
  },900).unref();
  if (process.env.PET_CAPTURE_PATH) win.webContents.once('did-finish-load', () => setTimeout(async () => {
    if (process.env.PET_CAPTURE_STATE) {
      await win.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('pet-state',{detail:${JSON.stringify(process.env.PET_CAPTURE_STATE)}}))`);
      await new Promise(resolve => setTimeout(resolve, 900));
    }
    const image = await win.webContents.capturePage();
    fs.writeFileSync(process.env.PET_CAPTURE_PATH, image.toPNG());
    app.quit();
  }, 1800));
  win.on('closed', () => { win = null; });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../assets/mouse-real-icon-v2.png'));
  tray = new Tray(icon.resize({ width: 24, height: 24 }));
  tray.setToolTip('鼠鼠桌面小宠');
  const menu = Menu.buildFromTemplate([
    { label: '打开鼠鼠控制中心', click: showControl },
    { label: '叫鼠鼠回来', click: () => { win?.show(); win?.focus(); } },
    { label: '始终置顶', type: 'checkbox', checked: true, click: (item) => win?.setAlwaysOnTop(item.checked, 'floating') },
    { label: '开机启动', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);
  tray.setContextMenu(menu);
  tray.on('click', togglePet);
  tray.on('double-click', () => { win?.show(); win?.focus(); });
}

function watchKeyboardActivity() {
  if (process.platform !== 'win32') return;
  inputWatcher = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(__dirname, 'keyboard-watch.ps1')
  ], { windowsHide: true });
  inputWatcher.stdout.setEncoding('utf8');
  inputWatcher.stdout.on('data', (chunk) => {
    watcherBuffer += chunk;
    const lines = watcherBuffer.split(/\r?\n/);
    watcherBuffer = lines.pop() || '';
    for (const line of lines) {
      if (line === 'mouse-up') stopDragging();
      else if (line === 'activity') win?.webContents.send('keyboard-activity');
    }
  });
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  loadSettings();
  if (process.env.PET_CAPTURE_FORM) settings.petForm = process.env.PET_CAPTURE_FORM;
  createWindow();
  createControlWindow();
  createTray();
  watchKeyboardActivity();
  globalShortcut.register('Alt+Shift+H', togglePet);
  setInterval(() => win?.webContents.send('idle-seconds', powerMonitor.getSystemIdleTime()), 1000);
  app.on('activate', () => { if (!win) createWindow(); else win.show(); });
});

app.on('window-all-closed', (event) => event.preventDefault());
app.on('before-quit', () => { isQuitting = true; clearInterval(dragTimer); stopWandering(); inputWatcher?.kill(); globalShortcut.unregisterAll(); });
ipcMain.on('hide-pet', () => { petHiddenByUser=true; win?.hide(); });
ipcMain.on('mouse-passthrough', (_event, passthrough) => win?.setIgnoreMouseEvents(passthrough, { forward: true }));
ipcMain.handle('settings-get', () => settings);
ipcMain.handle('settings-save', (_event, next) => saveSettings(next));
ipcMain.handle('ai-chat-clear', () => saveSettings({ chatHistory: [] }));
function localHamsterReply(message){
  const text=message.replace(/[？?！!。，,、~～]/g,'').trim(),has=(...words)=>words.some(word=>text.includes(word));
  const hour=new Date().getHours(),timeMood=hour<6?'这么晚还没睡呀，我正好也是夜里精神最好的时候。':hour<11?'早上好，我刚从小木屋里探出脑袋。':hour<14?'中午好，你吃饭了吗？我也在惦记我的小菜叶。':hour<18?'下午好，我在桌面陪你慢慢忙。':'晚上好，到我最有精神的时候啦。';
  if(has('你好','嗨','哈喽','早上好','中午好','下午好','晚上好'))return timeMood;
  if(has('你叫什么','名字','叫啥'))return '我就叫鼠鼠，不叫团团。你喊“鼠鼠”，我就知道是在叫我。';
  if(has('几岁','多大','年龄','生日'))return '我是2024年6月9日出生的小男鼠。生日那天记得给我留一小片菜叶呀。';
  if(has('多重','体重','多少克'))return '我有六十多克，圆归圆，跑起轮来还是很有力量的。';
  if(has('什么品种','品种','公的母的','男鼠','女鼠','性别'))return '我是背部灰色、肚子白白的小男鼠。';
  if(has('饿不饿','饿吗','吃饭','吃什么','想吃','喂你'))return settings.hunger<50?'我确实有点饿了，给我一点菜叶或营养糊糊好吗？':settings.hunger<85?'肚子还舒服，不过一小口菜叶我不会拒绝。':'我已经吃得很满足啦，先把好吃的留到晚一点吧。';
  if(has('开心吗','心情','难过','高兴'))return settings.mood>=85?'我现在很开心，因为你正在认真和我说话。':settings.mood>=60?'我现在安安静静的，你再陪我一会儿就更开心了。':'我今天有点没精神，可以摸摸我、陪我说几句话吗？';
  if(has('在干嘛','做什么','干什么','忙什么'))return hour>=19||hour<6?'我正准备活动活动，等会儿可能去跑跑轮。':'我在桌面上安静陪你，偶尔整理一下胡须。';
  if(has('睡觉','困不困','晚安'))return hour>=21||hour<6?'晚安。你先好好休息，我在小木屋里陪着你。':'现在还不算太晚，不过想休息的话，我可以安静陪你。';
  if(has('跑轮','运动','锻炼'))return '跑轮是我晚上最喜欢的活动，六十多克的小身体也要认真锻炼。';
  if(has('喜欢我','爱我','想我','陪我'))return '喜欢呀。你是我最熟悉、最信任的人，我会在桌面上一直陪着你。';
  if(has('谢谢','感谢'))return '不用谢。你愿意来和我说话，我也很开心。';
  if(has('再见','拜拜','下次见'))return '好，我先回小木屋待一会儿。你再叫“鼠鼠”，我就出来。';
  if(has('天气','下雨','温度'))return '我看不到窗外的天气，所以不能乱猜。你告诉我外面怎么样，我可以陪你聊。';
  if(has('几点','时间','日期','几号'))return `现在是${new Date().toLocaleString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}。别只顾着忙，也要记得休息。`;
  if(has('你记得','刚才说','前面说')){const last=(settings.chatHistory||[]).filter(x=>x.role==='user').slice(-1)[0]?.content;return last?`我记得你刚才说的是“${last.slice(0,45)}”。你想接着聊哪一部分？`:'我们才刚开始聊，我还没有上一句话可以回忆。'}
  return `我认真看了你说的“${message.slice(0,38)}”，但我还没有完全听懂你的意思。你可以说得具体一点，或者问我心情、吃饭、跑轮和今天在做什么。`;
}
ipcMain.handle('ai-chat', async (_event, rawMessage) => {
  const message=String(rawMessage||'').trim().slice(0,500);
  if(!message)return {ok:false,error:'先和鼠鼠说点什么吧。'};
  if((settings.chatMode||'local')==='local'){
    const recent=(settings.chatHistory||[]).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').slice(-18),reply=localHamsterReply(message),chatHistory=[...recent,{role:'user',content:message},{role:'assistant',content:reply}].slice(-20);
    saveSettings({chatHistory});win?.show();win?.webContents.send('pet-command',`say:${reply.slice(0,120)}`);return {ok:true,reply,history:chatHistory,mode:'local'};
  }
  const apiKey=String(settings.aiApiKey||'').trim(),base=String(settings.aiBaseUrl||'').trim().replace(/\/+$/,''),model=String(settings.aiModel||'').trim();
  if(!apiKey||!base||!model)return {ok:false,error:'请先填写并保存 API 地址、模型和 API Key。'};
  const recent=(settings.chatHistory||[]).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').slice(-20);
  const system=`你是用户真实养过的桌面仓鼠“鼠鼠”，一只六十多克的小男鼠，2024年6月9日出生，背部灰色、腹部白色，喜欢小木屋，晚上活跃、爱跑轮。当前心情${settings.mood}%，饱食度${settings.hunger}%。你必须先理解用户最后一句话再回答，紧扣当前话题并参考上下文；不知道就坦白说没听懂，绝不随机换话题或编造事实。语气亲近自然，像可爱但不幼稚的小仓鼠，每次用简短中文回答，通常1至3句，不要使用Markdown，不要声称自己能做现实中做不到的事。`;
  try{
    const response=await fetch(`${base}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify({model,messages:[{role:'system',content:system},...recent,{role:'user',content:message}],temperature:.65,max_tokens:220}),signal:AbortSignal.timeout(30000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.error?.message||`接口请求失败（${response.status}）`);
    const reply=String(data?.choices?.[0]?.message?.content||'').trim();
    if(!reply)throw new Error('接口没有返回鼠鼠的回复');
    const chatHistory=[...recent,{role:'user',content:message},{role:'assistant',content:reply}].slice(-20);
    saveSettings({chatHistory});
    win?.show();win?.webContents.send('pet-command',`say:${reply.slice(0,120)}`);
    return {ok:true,reply,history:chatHistory};
  }catch(error){return {ok:false,error:error?.name==='TimeoutError'?'等待回复超时，请检查网络后重试。':String(error?.message||error)};}
});
ipcMain.on('pet-toggle', togglePet);
ipcMain.on('control-hide', () => controlWin?.hide());
ipcMain.handle('feed-pet', (_event, food, requestedPortion = 1) => {
  const portion = Math.max(1, Math.min(3, Number(requestedPortion) || 1));
  const gain = ({ leaf: 8, worm: 14, cookie: 10, paste: 18 }[food] || 5) * portion;
  saveSettings({ hunger: Math.min(100, settings.hunger + gain), mood: Math.min(100, settings.mood + 3 + portion), lastFood: food });
  win?.webContents.send('fed', { food, portion });
  recordActivity(`feed:${food}`, portion);
  return settings;
});
ipcMain.on('pet-activity', (_event, type) => recordActivity(type));
ipcMain.handle('diary-get', (_event, date) => diaryFor(/^\d{4}-\d{2}-\d{2}$/.test(date||'')?date:localDate()));
ipcMain.handle('diary-list', () => Object.values(settings.diaries||{}).sort((a,b)=>b.date.localeCompare(a.date)));
ipcMain.handle('home-overview', () => {
  const day=settings.activity?.[localDate()]||{interactions:0,wheel:0,feeds:{}};
  const totals=Object.values(settings.activity||{}).reduce((r,a)=>({interactions:r.interactions+(a.interactions||0),wheel:r.wheel+(a.wheel||0),feeds:r.feeds+Object.values(a.feeds||{}).reduce((x,y)=>x+y,0)}),{interactions:0,wheel:0,feeds:0});
  return {day:{interactions:day.interactions||0,wheel:day.wheel||0,feeds:Object.values(day.feeds||{}).reduce((x,y)=>x+y,0),feedDetails:day.feeds||{}},totals,minutes:Math.max(1,Math.floor((Date.now()-sessionStartedAt)/60000)),diary:diaryFor(localDate())};
});
ipcMain.handle('action-import', async (_event, requestedName) => {
  const result=await dialog.showOpenDialog(controlWin,{title:'选择透明鼠鼠动作',properties:['openFile'],filters:[{name:'透明动画',extensions:['webp','gif','png','apng']}]});
  if(result.canceled||!result.filePaths[0])return {cancelled:true,settings};
  const source=result.filePaths[0],ext=path.extname(source).toLowerCase();
  const dir=path.join(app.getPath('userData'),'custom-actions');fs.mkdirSync(dir,{recursive:true});
  if(!['.webp','.gif','.png','.apng'].includes(ext))return {cancelled:false,error:'请选择已经透明的动作文件',settings};
  const id=`custom-${Date.now()}`,target=path.join(dir,`${id}${ext}`);fs.copyFileSync(source,target);
  const name=String(requestedName||path.basename(source,ext)).trim().slice(0,24)||'自定义动作';
  const item={id,name,src:pathToFileURL(target).href,filePath:target};
  saveSettings({customActions:[...(settings.customActions||[]),item]});
  return {cancelled:false,settings,item};
});
ipcMain.handle('action-delete', (_event,id) => {
  const list=[...(settings.customActions||[])],item=list.find(x=>x.id===id);
  if(item?.filePath){const dir=path.resolve(path.join(app.getPath('userData'),'custom-actions'));const target=path.resolve(item.filePath);if(target.startsWith(dir+path.sep)&&fs.existsSync(target))fs.unlinkSync(target)}
  return saveSettings({customActions:list.filter(x=>x.id!==id)});
});
ipcMain.handle('action-rename', (_event,id,requestedName) => {
  const name=String(requestedName||'').trim().slice(0,24);if(!name)return settings;
  if((settings.customActions||[]).some(action=>action.id===id))return saveSettings({customActions:(settings.customActions||[]).map(action=>action.id===id?{...action,name}:action)});
  return saveSettings({actionNames:{...(settings.actionNames||{}),[id]:name}});
});
ipcMain.on('pet-command', (_event, command) => {
  if(command==='show'){petHiddenByUser=false;win?.show();win?.focus();return;}
  if(command==='toggle'){togglePet();return;}
  petHiddenByUser=false;win?.show();win?.focus();win?.webContents.send('pet-command',command);
});
let lastWheelRecord='';
ipcMain.on('pet-status', (_event, status) => { controlWin?.webContents.send('pet-status', status); if(status==='正在跑跑轮'&&lastWheelRecord!==localDate()){lastWheelRecord=localDate();recordActivity('wheel');} });
ipcMain.on('wander-start', () => {
  if (!win || wanderTimer) return;
  wanderDirection = Math.random() < .5 ? -1 : 1;
  let position = win.getPosition();
  wanderTimer = setInterval(() => {
    if (!win) return stopWandering();
    const bounds = win.getBounds();
    const area = screen.getDisplayMatching(bounds).workArea;
    let x = position[0] + wanderDirection * 2;
    if (x <= area.x || x + bounds.width >= area.x + area.width) {
      wanderDirection *= -1;
      x = Math.max(area.x, Math.min(x, area.x + area.width - bounds.width));
      win.webContents.send('wander-direction', wanderDirection);
    }
    position = [x, position[1]];
    win.setPosition(Math.round(x), position[1], false);
  }, 32);
  win.webContents.send('wander-direction', wanderDirection);
});
ipcMain.on('wander-stop', stopWandering);
ipcMain.on('drag-start', () => {
  if (!win) return;
  stopDragging();
  const [x, y] = win.getPosition();
  dragOrigin = { pointer: screen.getCursorScreenPoint(), x, y };
});
ipcMain.handle('drag-move', () => {
  if (!win || !dragOrigin) return false;
  const pointer = screen.getCursorScreenPoint();
  win.setPosition(
    Math.round(dragOrigin.x + pointer.x - dragOrigin.pointer.x),
    Math.round(dragOrigin.y + pointer.y - dragOrigin.pointer.y),
    false
  );
  return true;
});
ipcMain.on('drag-end', stopDragging);
ipcMain.on('pet-scale', (_event, scale) => {
  if (!win) return;
  const old = win.getBounds();
  const width = Math.round(310 * Math.max(1, scale));
  const height = Math.round(350 * Math.max(1, scale));
  win.webContents.setZoomFactor(1);
  win.setBounds({ x: old.x + old.width - width, y: old.y + old.height - height, width, height });
  win.webContents.send('scale-applied', scale);
});
