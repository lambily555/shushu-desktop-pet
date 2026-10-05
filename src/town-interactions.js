(function(root){
  const actions=[
    ['hall-visit','Mariah Carey名人堂','唱片展柜','欣赏黑胶与粉胶展',{stamina:-3,mood:4}],
    ['hall-notes','Mariah Carey名人堂','专辑墙','记录专辑收藏',{stamina:-4,knowledge:2,mood:2}],
    ['home-tidy','鼠鼠小屋','木桌','整理小屋',{stamina:-4,mood:4}],
    ['home-bedding','鼠鼠小屋','坐垫','更换垫料',{bedding:-1,health:2,mood:3}],
    ['clinic-check','诊所','检查台','健康检查',{stamina:-2},'查看健康、饮水与饱腹状况'],
    ['clinic-emergency','诊所','诊疗床','急诊处理',{seeds:-10,health:18,stamina:-4},'健康低于60时可用'],
    ['clinic-hospital','诊所','诊疗床','住院休养',{seeds:-12},'住院6个小镇小时，出院健康+25、体力+20'],
    ['restaurant-soup','鼠鼠饭馆','点餐柜台','蔬菜汤',{seeds:-3,fullness:14,health:2}],
    ['restaurant-platter','鼠鼠饭馆','点餐柜台','丰盛谷物拼盘',{seeds:-6,fullness:32,mood:5}],
    ['clinic-care','诊所','药柜','领取护理用品',{seeds:-3,health:3}],
    ['restaurant-meal','鼠鼠饭馆','点餐柜台','点一份谷物蔬菜餐',{seeds:-4,fullness:22,mood:3}],
    ['restaurant-cook','鼠鼠饭馆','厨房','学习制作鼠鼠餐',{vegetables:-1,stamina:-5,food:2,knowledge:2}],
    ['shop-taste','零食铺','零食货架','品尝小零食',{seeds:-2,fullness:6,mood:4}],
    ['shop-bedding','零食铺','粮食货架','购买干净垫料',{seeds:-3,bedding:2}],
    ['school-review','鼠鼠学校','课桌','复习今日课程',{stamina:-3,knowledge:2}],
    ['school-share','鼠鼠学校','书柜','整理分享书籍',{stamina:-4,knowledge:1,mood:3}],
    ['memorial-sort','纪念馆','相册展柜','整理纪念相册',{stamina:-3,mood:3}],
    ['memorial-flower','纪念馆','纪念物展柜','摆放纪念鲜花',{seeds:-2,mood:4}],
    ['funeral-prepare','殡仪馆','送别用品柜','整理送别用品',{stamina:-4,mood:2}],
    ['funeral-message','殡仪馆','告别台','留下温柔寄语',{mood:2},'在生活记录里保存你的寄语'],
    ['park-stretch','跑轮公园','热身栏杆','伸展热身',{stamina:-5,health:1,mood:2},'',[-1,.75]],
    ['park-rest','跑轮公园','公园长椅','坐下歇息',{stamina:5,mood:2},'每日一次，恢复5点体力',[1,1]],
    ['garden-water','小菜园','浇水壶','给菜地浇水',{stamina:-4},'生长进度提前1个现实小时',[-1,1]],
    ['garden-weed','小菜园','菜畦','除草照料',{stamina:-5,knowledge:1,mood:2},'生长进度提前1个现实小时',[1,1]],
    ['plaza-clean','中心广场','喷泉','整理广场',{stamina:-5,seeds:2,mood:2},'居民感谢你的照料',[1.5,0]],
    ['plaza-relax','中心广场','广场长椅','听听小镇故事',{stamina:3,knowledge:1,mood:2},'',[-2,1.3]],
    ['cemetery-clean','墓地','墓碑','清扫纪念墓碑',{stamina:-4,mood:2},'',[-.9,.8]],
    ['cemetery-flower','墓地','纪念墙','献花纪念',{seeds:-2,mood:3},'记录对小镇故友的纪念',[0,-1.1]]
  ].map(([id,place,object,title,effects,note='',point])=>({id,place,object,title,effects,note,point}));
  const names={stamina:'体力',mood:'心情',health:'健康',fullness:'饱腹',seeds:'瓜子',food:'粮食',vegetables:'蔬菜',bedding:'垫料',knowledge:'知识'};
  function description(a){return Object.entries(a.effects).map(([k,v])=>names[k]+' '+(v>0?'+':'')+v).join('，')+'；每个小镇日一次'+(a.note?'。'+a.note:'')}
  function perform(input,id,time=Date.now(),message=''){
    const a=actions.find(a=>a.id===id);if(!a)return {state:input,ok:false,message:'未找到这个互动。'};
    const state=JSON.parse(JSON.stringify(input)),date=new Date(state.calendarTime).toISOString().slice(0,10);
    if(state.hospitalStay)return {state:input,ok:false,message:'鼠鼠正在住院休养，出院后再进行活动。'};
    if(id==='clinic-emergency'&&state.health>=60)return {state:input,ok:false,message:'健康达到60以上，无需急诊，可选择检查或普通诊疗。'};
    if(!state.alive)return {state:input,ok:false,message:'请先选择新的鼠鼠伙伴。'};
    if(state.placeInteractions?.[id]===date)return {state:input,ok:false,message:'今天已经完成过了，明天再来吧。'};
    const inventory=state.plaza?.inventory||{};
    const value=k=>k==='vegetables'||k==='bedding'?inventory[k]||0:k==='knowledge'?state.school?.knowledge||0:state[k]||0;
    for(const [k,v] of Object.entries(a.effects))if(v<0&&value(k)<-v)return {state:input,ok:false,message:names[k]+'不足，需要 '+(-v)+'。'};
    if(id==='funeral-message'&&!message.trim())return {state:input,ok:false,message:'寄语不能为空。'};
    state.plaza={...state.plaza,inventory:{...inventory}};state.school={...state.school};
    for(const [k,v] of Object.entries(a.effects)){const n=value(k)+v;if(k==='vegetables'||k==='bedding')state.plaza.inventory[k]=n;else if(k==='knowledge')state.school.knowledge=n;else state[k]=['stamina','mood','health','fullness'].includes(k)?Math.min(100,n):n}
    if(id==='garden-water'||id==='garden-weed')state.garden.plantedAt-=3600000;
    if(id==='clinic-hospital'){state.hospitalStay={until:state.calendarTime+6*3600000};state.currentActivity='住院';state.currentPlace='诊所';state.sleepRequested=false}
    state.placeInteractions={...state.placeInteractions,[id]:date};
    if(!('stamina' in a.effects))state.stamina=Math.max(0,state.stamina-2);root.TownSimulation.spendStamina(state,0);let text=a.title+'完成。';if(id==='clinic-check')text='检查结果：健康 '+Math.round(state.health)+'，饱腹 '+Math.round(state.fullness)+'，水质 '+(state.water<=0?'缺水':root.TownSimulation.waterStatus(state,time).quality)+'。';
    if(id==='funeral-message')text='留下寄语：'+message.trim().slice(0,80);
    state.events=[...(state.events||[]),{id:time+'-'+id,time,type:'activity',mainId:state.mainId,text:state.mainName+'：'+text,place:a.place}].slice(-80);
    return {state,ok:true,message:text+' '+description(a)};
  }
  function settleHospital(state,time){if(!state.hospitalStay||time<state.hospitalStay.until)return false;delete state.hospitalStay;state.health=Math.min(100,state.health+25);state.stamina=Math.min(100,state.stamina+20);state.events=[...(state.events||[]),{id:Date.now()+'-discharge',time:Date.now(),type:'activity',mainId:state.mainId,text:state.mainName+'住院休养结束，健康+25、体力+20。',place:'诊所'}].slice(-80);return true}
  root.TownInteractions={actions,description,perform,settleHospital};
})(typeof window==='undefined'?globalThis:window);
