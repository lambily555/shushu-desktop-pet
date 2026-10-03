import {cottageFurniture} from './town-cottage-interior.js';
// Scene-time movement is separate from real-time needs and aging.
export const destinations=[
 ['跑轮公园',-11,-7.5,false,'跑轮',[-1.9,-.8]],['诊所',-4.5,-10,true,'检查',[.4,-.8]],
 ['零食铺',9,-7,true,'购买粮食',[.5,1.9]],['中心广场',0,-1.3,false,'社交',[0,0]],
 ['纪念馆',-11,3.5,true,'参观',[0,-.5]],['鼠鼠小屋',-5,6.5,true,'休息',cottageFurniture.bed],
 ['小菜园',0,-14.4,false,'照看菜园',[0,0]],['殡仪馆',-8,11,true,'工作',[0,1]],
 ['墓地',2,11,false,'纪念',[0,0]],['鼠鼠学校',10,6.5,true,'学习',[1.4,1.8]],['鼠鼠饭馆',4.5,-10,true,'用餐',[-1.4,.5]],['Mariah Carey名人堂',4.5,5.8,true,'欣赏展览',[0,.2]]];
const byName=new Map(destinations.map(d=>[d[0],d]));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=(x,z)=>({x,z});
export const facing=name=>{const d=byName.get(name);return name==='中心广场'?0:Math.round(Math.atan2(-d[1],-1.3-d[2])/(Math.PI/2))*(Math.PI/2)};
export function entrance(name){const d=byName.get(name)||byName.get('鼠鼠小屋'),a=facing(d[0]);return {x:d[1]+Math.sin(a)*(name==='跑轮公园'?2.5:1.9),z:d[2]+Math.cos(a)*(name==='跑轮公园'?2.5:1.9)}}
export function blocked(x,z,ignoreName=null){return destinations.some(d=>{if(d[0]==='中心广场'||d[0]===ignoreName)return false;if(d[0]==='跑轮公园')return Math.hypot(x-d[1],z-d[2])<2.2;const a=facing(d[0]),dx=x-d[1],dz=z-d[2];if(d[0]==='墓地'){const lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);return Math.abs(lx)<2.12&&Math.abs(lz)<1.66&&(Math.abs(lx)>1.95||lz< -1.03||(lz>1.46&&Math.abs(lx)>.45)||(Math.abs(lx)>.3&&Math.abs(lz-.08)>.2))}return Math.abs(dx*Math.cos(a)-dz*Math.sin(a))<(d[0]==='鼠鼠饭馆'?2.1:d[0]==='Mariah Carey名人堂'?1.75:1.62)&&Math.abs(dx*Math.sin(a)+dz*Math.cos(a))<(d[0]==='鼠鼠饭馆'?1.5:d[0]==='Mariah Carey名人堂'?1.4:1.2)})||Math.hypot(x,z+1.3)<.9}
// Grid routes avoid building footprints, garden beds and the central fountain.
export function route(start,end){
 const unit=.4,toGrid=p=>[Math.round(p.x/unit),Math.round(p.z/unit)],key=(x,z)=>`${x},${z}`;
 const [sx,sz]=toGrid(start),[ex,ez]=toGrid(end),open=[{x:sx,z:sz,g:0,f:0}],cost=new Map([[key(sx,sz),0]]),parent=new Map();let found=null;
 while(open.length){open.sort((a,b)=>a.f-b.f);const n=open.shift(),nk=key(n.x,n.z);if(n.g!==cost.get(nk))continue;if(n.x===ex&&n.z===ez){found=n;break}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]]){const x=n.x+dx,z=n.z+dz;if(x<-44||x>44||z<-44||z>44)continue;if(blocked(x*unit,z*unit)||dx&&dz&&(blocked(n.x*unit+dx*unit,n.z*unit)||blocked(n.x*unit,n.z*unit+dz*unit)))continue;
   const g=n.g+Math.hypot(dx,dz),k=key(x,z);if(g>=(cost.get(k)??Infinity))continue;cost.set(k,g);parent.set(k,nk);open.push({x,z,g,f:g+Math.hypot(x-ex,z-ez)});
  }
 }
 if(!found)return [];const result=[point(ex*unit,ez*unit)];let k=key(ex,ez);while(parent.has(k)){k=parent.get(k);const [x,z]=k.split(',').map(Number);result.push(point(x*unit,z*unit))}result.reverse();result.push({...end});return result;
}
export function createTownLife(onEvent=()=>{}){
 const actors=new Map();let elapsed=0,day=true,conversations=0,celebration=null;
 function add(id,home,options={}){if(actors.has(id))return actors.get(id);const actor={id,home,name:options.name||id,age:options.age??.7,child:!!options.child,position:entrance(home),heading:0,moving:false,phase:'idle',inside:null,place:home,destination:home,action:'休息',path:[],wait:actors.size*1.3,cycle:0,partner:null,visited:new Set(),completed:0,speech:''};actors.set(id,actor);return actor}
 function go(actor,target,nextPhase,indoor=false){const path=indoor?[target]:route(actor.position,target);if(!path.length){actor.phase='idle';actor.wait=2;return false}actor.path=path;actor.phase='moving';actor.arrival=nextPhase;return true}
 function plan(actor){
  actor.cycle++;actor.speech='';actor.partner=null;if(actor.forcedSleep){actor.destination=actor.forcedHospital?'诊所':'鼠鼠小屋';actor.action=actor.forcedHospital?'住院':'睡觉';go(actor,entrance(actor.destination),'arrived');return}if(celebration){actor.destination='中心广场';actor.action='庆祝';go(actor,entrance(actor.destination),'arrived');return}
  const choices=actor.child?['鼠鼠小屋','跑轮公园','中心广场','小菜园','鼠鼠学校']:['小菜园','零食铺','中心广场',actor.home,'跑轮公园','鼠鼠小屋','纪念馆','诊所','墓地','殡仪馆','鼠鼠学校','鼠鼠饭馆','Mariah Carey名人堂','中心广场'];
  const index=(actor.cycle-1+[...actors.keys()].indexOf(actor.id))%choices.length;
  actor.destination=actor.child&&actor.age<.18?'鼠鼠小屋':choices[index];if(actor.destination==='中心广场'&&actor.allowSocial===false)actor.destination='鼠鼠小屋';actor.action=byName.get(actor.destination)[4];
  if(actor.destination==='鼠鼠小屋')actor.action=actor.child&&actor.age<.18?'睡觉':actor.cycle%3===0?'饮水':day?'休息':'进食';
  go(actor,entrance(actor.destination),'arrived');
 }
 function complete(actor){actor.completed++;actor.visited.add(actor.destination);onEvent({id:actor.id,type:'activity',action:actor.action,place:actor.destination});actor.phase=actor.inside?'exit-room':actor.action==='跑轮'||actor.destination==='墓地'?'exit-yard':'idle';actor.wait=2}
 function tick(dt,isDay=day){day=isDay;dt=Math.max(0,Math.min(dt,1));elapsed+=dt;
  for(const actor of actors.values()){
   actor.moving=false;if(actor.frozen||actor.controlled)continue;
   if(actor.phase==='moving'){
    let budget=dt*(actor.child?.48:.72);while(budget>0&&actor.path.length){const target=actor.path[0],dist=distance(actor.position,target);if(dist>.001){actor.heading=Math.atan2(target.x-actor.position.x,target.z-actor.position.z);actor.moving=true}if(dist<=budget){actor.position={...target};actor.path.shift();budget-=dist}else{actor.position.x+=(target.x-actor.position.x)*budget/dist;actor.position.z+=(target.z-actor.position.z)*budget/dist;budget=0}}
    if(!actor.path.length)actor.phase=actor.arrival;continue;
   }
   if(actor.phase==='idle'){actor.wait-=dt;if(actor.wait<=0)plan(actor)}
   else if(actor.phase==='arrived'){
    actor.place=actor.destination;onEvent({id:actor.id,type:'status',action:actor.action==='睡觉'?'回家睡觉':actor.action,place:actor.destination});const d=byName.get(actor.destination);
    if(celebration&&actor.destination==='中心广场'){const index=[...actors.keys()].indexOf(actor.id),a=index/Math.max(actors.size,1)*Math.PI*2;go(actor,point(Math.cos(a)*2.15,-1.3+Math.sin(a)*1.2),'celebrating')}
    else if(d[3]){actor.inside=actor.destination;actor.position=point(0,2.6);const stations=actor.action==='住院'?[-1.15,-.8]:actor.action==='睡觉'?cottageFurniture.bed:actor.action==='饮水'?cottageFurniture.water:actor.action==='进食'?cottageFurniture.bowl:d[5];go(actor,point(...stations),'using',true)}
    else if(actor.action==='社交'){actor.phase='meeting';actor.wait=35;actor.speech='等朋友一起聊聊';go(actor,point(-1.9+(actors.size?([...actors.keys()].indexOf(actor.id)%4)*.85:0),.65),'meeting')}
    else{actor.wait=0;if(actor.destination==='墓地')go(actor,point(d[1],d[2]),'using');else if(actor.action==='跑轮')go(actor,point(d[1],d[2]+.2),'using',true);else{actor.phase='using'}}
   }
   else if(actor.phase==='celebrating'){actor.heading=Math.atan2(-actor.position.x,-1.3-actor.position.z);actor.speech=celebration?celebration.birthdays.includes(actor.id)?'谢谢大家陪我过生日！':celebration.birthdays.length?'生日快乐！一起分享小蛋糕吧！':'仓鼠朋友们，节日快乐！':'';if(!celebration){actor.phase='idle';actor.wait=1}}
   else if(actor.phase==='using'){if(actor.wait<=0){actor.wait=day?24:12;actor.phase='activity';if(actor.action==='睡觉')onEvent({id:actor.id,type:'status',action:'睡觉',place:actor.destination});actor.heading=actor.inside?Math.PI:facing(actor.destination)+Math.PI;actor.speech=actor.action==='欣赏展览'?'看看喜欢的专辑和唱片':actor.action==='用餐'?'坐下来，尝尝新鲜蔬菜和谷物':actor.action==='住院'?'安静休养，等白大夫照料':actor.action==='购买粮食'?'挑一点喜欢的粮食':actor.action==='检查'?'认真检查身体':actor.action==='饮水'?'喝一点水':actor.action==='进食'?'嚼嚼，好香呀':actor.action==='照看菜园'?'看看嫩叶长好了没有':actor.action==='跑轮'?'跑起来！':actor.action==='参观'?'看看大家留下的回忆':actor.action==='学习'?'翻开书本，认识新的种子':actor.action==='纪念'?'轻轻问好，记住在这里的朋友':actor.action==='工作'?'整理送别用品，保持这里安静':actor.action==='睡觉'?'呼……':'休息一会儿'}}
   else if(actor.phase==='activity'){if(actor.forcedSleep&&['睡觉','住院'].includes(actor.action))continue;actor.wait-=dt;if(actor.wait<=0)complete(actor)}
   else if(actor.phase==='exit-yard'){actor.speech='';go(actor,entrance(actor.place),'idle',actor.place!=='墓地')}
   else if(actor.phase==='exit-room'){actor.speech='';go(actor,point(0,2.6),'outside',true)}
   else if(actor.phase==='outside'){actor.position=entrance(actor.inside);actor.inside=null;actor.phase='idle';actor.wait=1}
   else if(actor.phase==='meeting'){
    const friend=[...actors.values()].find(other=>other!==actor&&other.phase==='meeting'&&!other.partner&&other.allowSocial!==false);
    if(friend){actor.partner=friend.id;friend.partner=actor.id;const middle=point((actor.position.x+friend.position.x)/2,.8);go(actor,point(middle.x-.33,middle.z),'meet-ready');go(friend,point(middle.x+.33,middle.z),'meet-ready');}
    else{actor.wait-=dt;if(actor.wait<=0){actor.speech='下次再来找朋友';complete(actor)}}
   }
   else if(actor.phase==='meet-ready'){const other=actors.get(actor.partner);if(!other){actor.phase='idle';actor.wait=1;continue}if(other.phase==='meet-ready'&&distance(actor.position,other.position)<.85){actor.phase=other.phase='talking';actor.wait=other.wait=10;actor.heading=Math.atan2(other.position.x-actor.position.x,other.position.z-actor.position.z);other.heading=actor.heading+Math.PI;conversations++;onEvent({id:actor.id,otherId:other.id,type:'social',place:'中心广场'})}}
   else if(actor.phase==='talking'){actor.wait-=dt;const other=actors.get(actor.partner);actor.speech=actor.wait>6?`你好，${other?.name||'朋友'}！`:actor.wait>3?'今天的嫩叶很香哦。':'下次一起去公园吧！';if(actor.wait<=0){actor.partner=null;complete(actor)}}
  }
 }
 function setResting(requested,hospitalized=false){requested=!!requested||hospitalized;const actor=actors.get('main');if(!actor||actor.frozen||(!!actor.forcedSleep===!!requested&&!!actor.forcedHospital===hospitalized))return;const other=actors.get(actor.partner);if(other){other.partner=null;other.phase='idle';other.wait=1}if(requested&&(actor.memorialSeat||actor.clinicSeat||actor.restaurantSeat!==undefined||actor.schoolSeat!==undefined)){delete actor.memorialSeat;actor.clinicSeat=0;delete actor.restaurantSeat;delete actor.schoolSeat;actor.platformHeight=0;actor.seated=false;actor.controlled=false}actor.forcedSleep=!!requested;actor.forcedHospital=hospitalized;actor.partner=null;actor.speech='';actor.path=[];actor.wait=0;if(requested&&actor.inside===(hospitalized?'诊所':'鼠鼠小屋')){actor.destination=actor.inside;actor.action=hospitalized?'住院':'睡觉';go(actor,point(...(hospitalized?[-1.15,-.8]:cottageFurniture.bed)),'using',true)}else actor.phase=actor.inside?'exit-room':'idle'}
 function setCelebration(next){if((next?.key||null)===(celebration?.key||null)){celebration=next;return}celebration=next;for(const actor of actors.values()){if(actor.frozen||actor.forcedSleep)continue;actor.partner=null;actor.speech='';actor.path=[];actor.phase=actor.inside?'exit-room':'idle';actor.wait=0}}
 return {actors,add,tick,setResting,setCelebration,remove:id=>actors.delete(id),inspect:()=>({elapsed,conversations,actors:[...actors.values()].map(a=>({...a,entryPortal:undefined,path:undefined,visited:[...a.visited]}))})};
}
