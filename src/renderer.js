const pet = document.querySelector('#pet');
const sprite = document.querySelector('.sprite');
const bubble = document.querySelector('#bubble');
const closeButton = document.querySelector('#close');
const sizeTip = document.querySelector('#sizeTip');
const realVideoCanvas = document.querySelector('#realVideo');
const realVideoContext = realVideoCanvas.getContext('2d');
const realCutout = document.querySelector('#realCutout');
const aiDramaCutout = document.querySelector('#aiDramaCutout');
const foodProp = document.querySelector('#foodProp');
const foodCanvas = document.querySelector('#foodCanvas');
const foodCrumbs = document.querySelector('#foodCrumbs');
let feedingAnimationToken=0;

const foodBiteProfiles={
  leaf:{steps:12,start:[.53,.16],end:[.49,.88],radius:.105,crumb:'#63843e'},
  worm:{steps:10,start:[.20,.48],end:[.86,.55],radius:.115,crumb:'#b98539'},
  cookie:{steps:11,start:[.52,.12],end:[.53,.82],radius:.13,crumb:'#c89b55'},
  paste:{steps:9,start:[.48,.18],end:[.52,.76],radius:.145,crumb:'#70864e'}
};
function scatterFoodCrumbs(profile,step){
  for(let i=0;i<3;i++){
    const crumb=document.createElement('i');
    const size=3+Math.random()*4;
    crumb.style.cssText=`--crumb-x:${(Math.random()-.5)*38}px;--crumb-r:${(Math.random()-.5)*150}deg;left:${47+(Math.random()-.5)*22}%;top:${34+step*3.2}%;width:${size}px;height:${size*.72}px;background:${profile.crumb};animation-delay:${i*35}ms`;
    foodCrumbs.appendChild(crumb);
    setTimeout(()=>crumb.remove(),850);
  }
}
function animateFoodBeingEaten(food,portion=1){
  const token=++feedingAnimationToken,profile=foodBiteProfiles[food]||foodBiteProfiles.leaf;
  const ctx=foodCanvas.getContext('2d'),image=new Image();
  foodProp.className='food-prop';
  foodCanvas.className=`food-canvas show ${food}`;
  foodCrumbs.className=`food-crumbs show ${food}`;
  foodCrumbs.replaceChildren();
  image.onload=()=>{
    if(token!==feedingAnimationToken)return;
    const w=foodCanvas.width,h=foodCanvas.height;
    ctx.clearRect(0,0,w,h);
    const scale=Math.min(w/image.width,h/image.height),dw=image.width*scale,dh=image.height*scale,dx=(w-dw)/2,dy=(h-dh)/2;
    ctx.drawImage(image,dx,dy,dw,dh);
    const original=ctx.getImageData(0,0,w,h),steps=profile.steps+Math.max(0,portion-1)*2;
    let step=0;
    const bite=()=>{
      if(token!==feedingAnimationToken)return;
      step++;
      const t=Math.min(1,step/steps),jitter=(step%2?.035:-.03);
      const x=(profile.start[0]+(profile.end[0]-profile.start[0])*t+jitter)*w;
      const y=(profile.start[1]+(profile.end[1]-profile.start[1])*t)*h;
      ctx.save();ctx.globalCompositeOperation='destination-out';
      for(let n=0;n<4;n++){
        ctx.beginPath();
        ctx.arc(x+(n-1.5)*profile.radius*w*.54,y+(n%2-.5)*profile.radius*h*.42,profile.radius*w*(.72+Math.random()*.28),0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();scatterFoodCrumbs(profile,step);
      foodCanvas.classList.remove('bite-pulse');void foodCanvas.offsetWidth;foodCanvas.classList.add('bite-pulse');
      if(step<steps)setTimeout(bite,290+Math.random()*130);
      else setTimeout(()=>{if(token===feedingAnimationToken){ctx.clearRect(0,0,w,h);foodCanvas.className='food-canvas';foodCrumbs.className='food-crumbs'}},420);
    };
    setTimeout(bite,420);
  };
  image.onerror=()=>{if(token===feedingAnimationToken){foodCanvas.className='food-canvas';foodProp.src=image.src;foodProp.className=`food-prop show ${food}`}};
  image.src=`../assets/foods/${food}.png`;
}
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
const aiHitCanvas=document.createElement('canvas');
aiHitCanvas.width=290;aiHitCanvas.height=290;
const aiHitContext=aiHitCanvas.getContext('2d',{willReadFrequently:true});
function isAiDramaPoint(x,y){
  const r=aiDramaCutout.getBoundingClientRect();
  const nx=(x-r.left)/r.width,ny=(y-r.top)/r.height;
  if(nx<0||nx>1||ny<0||ny>1||!aiDramaCutout.complete||!aiDramaCutout.naturalWidth)return false;
  try{
    aiHitContext.clearRect(0,0,290,290);aiHitContext.drawImage(aiDramaCutout,0,0,290,290);
    return aiHitContext.getImageData(Math.min(289,Math.floor(nx*290)),Math.min(289,Math.floor(ny*290)),1,1).data[3]>35;
  }catch{return false}
}
window.addEventListener('error',event=>{bubble.textContent=`3D错误：${event.message}`;bubble.classList.add('show')});
window.addEventListener('unhandledrejection',event=>{bubble.textContent=`3D错误：${event.reason?.message||event.reason}`;bubble.classList.add('show')});
let typingTimer, actionTimer, bubbleTimer, pointerDown, movePending = false;
let rotating3d = false, rotateLastX = 0, rotateLastY = 0, rotateMoved = false;
let clicks = 0, state = 'idle', idleSeconds = 0, dragged = false, manualWheelUntil = 0, manualActionUntil = 0;
let idleAdventure = false;
let lastAdventure = 0;
let scale = Number(localStorage.getItem('petScale') || 1);
let appSettings = { keyboardReaction:true, idleWheel:true, randomTalk:true, soundEnabled:true, idleDelay:22, outfit:'none', petForm:'3d', customLines:[] };
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
  if(appSettings.petForm === 'ai-drama')return isAiDramaPoint(event.clientX,event.clientY);
  if(appSettings.petForm === '3d'){
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
  if(appSettings.petForm === 'ai-drama')return isAiDramaPoint(x,y);
  if(appSettings.petForm === '3d'){const r=sprite.getBoundingClientRect(),nx=(x-r.left)/r.width,ny=(y-r.top)/r.height;return Math.pow((nx-.5)/.42,2)+Math.pow((ny-.56)/.44,2)<=1;}
  const cell=stateCell[state]||stateCell.idle,canvas=spriteSheets[cell[0]],r=sprite.getBoundingClientRect();
  const nx=(x-r.left)/r.width,ny=(y-r.top)/r.height;
  if(nx<0||nx>1||ny<0||ny>1)return false;
  if(!canvas)return true;
  const cw=canvas.width/2,ch=canvas.height/2;
  const px=Math.min(canvas.width-1,Math.floor((cell[1]+nx)*cw));
  const py=Math.min(canvas.height-1,Math.floor((cell[2]+ny)*ch));
  return canvas.getContext('2d').getImageData(px,py,1,1).data[3]>70;
}
let mousePassthrough, hoverUiTimer;
window.addEventListener('mousemove',event=>{
  const dragHandle=document.querySelector('#dragHandle'),overActor=isOpaquePoint(event.clientX,event.clientY),overClose=pointInElement(event.clientX,event.clientY,closeButton,5),overDrag=pointInElement(event.clientX,event.clientY,dragHandle,6),overUi=overActor||overClose||overDrag;
  if(overUi){clearTimeout(hoverUiTimer);pet.classList.add('pointer-over')}else if(pet.classList.contains('pointer-over')&&!hoverUiTimer){hoverUiTimer=setTimeout(()=>{pet.classList.remove('pointer-over');hoverUiTimer=null},1000)}
  const interactive=overUi||pet.classList.contains('pointer-over');
  const next=!interactive;
  if(next!==mousePassthrough){mousePassthrough=next;window.petAPI.setMousePassthrough(next)}
});
window.addEventListener('mouseleave',()=>{clearTimeout(hoverUiTimer);hoverUiTimer=setTimeout(()=>{pet.classList.remove('pointer-over');hoverUiTimer=null},1000);mousePassthrough=true;window.petAPI.setMousePassthrough(true)});
const dragHandle=document.querySelector('#dragHandle');
let movingPetWindow=false;
dragHandle.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  event.preventDefault();event.stopPropagation();movingPetWindow=true;
  window.petAPI.setMousePassthrough(false);window.petAPI.dragStart();
  try{dragHandle.setPointerCapture(event.pointerId)}catch{}
});
const finishPetWindowMove=event=>{
  if(!movingPetWindow)return;
  movingPetWindow=false;window.petAPI.dragEnd();
  try{if(event&&dragHandle.hasPointerCapture(event.pointerId))dragHandle.releasePointerCapture(event.pointerId)}catch{}
};
dragHandle.addEventListener('pointerup',finishPetWindowMove);
dragHandle.addEventListener('pointercancel',finishPetWindowMove);
window.addEventListener('blur',()=>{if(movingPetWindow){movingPetWindow=false;window.petAPI.dragEnd()}});

