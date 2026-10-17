(()=>{'use strict';
const audio=document.querySelector('#ambient-audio'),button=document.querySelector('#sound-toggle'),control=document.querySelector('.sound-control'),slider=document.querySelector('#sound-volume'),volume=document.querySelector('.sound-volume'),label=document.querySelector('.sound-label'),error=document.querySelector('.sound-error');
let enabled=false,timer=0,revision=0;audio.volume=0;
function reflect(){button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'배경음악 끄기':'배경음악 켜기');label.textContent=enabled?'음악 끄기':'음악 켜기';volume.hidden=!enabled;control.classList.toggle('is-playing',enabled);}
function fade(target,done){clearInterval(timer);const start=audio.volume,at=performance.now();timer=setInterval(()=>{const p=Math.min(1,(performance.now()-at)/600);audio.volume=Math.max(0,Math.min(1,start+(target-start)*p));if(p===1){clearInterval(timer);if(done)done();}},35);}
button.addEventListener('click',async()=>{const turn=++revision;error.textContent='';if(enabled){enabled=false;reflect();fade(0,()=>{if(!enabled)audio.pause();});return;}try{audio.volume=0;await audio.play();if(turn!==revision)return;enabled=true;reflect();fade(Number(slider.value)/100);}catch(e){enabled=false;reflect();error.textContent='음악을 불러오지 못했습니다.';}});
slider.addEventListener('input',()=>{clearInterval(timer);if(enabled)audio.volume=Number(slider.value)/100;});
function stop(){revision++;enabled=false;clearInterval(timer);audio.pause();audio.volume=0;reflect();}
addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});reflect();
})();
