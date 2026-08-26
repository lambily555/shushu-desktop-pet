const pet = document.querySelector('#pet');
const sprite = document.querySelector('.sprite');
const bubble = document.querySelector('#bubble');
const closeButton = document.querySelector('#close');
const sizeTip = document.querySelector('#sizeTip');
const realVideoCanvas = document.querySelector('#realVideo');
const realVideoContext = realVideoCanvas.getContext('2d');
const realCutout = document.querySelector('#realCutout');
const foodProp = document.querySelector('#foodProp');
const realHitCanvas = document.createElement('canvas');
realHitCanvas.width = 290; realHitCanvas.height = 290;
const realHitContext = realHitCanvas.getContext('2d', { willReadFrequently:true });
function isRealCutoutPoint(x,y) {
  const r=realCutout.getBoundingClientRect();
  const nx=(x-r.left)/r.width, ny=(y-r.top)/r.height;
  if(nx<0||nx>1||ny<0||ny>1||!realCutout.complete||!realCutout.naturalWidth)return false;
  try{
    realHitContext.clearRect(0,0,290,290);
    realHitContext.drawImage(realCutout,0,0,290,290);
    return realHitContext.getImageData(Math.min(289,Math.floor(nx*290)),Math.min(289,Math.floor(ny*290)),1,1).data[3]>42;
  }catch{return false;}
}
window.addEventListener('error',event=>{bubble.textContent=`3D错误：${event.message}`;bubble.classList.add('show')});
window.addEventListener('unhandledrejection',event=>{bubble.textContent=`3D错误：${event.reason?.message||event.reason}`;bubble.classList.add('show')});
let typingTimer, actionTimer, bubbleTimer, pointerDown, movePending = false;
let rotating3d = false, rotateLastX = 0, rotateLastY = 0, rotateMoved = false;
let clicks = 0, state = 'idle', idleSeconds = 0, dragged = false;
let idleAdventure = false;
let lastAdventure = 0;
let scale = Number(localStorage.getItem('petScale') || 1);
let appSettings = { keyboardReaction:true, idleWheel:true, randomTalk:true, soundEnabled:true, idleDelay:22, outfit:'none', petForm:'real', customLines:[] };
const profile = {
  birthday: '2024-06-09',
  sex: '小男鼠',
  weight: '六十多克',
  favorites: ['菜叶', '面包虫', '小饼干', '营养糊糊'],
  home: '小木屋'
};
const lines = [
  '我跟你一起摸鱼',
  '快起来活动活动',
  '今天听Mariah Carey了没',
  '嘿！我在呢～',
  '再摸一下！',
  '今天也辛苦啦',
  '要不要喝口水？',
  '鼠鼠给你加油！',
  '奖励我一片菜叶吧',
  '面包虫！是面包虫吗？',
  '小饼干可以分我一小口吗',
  '今天的营养糊糊准备好了吗',
  '六十多克的我，也能给你很多陪伴',
  '我是2024年6月9日出生的小男鼠哦',
  '想回小木屋里窝一会儿',
  '晚上记得来看我跑跑轮',
  '你工作，我在旁边认真监工',
  '别皱眉啦，给你一个仓鼠抱抱',
  '累了就休息一下，我帮你看着桌面',
  '今天也要慢慢来，不着急',
  '咔嚓咔嚓……假装我在吃菜叶',
  '我这么圆，是因为装满了可爱',
  '你一叫我，我就从小木屋里出来啦',
  '夜晚才是小仓鼠的黄金时间！'
];
const daydreams = [
  '发会儿呆……',
  '我跟你一起摸鱼',
  '快起来活动活动',
  '今天听Mariah Carey了没',
  '刚才是不是有菜叶？',
  '好像闻到面包虫了',
  '偷偷看你一眼',
  '想念我的小木屋……',
  '今晚要多跑几圈跑轮',
  '六十多克的桌面巡视员正在值班',
  '小男鼠也有认真思考的时候',
  '鼠鼠正在巡视桌面'
];
const randomActions = ['look', 'groom', 'stretch', 'look', 'idle', 'groom'];
const spriteSheets = {};
const stateCell = {
  idle:[0,0,0], typing:[0,1,0], loafing:[0,0,1], happy:[0,1,1],
  stretch:[1,0,0], groom:[1,1,0], look:[1,0,1], sleep:[1,1,1]
};
function loadSheet(index, src) {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    canvas.getContext('2d', { willReadFrequently:true }).drawImage(image, 0, 0);
    spriteSheets[index] = canvas;
  };
  image.src = src;
}
loadSheet(0, '../assets/hamster-sprites.png');
loadSheet(1, '../assets/hamster-life-sprites.png');
function isOpaqueHit(event) {
  if(appSettings.petForm === 'real'){
    return isRealCutoutPoint(event.clientX,event.clientY);
  }
  if(appSettings.petForm !== 'real'){
    const r=sprite.getBoundingClientRect(),nx=(event.clientX-r.left)/r.width,ny=(event.clientY-r.top)/r.height;
    return Math.pow((nx-.5)/.42,2)+Math.pow((ny-.56)/.44,2)<=1;
  }
  const cell = stateCell[state] || stateCell.idle;
  const canvas = spriteSheets[cell[0]];
  if (!canvas) return true;
  // offsetX/Y stays in the sprite's untransformed 290×290 local space;
  // client coordinates drift when breathing/tilt transforms change its bounds.
  const nx = event.offsetX / sprite.clientWidth;
  const ny = event.offsetY / sprite.clientHeight;
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return false;
  const cw = canvas.width / 2, ch = canvas.height / 2;
  const x = Math.min(canvas.width - 1, Math.floor((cell[1] + nx) * cw));
  const y = Math.min(canvas.height - 1, Math.floor((cell[2] + ny) * ch));
  return canvas.getContext('2d').getImageData(x, y, 1, 1).data[3] > 96;
}

