'use strict';
(() => {
  const el=document.getElementById('trip-map');if(!el)return;
  const data=JSON.parse(document.getElementById('trip-map-data').textContent);
  const root=document.querySelector('.trip-explorer'),rail=document.querySelector('.trip-reading-panel');
  const lookup=Object.fromEntries(data.locations.map(p=>[p.id,p]));
  const base=data.base_url||'/journeys/business/tanzania-2026/';
  const dayLabel=day=>day?Number(day.date.slice(5,7))+'월 '+Number(day.date.slice(8,10))+'일':'전체 일정';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const status=document.querySelector('.trip-map-status'),label=document.getElementById('trip-map-label'),placeLabel=document.getElementById('trip-map-place');
  const play=document.getElementById('trip-map-play');
  let selected=el.dataset.day||'',map,loaded=false,popup,markers=[],baseMarkers=[],timer,playing=false,activeStop=null,mode='local';
  let pointerDay='',focusDay='',previewContext=null;
  const dayFor=id=>data.days.find(day=>day.id===id);
  const duration=ms=>reduced?0:ms;
  const routeData={type:'FeatureCollection',features:[]};
  for(const day of data.days){
    for(let i=1;i<day.locations.length;i++){
      const a=lookup[day.locations[i-1]],b=lookup[day.locations[i]];if(!a||!b)continue;
      const international=a.coord[1]>0||b.coord[1]>0;
      routeData.features.push({type:'Feature',properties:{day:day.id,international},geometry:{type:'LineString',coordinates:[a.coord,b.coord]}});
    }
  }
  function previewDay(id){
    const day=dayFor(id);
    const ids=new Set((day?.stops||[]).map(stop=>stop.location_id).filter(Boolean));
    document.querySelectorAll('[data-pin-location]').forEach(pin=>pin.classList.toggle('is-preview',ids.has(pin.dataset.pinLocation)));
    document.querySelectorAll('.trip-timeline-card').forEach(card=>card.classList.toggle('is-map-preview',card.dataset.exploreDay===id));
    document.body.dataset.tripPreviewDay=day?id:'';
    if(day){
      if(!previewContext)previewContext={label:label.textContent,place:placeLabel.textContent};
      label.textContent=dayLabel(day);
      placeLabel.textContent=ids.size?[...ids].map(id=>lookup[id].name).join(' · '):'지도 위치 확인 중';
    }else if(previewContext){label.textContent=previewContext.label;placeLabel.textContent=previewContext.place;previewContext=null;}
    // Hover changes appearance only. Camera, URL and selected story are untouched.
  }
  function clearPreview(){pointerDay='';focusDay='';previewDay('');}
  document.querySelectorAll('.trip-timeline-card').forEach(card=>{
    card.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;pointerDay=card.dataset.exploreDay;previewDay(pointerDay);});
    card.addEventListener('pointerleave',()=>{pointerDay='';previewDay(focusDay);});
    card.addEventListener('focusin',()=>{focusDay=card.dataset.exploreDay;previewDay(focusDay);});
    card.addEventListener('focusout',()=>{focusDay='';previewDay(pointerDay);});
  });
  function cameraStamp(){document.body.dataset.tripCamera=JSON.stringify({center:map.getCenter().toArray(),zoom:map.getZoom()});}
  function padding(){
    return innerWidth<=700?{top:108,bottom:84,left:42,right:42}:{top:155,bottom:150,left:85,right:70};
  }
  function fitPlaces(places,animate=true,maxZoom=13){
    if(!loaded||!places.length)return;
    map.stop();const bounds=new maplibregl.LngLatBounds();places.forEach(p=>bounds.extend(p.coord));
    map.fitBounds(bounds,{padding:padding(),maxZoom,duration:animate?duration(1300):0,essential:false});
    document.body.dataset.tripMotion=animate&&!reduced?'animated':'still';
  }
  function view(which,animate=true){
    mode=which;document.querySelectorAll('[data-map-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapView===which)));
    if(loaded){map.setFilter('international-routes',which==='all'?['==',['get','international'],true]:['==',['get','day'],'none']);fitPlaces(data.locations.filter(p=>which==='all'||p.coord[1]<0),animate,13);}
  }
  function spacePins(){
    const placed=[];
    for(const marker of markers){const point=map.project(marker.getLngLat());const offsets=[[0,0],[34,0],[-34,0],[0,34],[0,-34]];
      const offset=offsets.find(([x,y])=>placed.every(p=>Math.hypot(point.x+x-p.x,point.y+y-p.y)>=31))||offsets[4];
      marker.setOffset(offset);placed.push({x:point.x+offset[0],y:point.y+offset[1]});}
  }
  function clearPopup(){if(popup){popup.remove();popup=null;}}
  function markStop(number){
    activeStop=Number(number);document.body.dataset.tripActiveStop=String(activeStop);
    document.querySelectorAll('[data-stop-number]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stopDay===selected&&Number(b.dataset.stopNumber)===activeStop)));
    document.querySelectorAll('.trip-number-pin').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.pinNumber)===activeStop)));
  }
  function focusStop(number){
    stopPlayback();const stop=dayFor(selected)?.stops.find(s=>s.number===Number(number));if(!stop)return;
    markStop(number);clearPopup();const location=lookup[stop.location_id];
    placeLabel.textContent=location?stop.label:'위치 확인 중';
    if(!loaded||!location)return;
    map.stop();map.flyTo({center:location.coord,zoom:14,duration:duration(1500),padding:{top:55,bottom:55,left:0,right:0},essential:false});
    document.body.dataset.tripMotion=reduced?'still':'animated';
    const words=document.createElement('div');words.className='trip-map-popup';words.textContent=stop.label;
    popup=new maplibregl.Popup({closeButton:false,offset:18,anchor:'bottom'}).setLngLat(location.coord).setDOMContent(words).addTo(map);
  }
  function renderPins(day){
    markers.forEach(m=>m.remove());markers=[];clearPopup();
    baseMarkers.forEach(({id,element})=>{element.hidden=Boolean(day?.stops.some(s=>s.location_id===id));});
    for(const stop of day?.stops||[]){const location=lookup[stop.location_id];if(!location)continue;
      const pin=document.createElement('button');pin.type='button';pin.className='trip-number-pin';pin.textContent=stop.number;pin.dataset.pinNumber=stop.number;pin.dataset.pinLocation=stop.location_id;
      pin.setAttribute('aria-label',stop.label+' 지도에서 보기');pin.title=stop.label;pin.addEventListener('click',()=>focusStop(stop.number));
      markers.push(new maplibregl.Marker({element:pin}).setLngLat(location.coord).addTo(map));}
    spacePins();markStop(0);
  }
  function showDay(id,{animate=true,push=true,scroll=true}={}){
    clearPreview();const day=dayFor(id);selected=day?id:'';el.dataset.day=selected;document.body.dataset.tripSelectedDay=selected;
    document.querySelector('.trip-timeline').hidden=Boolean(day);
    document.querySelectorAll('[data-story-day]').forEach(panel=>panel.hidden=panel.dataset.storyDay!==selected);
    label.textContent=dayLabel(day);
    const known=(day?.stops||[]).map(s=>lookup[s.location_id]).filter(Boolean);
    placeLabel.textContent=day&&!known.length?'지도 위치 확인 중':day?known.length+'곳의 기록':(data.region||'다르에스살람 · 두바이');
    if(scroll)rail.scrollTop=0;
    if(push){history.pushState({tripDay:selected},'',base+(selected?selected+'/':''));document.title=(day?day.title:data.title)+' · Maestro for You';}
    if(!loaded)return;
    renderPins(day);map.setFilter('selected-route',['all',['==',['get','international'],false],['==',['get','day'],selected||'none']]);
    map.setFilter('international-routes',mode==='all'?['==',['get','international'],true]:['==',['get','day'],'none']);
    if(!day)view('local',animate);
    else if(known.length){const local=known.filter(p=>p.coord[1]<0);fitPlaces(local.length?local:known,animate,13.5);}
  }
  function stopPlayback(){clearTimeout(timer);playing=false;play.textContent='▷ 일정 따라보기';play.setAttribute('aria-pressed','false');}
  function playDays(){
    if(playing){stopPlayback();return;}playing=true;play.textContent='Ⅱ 따라보기 멈춤';play.setAttribute('aria-pressed','true');
    let index=0;
    function next(){if(!playing)return;if(index>=data.days.length){stopPlayback();return;}
      showDay(data.days[index++].id,{animate:true,push:false});timer=setTimeout(next,reduced?3200:4400);}
    next();
  }
  document.querySelectorAll('[data-explore-day]').forEach(link=>link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();stopPlayback();showDay(link.dataset.exploreDay);}));
  document.querySelectorAll('[data-stop-number]').forEach(button=>button.addEventListener('click',()=>focusStop(button.dataset.stopNumber)));
  document.querySelectorAll('[data-map-view]').forEach(button=>button.addEventListener('click',()=>{stopPlayback();clearPopup();view(button.dataset.mapView);}));
  play.addEventListener('click',playDays);
  const expand=document.getElementById('trip-map-fullscreen');
  function setExpanded(value){root.classList.toggle('is-expanded',value);expand.setAttribute('aria-pressed',String(value));expand.textContent=value?'원래 크기 ↙':'확대 보기 ⛶';if(loaded)requestAnimationFrame(()=>map.resize());}
  expand.addEventListener('click',()=>setExpanded(!root.classList.contains('is-expanded')));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){setExpanded(false);stopPlayback();}});
  window.addEventListener('popstate',()=>{stopPlayback();const id=location.pathname.startsWith(base)?location.pathname.slice(base.length).split('/')[0]:'';showDay(dayFor(id)?id:'',{push:false});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
  const lightbox=document.querySelector('.trip-lightbox');
  document.querySelectorAll('[data-open-photo]').forEach(link=>link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();stopPlayback();
    const img=lightbox.querySelector('img');img.src=link.href;img.alt=link.dataset.caption;lightbox.querySelector('p').textContent=link.dataset.caption;lightbox.showModal();}));
  lightbox.querySelector('button').addEventListener('click',()=>lightbox.close());
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
  showDay(selected,{push:false,animate:false});
  try{
    map=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/liberty',center:[39.28,-6.78],zoom:11,attributionControl:true});
    map.scrollZoom.disable();map.dragRotate.disable();map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');map.addControl(new maplibregl.ScaleControl({maxWidth:90,unit:'metric'}),'bottom-left');
    map.on('load',()=>{
      map.addSource('routes',{type:'geojson',data:routeData});
      map.addLayer({id:'all-routes',type:'line',source:'routes',filter:['==',['get','international'],false],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#91a99b','line-width':3,'line-opacity':.65}});
      map.addLayer({id:'international-routes',type:'line',source:'routes',filter:['==',['get','day'],'none'],paint:{'line-color':'#bc9362','line-width':2,'line-dasharray':[3,3],'line-opacity':.8}});
      map.addLayer({id:'selected-route',type:'line',source:'routes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#24644f','line-width':4},filter:['all',['==',['get','international'],false],['==',['get','day'],'none']]});
      for(const location of data.locations){const pin=document.createElement('button');pin.type='button';pin.className='trip-base-pin';pin.dataset.pinLocation=location.id;pin.title=location.name;pin.setAttribute('aria-label',location.name);
        pin.addEventListener('click',()=>{stopPlayback();const day=data.days.find(d=>d.stops.some(s=>s.location_id===location.id));if(day){showDay(day.id);const stop=day.stops.find(s=>s.location_id===location.id);focusStop(stop.number);}});
        new maplibregl.Marker({element:pin}).setLngLat(location.coord).addTo(map);baseMarkers.push({id:location.id,element:pin});}
      loaded=true;status.hidden=true;document.body.dataset.tripMapReady='true';
      const pendingPreview={pointerDay,focusDay};
      showDay(selected,{push:false,animate:false,scroll:false});
      pointerDay=pendingPreview.pointerDay;focusDay=pendingPreview.focusDay;previewDay(pointerDay||focusDay);cameraStamp();
      map.on('moveend',cameraStamp);map.on('move',spacePins);map.on('resize',spacePins);
      map.on('dragstart',stopPlayback);map.on('zoomstart',event=>{if(event.originalEvent)stopPlayback();});
    });
    map.on('error',()=>{if(!loaded)status.textContent='지도 연결을 기다리고 있습니다. 오른쪽에서 기록과 사진을 볼 수 있습니다.';});
    new ResizeObserver(()=>{if(loaded)map.resize();}).observe(el);
  }catch(error){status.textContent='이 브라우저에서는 지도를 표시하지 못했습니다. 기록과 사진은 계속 볼 수 있습니다.';}
})();
