const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen, powerMonitor, globalShortcut, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const fs = require('fs');
if (process.env.DASHBOARD_PANELS_CAPTURE_DIR || process.env.DASHBOARD_TEST_REPORT) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}
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
let dragActive = false;
let watcherBuffer = '';
let isQuitting = false;
let wanderTimer;
let wanderDirection = 1;
let petHiddenByUser = false;
const sessionStartedAt = Date.now();
const isDashboardQa = Boolean(process.env.DASHBOARD_PANELS_CAPTURE_DIR || process.env.DASHBOARD_TEST_REPORT);
const hasSingleInstanceLock = isDashboardQa ? true : app.requestSingleInstanceLock();
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
  dragActive = false;
}

function clampPetPosition(bounds, area, wantedX, wantedY) {
  const keepVisible = 54;
  return {
    x: Math.max(area.x - bounds.width + keepVisible, Math.min(wantedX, area.x + area.width - keepVisible)),
    y: Math.max(area.y - bounds.height + keepVisible, Math.min(wantedY, area.y + area.height - keepVisible))
  };
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
  if (process.env.PET_POSITION_TEST_PATH) {
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      const area = screen.getPrimaryDisplay().workArea;
      const bounds = win.getBounds();
      const targets = [
        { name: 'top-left', x: area.x, y: area.y },
        { name: 'top-center', x: area.x + Math.round((area.width - bounds.width) / 2), y: area.y },
        { name: 'top-right', x: area.x + area.width - bounds.width, y: area.y },
        { name: 'bottom-center', x: area.x + Math.round((area.width - bounds.width) / 2), y: area.y + area.height - bounds.height }
      ];
      const results = [];
      for (const target of targets) {
        win.setPosition(target.x, target.y, false);
        await new Promise(resolve => setTimeout(resolve, 120));
        const [actualX, actualY] = win.getPosition();
        results.push({ ...target, actualX, actualY, passed: actualX === target.x && actualY === target.y });
      }
      const clampChecks = [
        { name: 'above-top', wantedX: area.x, wantedY: area.y - bounds.height },
        { name: 'past-left', wantedX: area.x - bounds.width, wantedY: area.y },
        { name: 'past-right', wantedX: area.x + area.width, wantedY: area.y },
        { name: 'past-bottom', wantedX: area.x, wantedY: area.y + area.height }
      ].map(test => ({ ...test, result: clampPetPosition(bounds, area, test.wantedX, test.wantedY) }));
      const holdTarget = targets[1];
      win.setPosition(holdTarget.x, Math.round(area.y + area.height / 3), false);
      await new Promise(resolve => setTimeout(resolve, 120));
      const holdBefore = win.getPosition();
      await win.webContents.executeJavaScript('window.petAPI.dragStart()');
      await new Promise(resolve => setTimeout(resolve, 1500));
      const holdAfter = win.getPosition();
      await win.webContents.executeJavaScript('window.petAPI.dragEnd()');
      const stationaryHold = { before: holdBefore, after: holdAfter, durationMs: 1500, passed: holdBefore[0] === holdAfter[0] && holdBefore[1] === holdAfter[1] };
      fs.writeFileSync(process.env.PET_POSITION_TEST_PATH, JSON.stringify({ area, bounds, results, clampChecks, stationaryHold }, null, 2));
      isQuitting = true; app.quit();
    }, 500));
    return;
  }
  createControlWindow();
  if (process.env.DASHBOARD_CAPTURE_PATH) {
    win.hide();
    controlWin.webContents.once('did-finish-load', () => setTimeout(async () => {
      controlWin.setBounds({ x: 20, y: 20, width: Math.max(680,Number(process.env.DASHBOARD_CAPTURE_WIDTH)||1200), height: Math.max(560,Number(process.env.DASHBOARD_CAPTURE_HEIGHT)||720) });
      await new Promise(resolve => setTimeout(resolve, 700));
      if (process.env.DASHBOARD_CAPTURE_LANGUAGE) {
        await controlWin.webContents.executeJavaScript(`(()=>{const language=document.querySelector('#interfaceLanguage');language.value=${JSON.stringify(process.env.DASHBOARD_CAPTURE_LANGUAGE)};language.dispatchEvent(new Event('change',{bubbles:true}))})()`);
        await new Promise(resolve => setTimeout(resolve, 260));
      }
      const image = await controlWin.webContents.capturePage();
      fs.writeFileSync(process.env.DASHBOARD_CAPTURE_PATH, image.toPNG());
      if (process.env.DASHBOARD_PROFILE_CAPTURE_PATH) {
        await controlWin.webContents.executeJavaScript(`document.querySelector('#homeBrand').click()`);
        await new Promise(resolve => setTimeout(resolve, 180));
        const profileImage = await controlWin.webContents.capturePage();
        fs.writeFileSync(process.env.DASHBOARD_PROFILE_CAPTURE_PATH, profileImage.toPNG());
        await controlWin.webContents.executeJavaScript(`document.querySelector('#backHome').click()`);
      }
      if (process.env.DASHBOARD_EFFECT_CAPTURE_PATH) {
        await controlWin.webContents.executeJavaScript(`(()=>{document.dispatchEvent(new PointerEvent('pointermove',{clientX:360,clientY:280,pointerType:'mouse'}));document.dispatchEvent(new PointerEvent('pointermove',{clientX:405,clientY:305,pointerType:'mouse'}));document.dispatchEvent(new PointerEvent('pointermove',{clientX:450,clientY:330,pointerType:'mouse'}));document.dispatchEvent(new PointerEvent('pointerdown',{clientX:480,clientY:350,pointerType:'mouse',button:0}))})()`);
        await new Promise(resolve => setTimeout(resolve, 140));
        const effectImage = await controlWin.webContents.capturePage();
        fs.writeFileSync(process.env.DASHBOARD_EFFECT_CAPTURE_PATH, effectImage.toPNG());
      }
      if (process.env.DASHBOARD_MAP_CAPTURE_PATH) {
        controlWin.webContents.sendInputEvent({type:'mouseMove',x:600,y:360});
        await new Promise(resolve => setTimeout(resolve, 620));
        const mapImage = await controlWin.webContents.capturePage();
        fs.writeFileSync(process.env.DASHBOARD_MAP_CAPTURE_PATH, mapImage.toPNG());
        controlWin.webContents.sendInputEvent({type:'mouseMove',x:20,y:20});
        await new Promise(resolve => setTimeout(resolve, 260));
      }
      if (process.env.DASHBOARD_SETTINGS_CAPTURE_PATH) {
        await controlWin.webContents.executeJavaScript(`document.querySelector('#effectSettingsButton').click()`);
        await new Promise(resolve => setTimeout(resolve, 360));
        const settingsImage = await controlWin.webContents.capturePage();
        fs.writeFileSync(process.env.DASHBOARD_SETTINGS_CAPTURE_PATH, settingsImage.toPNG());
        await controlWin.webContents.executeJavaScript(`document.body.click()`);
      }
      if (process.env.DASHBOARD_PANELS_CAPTURE_DIR) {
        for (const panel of ['chat','dialogue','actions','behavior','feed','diary']) {
          await controlWin.webContents.executeJavaScript(`document.querySelector('[data-feature-panel="${panel}"]').click()`);
          await new Promise(resolve => setTimeout(resolve, 180));
          const panelImage = await controlWin.webContents.capturePage();
          fs.writeFileSync(path.join(process.env.DASHBOARD_PANELS_CAPTURE_DIR, `${panel}.png`), panelImage.toPNG());
          await controlWin.webContents.executeJavaScript(`document.querySelector('#backHome').click()`);
        }
      }
      if (process.env.DASHBOARD_SCROLL_CAPTURE_PATH) {
        await controlWin.webContents.executeJavaScript(`document.querySelector('[data-feature-panel="chat"]').click();document.querySelector('main').scrollTop=420`);
        await new Promise(resolve => setTimeout(resolve, 180));
        const scrollImage = await controlWin.webContents.capturePage();
        fs.writeFileSync(process.env.DASHBOARD_SCROLL_CAPTURE_PATH, scrollImage.toPNG());
        await controlWin.webContents.executeJavaScript(`document.querySelector('#backHome').click()`);
      }
      if (process.env.DASHBOARD_TEST_REPORT) {
        const report = await controlWin.webContents.executeJavaScript(`(async()=>{
          const panels=['chat','dialogue','actions','behavior','feed','diary'];
          const results=[];
          for(const panel of panels){
            document.querySelector('[data-feature-panel="'+panel+'"]').click();
            await new Promise(resolve=>setTimeout(resolve,60));
            const activeNodes=[...document.querySelectorAll('.panel-section.active')];
            const active=activeNodes.map(node=>node.dataset.section);
            const homeHidden=getComputedStyle(document.querySelector('.feature-hamster')).display==='none';
            const detailVisible=activeNodes.length>0&&activeNodes.every(node=>getComputedStyle(node).display!=='none');
            results.push({panel,active,homeHidden,detailVisible,passed:active.length>0&&active.every(value=>value===panel)&&document.body.dataset.currentPanel===panel&&document.querySelector('#backHome').classList.contains('show')&&homeHidden&&detailVisible});
            document.querySelector('#backHome').click();
          }
          const returnedHome=document.body.dataset.currentPanel==='home'&&document.querySelector('.feature-hamster').classList.contains('active');
          document.querySelector('#homeBrand').click();
          await new Promise(resolve=>setTimeout(resolve,180));
          const profileOpened=document.body.dataset.currentPanel==='profile'&&document.querySelector('#mouseProfilePopover').classList.contains('active');
          const profilePushesContent=document.querySelector('main>header').getBoundingClientRect().height<=70;
          document.querySelector('#backHome').click();
          await new Promise(resolve=>setTimeout(resolve,180));
          const profileClosed=document.body.dataset.currentPanel==='home'&&!document.querySelector('#mouseProfilePopover').classList.contains('active');
          document.querySelector('#effectSettingsButton').click();
          await new Promise(resolve=>setTimeout(resolve,120));
          const settingsPageOpened=document.body.dataset.currentPanel==='settings'&&document.querySelector('#effectSettings').classList.contains('active')&&getComputedStyle(document.querySelector('#effectSettings')).display!=='none';
          document.querySelector('#backHome').click();
          const effectControls={pawToggle:!!document.querySelector('#pawTrailEnabled'),upload:!!document.querySelector('#clickEffectFile'),restore:!!document.querySelector('#restoreClickEffect')};
          const labelsInitiallyClear=[...document.querySelectorAll('.photo-map .hamster-tile b')].every(node=>Number.parseFloat(getComputedStyle(node).opacity)===0);
          const pawToggle=document.querySelector('#pawTrailEnabled'),pawOriginal=pawToggle.checked;pawToggle.checked=false;pawToggle.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));document.querySelectorAll('.paw-trail').forEach(node=>node.remove());document.dispatchEvent(new PointerEvent('pointermove',{clientX:610,clientY:610,pointerType:'mouse'}));await new Promise(resolve=>setTimeout(resolve,80));const pawDisabledStopsTrail=document.querySelectorAll('.paw-trail').length===0;pawToggle.checked=pawOriginal;pawToggle.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));
          const movingBlob=document.querySelector('.background-motion-layer i'),backgroundTransformA=getComputedStyle(movingBlob).transform;await new Promise(resolve=>setTimeout(resolve,420));const backgroundTransformB=getComputedStyle(movingBlob).transform,backgroundActuallyMoves=backgroundTransformA!==backgroundTransformB;
          const clickToggle=document.querySelector('#clickEffectEnabled'),clickOriginal=clickToggle.checked;clickToggle.checked=false;clickToggle.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));document.querySelectorAll('.click-hamster-burst').forEach(node=>node.remove());document.dispatchEvent(new PointerEvent('pointerdown',{clientX:640,clientY:620,pointerType:'mouse',button:0}));await new Promise(resolve=>setTimeout(resolve,50));const clickDisabledStopsEffect=document.querySelectorAll('.click-hamster-burst').length===0;clickToggle.checked=clickOriginal;clickToggle.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));
          const language=document.querySelector('#interfaceLanguage'),languageOriginal=language.value;language.value='en';language.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));const englishApplied=document.querySelector('#effectSettingsButton').textContent==='Settings'&&document.documentElement.lang==='en'&&document.querySelector('#homeBrand b').textContent==='Hamster'&&document.querySelector('.photo-map .hamster-tile b').textContent.includes('Hamster');language.value='es';language.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));const spanishApplied=document.querySelector('#effectSettingsButton').textContent==='Ajustes'&&document.documentElement.lang==='es'&&document.querySelector('#homeBrand b').textContent==='Hámster'&&document.querySelector('.photo-map .hamster-tile b').textContent.includes('Hámster');language.value=languageOriginal;language.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));
          document.dispatchEvent(new PointerEvent('pointermove',{clientX:180,clientY:180,pointerType:'mouse'}));
          document.dispatchEvent(new PointerEvent('pointermove',{clientX:230,clientY:210,pointerType:'mouse'}));
          document.dispatchEvent(new PointerEvent('pointerdown',{clientX:260,clientY:235,pointerType:'mouse',button:0}));
          await new Promise(resolve=>setTimeout(resolve,40));
          const visualEffects={background:!!document.querySelector('.background-motion-layer'),pawTrail:!!document.querySelector('.paw-trail'),clickBurst:!!document.querySelector('.click-hamster-burst')};
          await new Promise(resolve=>setTimeout(resolve,1500));
          visualEffects.remaining={paws:document.querySelectorAll('.paw-trail').length,bursts:document.querySelectorAll('.click-hamster-burst').length};
          visualEffects.cleaned=visualEffects.remaining.paws===0&&visualEffects.remaining.bursts===0;
          return {results,returnedHome,profileOpened,profilePushesContent,profileClosed,settingsPageOpened,effectControls,pawDisabledStopsTrail,clickDisabledStopsEffect,englishApplied,spanishApplied,labelsInitiallyClear,backgroundActuallyMoves,visualEffects};
        })()`);
        fs.writeFileSync(process.env.DASHBOARD_TEST_REPORT, JSON.stringify(report, null, 2));
      }
      isQuitting = true; app.quit();
    }, 900));
    return;
  }
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
  const text=message.toLocaleLowerCase().replace(/[¿?¡!。，,、~～.]/g,'').trim(),has=(...words)=>words.some(word=>text.includes(word));
  const spanishInput=/[áéíóúñ¿¡]|\b(hola|gracias|adiós|buenos|buenas|cómo|qué|cuándo|comida|hambre|rueda|cumpleaños)\b/i.test(message);
  const englishInput=/\b(hi|hello|hey|thanks|thank you|goodbye|good morning|good afternoon|good evening|how|what|when|where|food|hungry|wheel|birthday)\b/i.test(message);
  const lang=spanishInput?'es':englishInput?'en':(settings.interfaceLanguage||'zh');
  const hour=new Date().getHours(),timeMood=hour<6?'这么晚还没睡呀，我正好也是夜里精神最好的时候。':hour<11?'早上好，我刚从小木屋里探出脑袋。':hour<14?'中午好，你吃饭了吗？我也在惦记我的小菜叶。':hour<18?'下午好，我在桌面陪你慢慢忙。':'晚上好，到我最有精神的时候啦。';
  if(lang==='en'){
    const greeting=hour<6?'Still awake? I am naturally most active at night.':hour<11?'Good morning! I just peeked out of my little wooden house.':hour<14?'Good afternoon! Have you eaten? I am thinking about my leafy greens.':hour<18?'Good afternoon! I will stay here while you work.':'Good evening! This is when I have the most energy.';
    if(text==='hi'||has('hello','hey','good morning','good afternoon','good evening'))return greeting;
    if(has('your name','what are you called','who are you'))return 'My name is Hamster. When you call “Hamster,” I know you are talking to me.';
    if(has('how old','age','birthday','when were you born'))return 'I am a little male hamster born on June 9, 2024. Please save me a tiny leafy treat on my birthday.';
    if(has('weight','how heavy','grams'))return 'I weigh a little over 60 grams. I may be round, but I can still run strongly on my wheel.';
    if(has('breed','species','male','female','gender','sex'))return 'I am a little male hamster with a gray back and a white belly.';
    if(has('hungry','food','eat','feed','snack'))return settings.hunger<50?'I am a little hungry. Could I have some leafy greens or nutrition paste?':settings.hunger<85?'My belly feels fine, but I would not refuse one small bite of greens.':'I am already very full. Let us save the treats for later.';
    if(has('happy','mood','sad','how are you','feeling'))return settings.mood>=85?'I am very happy because you are talking with me.':settings.mood>=60?'I feel calm and comfortable. Staying with you a little longer would make me happier.':'I feel a little low today. Could you pet me and talk with me for a while?';
    if(has('what are you doing','doing now','busy'))return hour>=19||hour<6?'I am getting ready to move around. I may run on my wheel soon.':'I am quietly keeping you company and tidying my whiskers.';
    if(has('sleep','sleepy','good night'))return hour>=21||hour<6?'Good night. Rest well; I will stay in my little house nearby.':'It is not very late yet, but I can stay quiet if you want to rest.';
    if(has('wheel','exercise','work out','running'))return 'Running on my wheel is my favorite nighttime activity. Even a 60-gram hamster needs exercise.';
    if(has('love me','like me','miss me','stay with me'))return 'Of course. You are the person I know and trust most, and I will keep you company on the desktop.';
    if(has('thank','thanks'))return 'You are welcome. I am happy whenever you come to talk with me.';
    if(has('bye','goodbye','see you'))return 'Okay, I will rest in my little wooden house. Call “Hamster” whenever you want me back.';
    if(has('weather','rain','temperature'))return 'I cannot see the weather outside, so I should not guess. Tell me what it is like and we can talk about it.';
    if(has('time','date','day is it'))return `It is ${new Date().toLocaleString('en-US',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}. Remember to take a break too.`;
    return `I read “${message.slice(0,38)}” carefully, but I do not fully understand yet. You can ask about my mood, food, running wheel, birthday, or what I am doing.`;
  }
  if(lang==='es'){
    const greeting=hour<6?'¿Sigues despierto? Por la noche es cuando tengo más energía.':hour<11?'¡Buenos días! Acabo de asomarme desde mi casita.':hour<14?'¡Buenas tardes! ¿Ya comiste? Yo estoy pensando en mis hojas verdes.':hour<18?'¡Buenas tardes! Me quedaré aquí mientras trabajas.':'¡Buenas noches! Ahora es cuando tengo más energía.';
    if(has('hola','buenos días','buenas tardes','buenas noches','qué tal'))return greeting;
    if(has('tu nombre','cómo te llamas','quién eres'))return 'Me llamo Hámster. Cuando dices “Hámster”, sé que estás hablando conmigo.';
    if(has('cuántos años','edad','cumpleaños','cuándo naciste'))return 'Soy un pequeño hámster macho nacido el 9 de junio de 2024. En mi cumpleaños, guárdame una hojita.';
    if(has('peso','cuánto pesas','gramos'))return 'Peso un poco más de 60 gramos. Soy redondito, pero corro con mucha fuerza en mi rueda.';
    if(has('raza','especie','macho','hembra','género','sexo'))return 'Soy un pequeño hámster macho, con la espalda gris y la barriga blanca.';
    if(has('hambre','comida','comer','darte de comer','aperitivo'))return settings.hunger<50?'Tengo un poco de hambre. ¿Me das hojas verdes o pasta nutritiva?':settings.hunger<85?'Mi barriga está bien, pero no rechazaría un pequeño bocado.':'Ya estoy muy lleno. Guardemos la comida para después.';
    if(has('feliz','ánimo','triste','cómo estás','te sientes'))return settings.mood>=85?'Estoy muy feliz porque estás hablando conmigo.':settings.mood>=60?'Estoy tranquilo y cómodo. Si te quedas un poco más, estaré aún más feliz.':'Hoy tengo poca energía. ¿Puedes acariciarme y hablar conmigo?';
    if(has('qué haces','haciendo','ocupado'))return hour>=19||hour<6?'Estoy preparándome para moverme; quizá corra pronto en mi rueda.':'Estoy acompañándote tranquilamente y arreglando mis bigotes.';
    if(has('dormir','sueño','buenas noches'))return hour>=21||hour<6?'Buenas noches. Descansa; yo estaré cerca en mi casita.':'Todavía no es muy tarde, pero puedo quedarme tranquilo si quieres descansar.';
    if(has('rueda','ejercicio','correr','entrenar'))return 'Correr en mi rueda es mi actividad nocturna favorita. Incluso un hámster de 60 gramos necesita ejercicio.';
    if(has('me quieres','te gusto','me extrañas','acompáñame'))return 'Claro. Eres la persona que más conozco y en quien más confío; te acompañaré en el escritorio.';
    if(has('gracias'))return 'De nada. Me alegra mucho que vengas a hablar conmigo.';
    if(has('adiós','hasta luego','nos vemos'))return 'De acuerdo, descansaré en mi casita. Llámame “Hámster” cuando quieras que vuelva.';
    if(has('tiempo','clima','lluvia','temperatura'))return 'No puedo ver el clima exterior y no quiero inventarlo. Cuéntame cómo está y hablamos de ello.';
    if(has('qué hora','fecha','qué día'))return `Ahora es ${new Date().toLocaleString('es-ES',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}. Recuerda descansar también.`;
    return `He leído con atención “${message.slice(0,38)}”, pero todavía no lo entiendo del todo. Puedes preguntarme por mi ánimo, comida, rueda, cumpleaños o qué estoy haciendo.`;
  }
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
  if (!win || wanderTimer || dragActive) return;
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
  stopWandering();
  const [x, y] = win.getPosition();
  const pointer = screen.getCursorScreenPoint();
  dragActive = true;
  dragOrigin = { pointer, lastPointer: pointer, x, y };
  dragTimer = setInterval(() => {
    if (!win || !dragOrigin || win.isDestroyed()) return stopDragging();
    const pointer = process.env.PET_TEST_FIXED_POINTER ? dragOrigin.pointer : screen.getCursorScreenPoint();
    if (pointer.x === dragOrigin.lastPointer.x && pointer.y === dragOrigin.lastPointer.y) return;
    dragOrigin.lastPointer = pointer;
    const deltaX = pointer.x - dragOrigin.pointer.x;
    const deltaY = pointer.y - dragOrigin.pointer.y;
    if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) return;
    const bounds = win.getBounds();
    const display = screen.getDisplayNearestPoint(pointer);
    const area = display.workArea;
    const wantedX = dragOrigin.x + deltaX;
    const wantedY = dragOrigin.y + deltaY;
    const { x, y } = clampPetPosition(bounds, area, wantedX, wantedY);
    win.setPosition(Math.round(x), Math.round(y), false);
  }, 16);
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