function setState(next, duration = 0) {
  state = next; pet.className = `pet ${next}`; clearTimeout(actionTimer);
  syncRealCutout();
  syncAiDramaCutout();
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
const aiDramaActions={
  idle:'idle-breathe/idle-breathe-v2',typing:'typing/typing-v2',loafing:'lie-down/lie-down-v2',
  happy:'happy/happy-v2',stretch:'happy/happy-v2',groom:'idle-breathe/idle-breathe-v2',
  look:'idle-breathe/idle-breathe-v2',sleep:'sleep/sleep-v2',wheel:'wheel/wheel-smooth-v1',
  crawl:'crawl/crawl-v2',feeding:'feeding/feeding-v2',preview:'idle-breathe/idle-breathe-v2'
};
const aiDramaFeedingActions={
  leaf:'feeding-leaf/feeding-leaf-v2',
  worm:'feeding-worm/feeding-worm-v2',
  cookie:'feeding-cookie/feeding-cookie-v2',
  paste:'feeding-paste/feeding-paste-v2'
};
let activeFeedingFood='paste';
const aiDramaSource=action=>`../assets/ai-drama-pet/${action}.webp`;
const aiDramaPreload=[...new Set([...Object.values(aiDramaActions),...Object.values(aiDramaFeedingActions)])].map(action=>{const image=new Image();image.src=aiDramaSource(action);return image});
let activeAiDrama='';
function syncAiDramaCutout(force=false){
  if(appSettings.petForm!=='ai-drama')return;
  const action=state==='feeding'?(aiDramaFeedingActions[activeFeedingFood]||aiDramaActions.feeding):(aiDramaActions[state]||aiDramaActions.idle);
  if(!force&&action===activeAiDrama)return;
  activeAiDrama=action;
  aiDramaCutout.src=`${aiDramaSource(action)}?play=${Date.now()}`;
}
const realCutoutNames = [...new Set(Object.values(realCutoutActions).flat())];
const realCutoutPreload = realCutoutNames.map(action => {
  const image = new Image(); image.src = `../assets/videos/matted/${action}.webp`; return image;
});
let customCutoutActions = {};
function cutoutSource(action){return customCutoutActions[action]?.src||`../assets/videos/matted/${action}.webp`}
let activeRealCutout = '';
const realCutoutCursor = {};
let realRecoveryTimer;
let realRecoveryLoading = false;
function recoverRealCutout(){
  if(appSettings.petForm!=='real'||realRecoveryLoading)return;
  clearTimeout(realRecoveryTimer);
  realRecoveryTimer=setTimeout(()=>{
    const action=activeRealCutout||'idle-a',source=cutoutSource(action),separator=source.includes('?')?'&':'?';
    const resumedSource=source.startsWith('data:')?source:`${source}${separator}resume=${Date.now()}`;
    const recoveryImage=new Image();
    realRecoveryLoading=true;
    recoveryImage.onload=()=>{
      realCutout.src=resumedSource;
      realRecoveryLoading=false;
    };
    recoveryImage.onerror=()=>{realRecoveryLoading=false};
    recoveryImage.src=resumedSource;
  },120);
}
window.addEventListener('blur',()=>{document.body.dataset.visualPaused='1';if(appSettings.petForm==='real')document.body.dataset.realPaused='1';if(appSettings.petForm==='ai-drama')document.body.dataset.aiDramaPaused='1'});
window.addEventListener('focus',()=>resumePetVisual());
window.addEventListener('pageshow',recoverRealCutout);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)recoverRealCutout()});
realCutout.addEventListener('error',()=>{if(appSettings.petForm==='real'&&!realRecoveryLoading){activeRealCutout='idle-a';setTimeout(recoverRealCutout,180)}});
function resumePetVisual(){
  if(!document.body.dataset.visualPaused&&!document.body.dataset.realPaused&&!document.body.dataset.aiDramaPaused)return;
  delete document.body.dataset.visualPaused;
  if(appSettings.petForm==='real'){
    delete document.body.dataset.realPaused;
    realCutout.style.visibility='visible';
    recoverRealCutout();
  }else if(appSettings.petForm==='ai-drama'){
    delete document.body.dataset.aiDramaPaused;
    aiDramaCutout.style.visibility='visible';
    syncAiDramaCutout(true);
  }else{
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new CustomEvent('pet-3d-resume'));
  }
}
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
  if (Date.now() < manualActionUntil) return;
  if (Date.now() < manualWheelUntil) return;
  if (!appSettings.keyboardReaction) return;
  if (state === 'happy' || pointerDown) return; setState('typing'); clearTimeout(typingTimer);
  typingTimer = setTimeout(() => setState('idle'), 820);
}
window.addEventListener('keydown', keyboardActivity);
window.petAPI.onKeyboard(keyboardActivity);
window.petAPI.onIdle((seconds) => {
  idleSeconds = seconds;
  if (pointerDown) return;
  if (Date.now() < manualActionUntil) return;
  if (Date.now() < manualWheelUntil) return;
  if (appSettings.idleWheel && seconds > appSettings.idleDelay && !idleAdventure && Date.now() - lastAdventure > 45000) {
    idleAdventure = true;
    lastAdventure = Date.now();
    setState('wheel');
    say('夜晚才是跑轮时间！', 1800);
    setTimeout(() => {
      window.petAPI.wanderStop(); idleAdventure = false;
      if (Date.now() < manualWheelUntil) return;
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
    if (Date.now() >= manualWheelUntil && Date.now() >= manualActionUntil && !pointerDown && idleSeconds < 16 && !['typing', 'happy', 'wheel'].includes(state)) {
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
  if (appSettings.petForm !== '3d') return;
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
  clicks += 1; idleSeconds = 0; manualActionUntil=0; setState('happy', 1500);
  window.petAPI.recordActivity('interaction');
  const pool = [...lines, ...(appSettings.customLines || [])];
  say(clicks % 5 === 0 ? '好感度 +1 ♥' : pool[(clicks - 1) % pool.length]);
  playRealHamsterSound();
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
  root.setProperty('--pet-top', `${350 * value}px`);
  root.setProperty('--control-inverse', 1 / Math.max(.25, Number(value) || 1));
});
function applySettings(next) {
  appSettings = { ...appSettings, ...next };
  appSettings.petForm=['3d','ai-drama','real'].includes(appSettings.petForm)?appSettings.petForm:'3d';
  customCutoutActions=Object.fromEntries((appSettings.customActions||[]).map(action=>[action.id,action]));
  Object.values(customCutoutActions).forEach(action=>{const image=new Image();image.src=action.src});
  document.body.classList.toggle('mode-real', appSettings.petForm === 'real');
  document.body.classList.toggle('mode-ai-drama', appSettings.petForm === 'ai-drama');
  document.body.classList.toggle('mode-3d', appSettings.petForm === '3d');
  realCutout.style.visibility='visible';
  for (const video of Object.values(realVideos)) video.pause();
  if (appSettings.petForm === 'real') syncRealCutout(true);
  if (appSettings.petForm === 'ai-drama') syncAiDramaCutout(true);
  const outfit = document.querySelector('#outfit');
  outfit.className = `outfit ${appSettings.outfit || 'none'}`;
  window.__pet3dOutfit={outfit:appSettings.outfit||'none',form:appSettings.petForm};
  window.dispatchEvent(new CustomEvent('pet-outfit',{detail:window.__pet3dOutfit}));
}
let happyAudioBuffer;
let happyAudioContext;
function playRealHamsterSound(){
  if(!appSettings.soundEnabled)return;
  playHappySound();
}
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
    gain.gain.setValueAtTime(2.35,now);
    gain.gain.setValueAtTime(2.35,now+Math.max(0,duration-.3));
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
window.petAPI.onFed((payload)=>{const food=typeof payload==='string'?payload:payload?.food,portion=typeof payload==='object'?payload.portion||1:1,names={leaf:'菜叶',worm:'面包虫',cookie:'小饼干',paste:'营养糊糊'};activeFeedingFood=food;setState('feeding');pet.classList.add(`feeding-${food}`);const useVideoFood=appSettings.petForm==='ai-drama'&&!!aiDramaFeedingActions[food];if(useVideoFood){feedingAnimationToken++;foodProp.className='food-prop';foodCanvas.className='food-canvas';foodCrumbs.className='food-crumbs';foodCrumbs.replaceChildren()}else animateFoodBeingEaten(food,portion);if(appSettings.petForm==='real'){activeRealCutout='eat-a';realCutout.src=cutoutSource('eat-a')}const eatingLines={leaf:'我抱好啦，咔嚓咔嚓慢慢吃～',worm:'是面包虫！我要从这一头慢慢吃～',cookie:'小饼干脆脆的，我一口一口啃～',paste:'营养糊糊软软的，我慢慢舔干净～'};say(eatingLines[food]||`谢谢！${names[food]||'好吃的'}真香～`,4200);playHappySound();clearTimeout(actionTimer);actionTimer=setTimeout(()=>{feedingAnimationToken++;foodProp.className='food-prop';foodCanvas.className='food-canvas';foodCrumbs.className='food-crumbs';foodCrumbs.replaceChildren();setState(idleSeconds>25?'sleep':'idle')},5100+portion*520)});
window.petAPI.onPetCommand(command=>{
  if(command==='visual-resume'){resumePetVisual();return}
  if(command==='pet'){happyInteraction();return}
  if(command==='wheel'){
    idleAdventure=false;
    window.petAPI.wanderStop();
    manualWheelUntil=Date.now()+12000;
    setState('wheel',12000);
    say('出发！今晚也要跑得飞快～',2500);
    return;
  }
  if(command?.startsWith('say:')){say(command.slice(4),Math.max(3200,Math.min(9000,command.length*95)));return}
  if(command?.startsWith('motion:')){
    const [,form,action]=command.split(':');
    if(form!==appSettings.petForm)return;
    if(form==='real'){
      if(!realCutoutNames.includes(action)&&!customCutoutActions[action])return;
      manualActionUntil=Date.now()+6000;
      clearTimeout(actionTimer);state='preview';pet.className='pet preview';activeRealCutout=action;realCutout.src=cutoutSource(action);
      actionTimer=setTimeout(()=>setState('idle'),6000);return;
    }
    const allowed=form==='ai-drama'?['idle','typing','happy','loafing','sleep','crawl','feeding','wheel']:['idle','happy','stretch','groom','look','sleep','wheel'];
    if(!allowed.includes(action))return;
    if(form==='ai-drama'&&action==='feeding')activeFeedingFood='bowl';
    const previewDuration=form==='ai-drama'?(action==='wheel'?12000:6100):(action==='wheel'?12000:5200);
    manualActionUntil=Date.now()+previewDuration;
    idleAdventure=false;window.petAPI.wanderStop();setState(action,previewDuration);return;
  }
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
let closeArmedAt=0;
closeButton.addEventListener('pointerdown',()=>{if(document.hasFocus())closeArmedAt=Date.now()});
closeButton.addEventListener('click', (event) => { event.stopPropagation();if(document.hasFocus()&&Date.now()-closeArmedAt<900)window.petAPI.hide();closeArmedAt=0; });
window.petAPI.setScale(scale);
setTimeout(() => say(appSettings.petForm === '3d' ? '点我互动 · 按住鼠鼠拖动旋转 · 滚轮缩放' : '点我互动 · 拖动底部按钮移动 · 滚轮缩放', 3800), 450);
scheduleLife();