function pointInElement(x,y,element,padding=0){
  const r=element.getBoundingClientRect();
  return x>=r.left-padding&&x<=r.right+padding&&y>=r.top-padding&&y<=r.bottom+padding;
}
function isOpaquePoint(x,y){
  if(appSettings.petForm === 'real')return isRealCutoutPoint(x,y);
  if(appSettings.petForm !== 'real'){const r=sprite.getBoundingClientRect(),nx=(x-r.left)/r.width,ny=(y-r.top)/r.height;return Math.pow((nx-.5)/.42,2)+Math.pow((ny-.56)/.44,2)<=1;}
  const cell=stateCell[state]||stateCell.idle,canvas=spriteSheets[cell[0]],r=sprite.getBoundingClientRect();
  const nx=(x-r.left)/r.width,ny=(y-r.top)/r.height;
  if(nx<0||nx>1||ny<0||ny>1)return false;
  if(!canvas)return true;
  const cw=canvas.width/2,ch=canvas.height/2;
  const px=Math.min(canvas.width-1,Math.floor((cell[1]+nx)*cw));
  const py=Math.min(canvas.height-1,Math.floor((cell[2]+ny)*ch));
  return canvas.getContext('2d').getImageData(px,py,1,1).data[3]>70;
}
let mousePassthrough;
window.addEventListener('mousemove',event=>{
  const interactive=isOpaquePoint(event.clientX,event.clientY)||pointInElement(event.clientX,event.clientY,document.querySelector('#dragHandle'),3)||pointInElement(event.clientX,event.clientY,closeButton,2);
  const next=!interactive;
  if(next!==mousePassthrough){mousePassthrough=next;window.petAPI.setMousePassthrough(next)}
});
window.addEventListener('mouseleave',()=>{mousePassthrough=true;window.petAPI.setMousePassthrough(true)});

function setState(next, duration = 0) {
  state = next; pet.className = `pet ${next}`; clearTimeout(actionTimer);
  syncRealCutout();
  window.dispatchEvent(new CustomEvent('pet-state',{detail:next}));
  const names={idle:'正在陪伴',typing:'正在和你一起打字',loafing:'正在摸鱼',happy:'心情很好',stretch:'正在伸懒腰',groom:'正在理毛',look:'正在观察你',sleep:'正在睡觉',wheel:'正在跑跑轮'};
  window.petAPI.reportStatus(names[next]||'正在陪伴');
  if (duration) actionTimer = setTimeout(() => setState(idleSeconds > 25 ? 'sleep' : 'idle'), duration);
}

