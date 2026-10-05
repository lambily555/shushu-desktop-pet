(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PetIdentity=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const original={id:'main-original',name:'鼠鼠',birthDate:'2024-06-09',sex:'male',weight:'六十多克',favorite:'菜叶',trait:'亲人',coat:'three-line'};
  function town(state){return {id:state.mainId,name:state.mainName||'鼠鼠',birthDate:state.mainBirthDate,sex:state.mainSex,weight:state.mainWeight?state.mainWeight+'克':state.mainGeneration===1?'六十多克':'暂无体重记录',favorite:state.mainFavorite||'菜叶',trait:state.mainTrait||'',coat:state.mainCoat}}
  function home(settings,state){return settings?.syncTownProfile===false?{...original}:state?town(state):{...original,...settings?.townMainProfile}}
  function reference(text,name){return String(text||'').replace(/鼠鼠(?!小屋|学校|饭馆|小镇|医院|纪念馆|殡仪馆|们|餐|书籍|日历|桌面小宠)/g,(match,offset,source)=>source.startsWith(name,offset)?match:name)}
  return {original,town,home,reference}
});