const realCutoutActions = {
  idle:['idle-a','idle-b'], typing:['groom-a','groom-b'], loafing:['eat-a','eat-b'],
  happy:['idle-b','groom-b'], stretch:['idle-b'], groom:['groom-a','groom-b'],
  look:['idle-a','idle-b'], sleep:['idle-a'], wheel:['groom-b']
};
const realCutoutNames = [...new Set(Object.values(realCutoutActions).flat())];
const realCutoutPreload = realCutoutNames.map(action => {
  const image = new Image(); image.src = `../assets/videos/matted/${action}.webp`; return image;
});
let customCutoutActions = {};
function cutoutSource(action){return customCutoutActions[action]?.src||`../assets/videos/matted/${action}.webp`}
let activeRealCutout = '';
const realCutoutCursor = {};
function syncRealCutout(force=false) {
  const choices = realCutoutActions[state] || realCutoutActions.idle;
  const cursor = realCutoutCursor[state] || 0;
  const action = choices[cursor % choices.length];
  realCutoutCursor[state] = cursor + 1;
  if (!force && action === activeRealCutout) return;
  activeRealCutout = action;
  realCutout.src = cutoutSource(action);
}

const realVideoSources = {
  calm: '../assets/videos/raw/video-04.mp4',
  groom: '../assets/videos/raw/video-01.mp4',
  eat: '../assets/videos/raw/video-02.mp4',
  sleep: '../assets/videos/raw/video-03.mp4',
  interact: '../assets/videos/raw/video-05.mp4',
  turn: '../assets/videos/raw/video-06.mp4'
};
const realVideoCrops = {
  calm: { x:.12, y:.25, w:.76, h:.48 },
  groom: { x:.13, y:.20, w:.74, h:.50 },
  eat: { x:.02, y:.28, w:.67, h:.45 },
  sleep: { x:.05, y:.03, w:.80, h:.92 },
  interact: { x:.03, y:.02, w:.92, h:.74 },
  turn: { x:.02, y:.22, w:.96, h:.47 }
};
const realStateClips = {
  idle:'calm', typing:'groom', loafing:'eat', happy:'interact',
  stretch:'interact', groom:'groom', look:'turn', sleep:'sleep', wheel:'interact'
};
const realVideos = {};
let activeRealClip = '';
for (const [name, src] of Object.entries(realVideoSources)) {
  const video = document.createElement('video');
  video.src = src; video.loop = true; video.muted = true; video.playsInline = true; video.preload = 'auto';
  realVideos[name] = video;
}
function syncRealVideo(force=false) {
  const clip = realStateClips[state] || 'calm';
  if (!force && clip === activeRealClip) return;
  if (realVideos[activeRealClip]) realVideos[activeRealClip].pause();
  activeRealClip = clip;
  const video = realVideos[clip];
  if (video.ended || video.currentTime >= video.duration - .1) video.currentTime = 0;
  if (appSettings.petForm === 'real') video.play().catch(()=>{});
}
function drawRealVideo() {
  requestAnimationFrame(drawRealVideo);
  if (appSettings.petForm !== 'real') return;
  syncRealVideo();
  const video = realVideos[activeRealClip];
  if (!video || video.readyState < 2) return;
  const crop = realVideoCrops[activeRealClip];
  const sw=video.videoWidth*crop.w, sh=video.videoHeight*crop.h;
  realVideoContext.clearRect(0,0,600,600);
  realVideoContext.save();
  realVideoContext.beginPath();
  realVideoContext.ellipse(300,315,270,255,0,0,Math.PI*2);
  realVideoContext.clip();
  realVideoContext.drawImage(video,video.videoWidth*crop.x,video.videoHeight*crop.y,sw,sh,24,34,552,526);
  realVideoContext.globalCompositeOperation='destination-in';
  const edge=realVideoContext.createRadialGradient(300,300,205,300,300,292);
  edge.addColorStop(0,'rgba(0,0,0,1)'); edge.addColorStop(.72,'rgba(0,0,0,.98)'); edge.addColorStop(1,'rgba(0,0,0,0)');
  realVideoContext.fillStyle=edge; realVideoContext.fillRect(0,0,600,600);
  realVideoContext.restore();
}
// The first prototype drew the raw rectangular video into a round canvas.
// Keep that code dormant; the real mode now uses true alpha-matted actions.
function say(text, duration = 1900) {
  bubble.textContent = text; bubble.classList.add('show'); clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), duration);
}
function keyboardActivity() {
  idleSeconds = 0;
  if (idleAdventure) { idleAdventure = false; window.petAPI.wanderStop(); }
  if (!appSettings.keyboardReaction) return;
  if (state === 'happy' || pointerDown) return; setState('typing'); clearTimeout(typingTimer);
  typingTimer = setTimeout(() => setState('idle'), 820);
}
window.addEventListener('keydown', keyboardActivity);
window.petAPI.onKeyboard(keyboardActivity);
window.petAPI.onIdle((seconds) => {
  idleSeconds = seconds;
  if (pointerDown) return;
  if (appSettings.idleWheel && seconds > appSettings.idleDelay && !idleAdventure && Date.now() - lastAdventure > 45000) {
    idleAdventure = true;
    lastAdventure = Date.now();
    setState('wheel');
    say('夜晚才是跑轮时间！', 1800);
    setTimeout(() => {
      window.petAPI.wanderStop(); idleAdventure = false;
      setState(idleSeconds > 45 ? 'sleep' : 'loafing');
    }, 11000 + Math.random() * 5000);
    return;
  }
  if (idleAdventure) return;
  if (seconds > 45 && state !== 'happy') setState('sleep');
  else if (seconds > 16 && ['idle', 'look', 'typing'].includes(state)) setState('loafing');
});
function scheduleLife() {
  setTimeout(() => {
    if (!pointerDown && idleSeconds < 16 && !['typing', 'happy'].includes(state)) {
      const next = randomActions[Math.floor(Math.random() * randomActions.length)];
      setState(next, next === 'stretch' ? 1900 : 2400);
      if (appSettings.randomTalk && Math.random() < .2) say(daydreams[Math.floor(Math.random() * daydreams.length)], 1500);
    }
    scheduleLife();
  }, 3500 + Math.random() * 5000);
}
sprite.addEventListener('pointermove', (event) => {
  if (rotating3d) {
    const dx = event.clientX - rotateLastX, dy = event.clientY - rotateLastY;
    if (Math.abs(dx) + Math.abs(dy) > 1) rotateMoved = true;
    rotateLastX = event.clientX; rotateLastY = event.clientY;
    window.dispatchEvent(new CustomEvent('pet-rotate', { detail: { dx, dy } }));
    return;
  }
  const rect = pet.getBoundingClientRect();
  pet.style.setProperty('--rx', `${((event.clientY / rect.height) - .5) * -7}deg`);
  pet.style.setProperty('--ry', `${((event.clientX / rect.width) - .5) * 9}deg`);
});
sprite.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !isOpaqueHit(event)) return;
  if (appSettings.petForm === 'real') return;
  event.preventDefault(); event.stopPropagation();
  rotating3d = true; rotateMoved = false; rotateLastX = event.clientX; rotateLastY = event.clientY;
  sprite.setPointerCapture(event.pointerId);
});
sprite.addEventListener('pointerup', event => {
  if (!rotating3d || event.button !== 0) return;
  rotating3d = false;
  if (sprite.hasPointerCapture(event.pointerId)) sprite.releasePointerCapture(event.pointerId);
});
sprite.addEventListener('pointercancel', () => { rotating3d = false; });
sprite.addEventListener('contextmenu', event => event.preventDefault());
function happyInteraction(){
  clicks += 1; idleSeconds = 0; setState('happy', 1500);
  window.petAPI.recordActivity('interaction');
  const pool = [...lines, ...(appSettings.customLines || [])];
  say(clicks % 5 === 0 ? '好感度 +1 ♥' : pool[(clicks - 1) % pool.length]);
  playHappySound();
}
sprite.addEventListener('click', (event) => {
  if (!isOpaqueHit(event)) return;
  if (rotateMoved) { rotateMoved = false; return; }
  happyInteraction();
});
sprite.addEventListener('pointerleave', () => {
  pet.style.setProperty('--rx', '0deg'); pet.style.setProperty('--ry', '0deg');
});
sprite.addEventListener('wheel', (event) => {
  if (!isOpaqueHit(event)) return;
  event.preventDefault();
  scale = Math.round(Math.min(1.65, Math.max(.25, scale + (event.deltaY < 0 ? .1 : -.1))) * 20) / 20;
  localStorage.setItem('petScale', scale); window.petAPI.setScale(scale);
  sizeTip.textContent = `鼠鼠大小 ${Math.round(scale * 100)}%`; sizeTip.classList.add('show');
  setTimeout(() => sizeTip.classList.remove('show'), 900);
}, { passive: false });
window.petAPI.onScale((value) => {
  const root = document.documentElement.style;
  root.setProperty('--pet-scale', value);
  root.setProperty('--pet-top', `${305 * value}px`);
});
function applySettings(next) {
  appSettings = { ...appSettings, ...next };
  customCutoutActions=Object.fromEntries((appSettings.customActions||[]).map(action=>[action.id,action]));
  Object.values(customCutoutActions).forEach(action=>{const image=new Image();image.src=action.src});
  document.body.classList.toggle('mode-real', appSettings.petForm === 'real');
  document.body.classList.toggle('mode-3d', appSettings.petForm !== 'real');
  for (const video of Object.values(realVideos)) video.pause();
  if (appSettings.petForm === 'real') syncRealCutout(true);
  const outfit = document.querySelector('#outfit');
  outfit.className = `outfit ${appSettings.outfit || 'none'}`;
}
let happyAudioBuffer;
let happyAudioContext;
async function cleanHappyBuffer(input){
  const gated=new AudioBuffer({length:input.length,numberOfChannels:input.numberOfChannels,sampleRate:input.sampleRate});
  const frame=Math.max(128,Math.floor(input.sampleRate*.012));
  for(let channel=0;channel<input.numberOfChannels;channel++){
    const source=input.getChannelData(channel);const target=gated.getChannelData(channel);const levels=[];
    for(let i=0;i<source.length;i+=frame){let sum=0;const end=Math.min(source.length,i+frame);for(let j=i;j<end;j++)sum+=source[j]*source[j];levels.push(Math.sqrt(sum/(end-i)))}
    const sorted=[...levels].sort((a,b)=>a-b);const noise=sorted[Math.floor(sorted.length*.28)]||0;const peak=Math.max(...levels);const threshold=Math.max(noise*2.7,peak*.025);let envelope=0;
    for(let i=0;i<source.length;i++){
      const level=levels[Math.min(levels.length-1,Math.floor(i/frame))];const wanted=level>threshold?1:.035;envelope+=((wanted>envelope?.18:.025)*(wanted-envelope));target[i]=source[i]*envelope;
    }
  }
  const offline=new OfflineAudioContext(gated.numberOfChannels,gated.length,gated.sampleRate);const node=offline.createBufferSource();const high=offline.createBiquadFilter();const low=offline.createBiquadFilter();
  high.type='highpass';high.frequency.value=650;high.Q.value=.72;low.type='lowpass';low.frequency.value=9000;low.Q.value=.65;node.buffer=gated;node.connect(high).connect(low).connect(offline.destination);node.start();const cleaned=await offline.startRendering();
  let max=0;for(let c=0;c<cleaned.numberOfChannels;c++){const d=cleaned.getChannelData(c);for(let i=0;i<d.length;i++)max=Math.max(max,Math.abs(d[i]))}const scale=max?Math.min(8,.92/max):1;
  for(let c=0;c<cleaned.numberOfChannels;c++){const d=cleaned.getChannelData(c);for(let i=0;i<d.length;i++)d[i]*=scale}return cleaned;
}
async function playHappySound(){
  if(!appSettings.soundEnabled)return;
  try{
    happyAudioContext ||= new AudioContext();
    if(happyAudioContext.state==='suspended')await happyAudioContext.resume();
    if(!happyAudioBuffer){
      const data=await fetch('../assets/audio/hamster-happy.mp3').then(r=>r.arrayBuffer());
      happyAudioBuffer=await cleanHappyBuffer(await happyAudioContext.decodeAudioData(data));
    }
    const source=happyAudioContext.createBufferSource();
    const gain=happyAudioContext.createGain();
    const compressor=happyAudioContext.createDynamicsCompressor();
    const now=happyAudioContext.currentTime;
    const duration=Math.min(4.5,happyAudioBuffer.duration);
    gain.gain.setValueAtTime(1.65,now);
    gain.gain.setValueAtTime(1.65,now+Math.max(0,duration-.3));
    gain.gain.linearRampToValueAtTime(0.001,now+duration);
    compressor.threshold.value=-10;
    compressor.knee.value=10;
    compressor.ratio.value=4;
    compressor.attack.value=.003;
    compressor.release.value=.18;
    source.buffer=happyAudioBuffer;
    source.connect(gain).connect(compressor).connect(happyAudioContext.destination);
    source.start(now,0,duration);
  }catch{
    const fallback=new Audio('../assets/audio/hamster-happy.mp3');
    fallback.volume=1;
    fallback.play().catch(()=>{});
    setTimeout(()=>{fallback.pause();fallback.currentTime=0},4500);
  }
}
window.petAPI.getSettings().then(applySettings);
window.petAPI.onSettings(applySettings);
window.petAPI.onFed((payload)=>{const food=typeof payload==='string'?payload:payload?.food,portion=typeof payload==='object'?payload.portion||1:1,names={leaf:'菜叶',worm:'面包虫',cookie:'小饼干',paste:'营养糊糊'};setState('feeding');pet.classList.add(`feeding-${food}`);foodProp.src=`../assets/foods/${food}.png`;foodProp.className=`food-prop show ${food}`;if(appSettings.petForm==='real'){activeRealCutout='eat-a';realCutout.src=cutoutSource('eat-a')}say(food==='leaf'?'我抱好啦，咔嚓咔嚓慢慢吃～':`谢谢！${names[food]||'好吃的'}真香～`,3600);playHappySound();clearTimeout(actionTimer);actionTimer=setTimeout(()=>{foodProp.className='food-prop';setState(idleSeconds>25?'sleep':'idle')},4200+portion*350)});
window.petAPI.onPetCommand(command=>{
  if(command==='pet'){happyInteraction();return}
  if(command==='wheel'){setState('wheel');say('出发！今晚也要跑得飞快～',1800);setTimeout(()=>setState('idle'),5000);return}
  if(command?.startsWith('action:')){
    const action=command.slice(7);
    if(!realCutoutNames.includes(action)&&!customCutoutActions[action])return;
    clearTimeout(actionTimer);state='preview';pet.className='pet preview';activeRealCutout=action;
    realCutout.src=cutoutSource(action);
    const names={'idle-a':'安静坐着','idle-b':'侧头观察','groom-a':'低头理毛','groom-b':'转身整理','eat-a':'认真吃菜','eat-b':'继续加餐'};
    const actionName=appSettings.actionNames?.[action]||names[action]||customCutoutActions[action]?.name||'鼠鼠动作';
    say(`正在预览：${actionName}`,1800);window.petAPI.reportStatus(`正在预览${actionName}`);
    actionTimer=setTimeout(()=>setState('idle'),4500);
  }
});
closeButton.addEventListener('click', (event) => { event.stopPropagation(); window.petAPI.hide(); });
window.petAPI.setScale(scale);
setTimeout(() => say(appSettings.petForm === 'real' ? '点我互动 · 拖动底部按钮移动 · 滚轮缩放' : '点我互动 · 按住鼠鼠拖动旋转 · 滚轮缩放', 3800), 450);
scheduleLife();
