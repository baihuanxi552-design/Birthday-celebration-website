import {assetNames,clamp,comicState,lensGeometry,LOOP_END} from './logic.js';
import {halftonePath,stampKeyframes,glyphKeyframes} from './motion.js';
import {SoundEffects} from './sound.js';
import {giftLoading} from './loading.js';

const $=selector=>document.querySelector(selector);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let resolveMedia=url=>url;
const asset=id=>resolveMedia(`assets/${assetNames[id]}`);
const intro=$('#intro'),introVideo=$('#intro-video'),reveal=$('#reveal'),museum=$('#museum');
let phase='masked',muted=false,unsealed=false,suited=false,locked=false,quoteIndex=0,powerPhase=0;
const sfx=new SoundEffects();
const playSound=name=>sfx.play(name).catch(()=>{$('#sound-status').textContent='音效暂未开启，请点声音开关重试。';});
const syncSoundUI=()=>document.querySelectorAll('[data-sound-toggle]').forEach(button=>{
  button.textContent=muted?'声音：关':'声音：开';button.setAttribute('aria-pressed',String(!muted));
});
const setMuted=value=>{
  muted=value;sfx.setEnabled(!muted);introVideo.muted=muted;$('#birthday-film').muted=muted;syncSoundUI();
};
syncSoundUI();
document.querySelectorAll('[data-sound-toggle]').forEach(button=>button.addEventListener('click',()=>{
  setMuted(!muted);if(!muted)playSound('tap');
  if(intro.open)introVideo.play().catch(()=>{$('#intro-status').textContent='请再点一次声音按钮开启视频声音。';});
}));
$('#power').addEventListener('pointerdown',()=>{if(!muted)sfx.unlock().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(document.hidden)sfx.stopAll();});
const labels={1:'很久以前，大师登场',2:'麦克风到手，世界我有',3:'系统未激活，抽象已激活',4:'禁止倒卖游戏币，510在旁边笑',5:'专业装备：黑手套',6:'魔方在手，笑容我有',7:'笑到画质崩坏',8:'宿舍上铺认真看书',9:'纯情二次元乖宝宝',10:'搭肩欢笑的兄弟们',12:'镇馆之宝：510的死亡睡颜',13:'思考人生',14:'当场断电',15:'保安和蓝伞之间的野生510',16:'火锅大仙吞云吐雾',17:'510和他的奖牌',18:'一回头，兄弟都在',19:'五兄弟西装合照，510在最右',20:'这一刻我们彼此相爱'};

$('.halftone path').setAttribute('d',halftonePath());
intro.addEventListener('cancel',event=>event.preventDefault());
resolveMedia=giftLoading(()=>{
  intro.showModal();introVideo.play().catch(()=>{$('#intro-status').textContent='点下按钮，即可开始播放并解锁510。';});
});
introVideo.addEventListener('error',()=>{
  $('#intro-retry').hidden=false;
  $('#intro-status').textContent='视频未能加载，请检查本地服务并点击重试。';
  reveal.disabled=false;
});
$('#intro-retry').addEventListener('click',()=>{
  $('#intro-retry').hidden=true;introVideo.load();
  introVideo.play().catch(()=>{$('#intro-status').textContent='请点击揭面按钮开始播放。';});
});
reveal.addEventListener('click',()=>{
  if(phase==='revealing')return;
  phase='revealing';reveal.disabled=true;
  playSound('reveal');
  $('#intro-status').textContent='头套拆卸中，510即将隆重登场……';
  const resumeAt=clamp(introVideo.currentTime||0,0,LOOP_END-.05);
  introVideo.loop=false;
  // A separately trimmed loop physically contains no unveiling frames. Only this click loads the full video.
  introVideo.addEventListener('loadedmetadata',()=>{
    introVideo.currentTime=Math.min(resumeAt,introVideo.duration-.1);
    introVideo.muted=muted;
    introVideo.play().catch(()=>{
      introVideo.muted=true;
      introVideo.play().catch(()=>{reveal.disabled=false;phase='masked';$('#intro-status').textContent='浏览器暂停了播放，请再点一次揭面按钮。';});
    });
  },{once:true});
  introVideo.src=asset(11);introVideo.load();
  intro.classList.add('revealing');
});
introVideo.addEventListener('ended',()=>{
  if(phase!=='revealing')return;
  phase='entered';intro.close();introVideo.pause();
  document.body.classList.remove('gate-active');museum.inert=false;
  const title=$('#hero-title');title.tabIndex=-1;title.focus({preventScroll:true});
  celebrate($('#celebration'));
  playSound('celebrate');
});

const syncModalBody=()=>document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]:not(#intro)'));
const openDialog=dialog=>{dialog.showModal();syncModalBody();};
document.querySelectorAll('dialog:not(#intro)').forEach(dialog=>{
  dialog.addEventListener('close',syncModalBody);
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
  });
});
document.addEventListener('click',event=>{
  const close=event.target.closest('[data-close]');if(close){playSound('tap');document.getElementById(close.dataset.close).close();return;}
  const photo=event.target.closest('[data-view]');if(!photo)return;
  const id=Number(photo.dataset.view);if(!assetNames[id]||id===11)return;
  $('#lightbox-image').src=asset(id);$('#lightbox-image').alt=labels[id];
  $('#lightbox-caption').textContent=`馆藏 ${String(id).padStart(2,'0')} / ${labels[id]}`;
  openDialog($('#lightbox'));
  playSound('photo');
});

$('#change-form').addEventListener('click',()=>{
  playSound('flip');
  suited=!suited;$('#hero-flip').classList.toggle('is-suit',suited);
  $('.flip-face.front').inert=suited;$('.flip-face.back').inert=!suited;
  $('#change-form').setAttribute('aria-pressed',String(suited));
  $('#change-form').innerHTML=suited?'切回纯情二次元形态 <span>↻</span>':'切换男团西装形态 <span>↻</span>';
  $('#crown').disabled=suited;$('#glasses').disabled=suited;
});
for(const [button,selector,on,off] of [['#crown','.hero-crown','♛ 摘皇冠','♛ 戴皇冠'],['#glasses','.hero-glasses','▰ 摘墨镜','▰ 戴墨镜']]){
  $(button).addEventListener('click',()=>{
    playSound('tap');
    const visible=$(selector).hasAttribute('hidden');$(selector).toggleAttribute('hidden',!visible);
    $(button).setAttribute('aria-pressed',String(visible));$(button).textContent=visible?on:off;
  });
}
const unseal=()=>{
  if(unsealed)return;
  playSound('unseal');
  unsealed=true;$('.sleep-stage').classList.add('unsealed');$('#seal').hidden=true;
  $('#unseal').textContent='封印已解除 ✓';$('#unseal').disabled=true;$('#upright').hidden=false;
  $('#sleep-status').textContent='救命！这是什么死亡视角！点照片还能查看原始镇馆之宝。';
  $('#sleep-photo').setAttribute('aria-label','查看已解封的510睡颜原图');
  $('.sleep-stamp').hidden=false;
  if(!reduced.matches){
    $('#sleep-photo').animate([{transform:'rotate(0deg) scale(.75)'},{transform:'rotate(360deg) scale(1.12)',offset:.78},{transform:'rotate(360deg) scale(1)'}],{duration:850,easing:'cubic-bezier(.34,1.56,.64,1)'});
    $('.sleep-stamp').animate(stampKeyframes(),{duration:450});
  }
};
$('#unseal').addEventListener('click',unseal);
$('#sleep-photo').addEventListener('click',()=>{
  if(!unsealed){unseal();return;}
  $('#lightbox-image').src=asset(12);$('#lightbox-image').alt=labels[12];$('#lightbox-caption').textContent='镇馆之宝 / 510的死亡睡颜';openDialog($('#lightbox'));playSound('photo');
});
$('#upright').addEventListener('click',()=>{
  playSound('rotate');
  const upright=$('#sleep-photo').classList.toggle('upright');$('#upright').setAttribute('aria-pressed',String(upright));
  $('#upright').textContent=upright?'↻ 再次倒立，恢复原味':'↻ 一键摆正他的头';
});
$('#power').addEventListener('input',()=>{
  const value=Number($('#power').value),state=comicState(value);
  const nextPhase=value<34?0:value<78?1:2;
  if(nextPhase!==powerPhase){playSound(nextPhase===2?'shutdown':nextPhase<powerPhase?'wake':'tap');powerPhase=nextPhase;}
  document.querySelectorAll('[data-comic]').forEach((img,i)=>{
    img.style.opacity=state.opacity[i];img.style.transform=`rotate(${i===2?state.tilt:0}deg) scale(${i===2?1.12:1})`;
  });
  $('#power-value').textContent=`${value}% 断电进度`;$('#battery').textContent=`精神电量 ${state.battery}%`;
  $('#comic-state').textContent=state.text;
});

const stage=$('#peek-stage'),peek=$('#peek-image'),lens=$('#lens');
const geometry=(x=0,y=0)=>lensGeometry({width:stage.clientWidth,height:stage.clientHeight,imageWidth:peek.naturalWidth||3072,imageHeight:peek.naturalHeight||4550,x,y,lens:Math.min(180,Math.max(120,stage.clientWidth*.6))});
const updateMarker=()=>{
  const g=geometry();$('#target-marker').style.left=`${g.targetX}px`;$('#target-marker').style.top=`${g.targetY}px`;
  if(locked)showLens(g.targetX,g.targetY);
};
const showLens=(x,y)=>{
  const g=geometry(x,y);lens.hidden=false;
  const size=Math.min(180,Math.max(120,stage.clientWidth*.6));
  Object.assign(lens.style,{width:`${size}px`,height:`${size}px`,left:`${g.left}px`,top:`${g.top}px`,backgroundImage:`url("${asset(15)}")`,backgroundSize:g.backgroundSize,backgroundPosition:g.backgroundPosition});
};
peek.addEventListener('load',updateMarker);new ResizeObserver(updateMarker).observe(stage);updateMarker();
let touchStart=null;
stage.addEventListener('pointerdown',event=>{
  if(locked||event.pointerType!=='touch')return;
  const r=stage.getBoundingClientRect();touchStart={x:event.clientX,y:event.clientY};
  showLens(event.clientX-r.left-stage.clientLeft,event.clientY-r.top-stage.clientTop);
});
stage.addEventListener('pointermove',event=>{
  if(locked)return;
  if(event.pointerType==='touch'){
    if(!touchStart)return;
    if(Math.abs(event.clientY-touchStart.y)>Math.abs(event.clientX-touchStart.x)+10){lens.hidden=true;return;}
  }
  const r=stage.getBoundingClientRect();let x=event.clientX-r.left-stage.clientLeft,y=event.clientY-r.top-stage.clientTop;
  const g=geometry(x,y);
  if(Math.hypot(x-g.targetX,y-g.targetY)<40){x=g.targetX;y=g.targetY;}
  showLens(x,y);
});
stage.addEventListener('pointerleave',()=>{if(!locked)lens.hidden=true;});
for(const name of ['pointerup','pointercancel'])stage.addEventListener(name,()=>{touchStart=null;if(!locked)lens.hidden=true;});
$('#lock-target').addEventListener('click',()=>{
  locked=!locked;$('#lock-target').setAttribute('aria-pressed',String(locked));
  playSound(locked?'lock':'tap');
  $('#lock-target').innerHTML=locked?'已锁定！解除狙击 <span>⌖</span>':'锁定傻狍子 ×8 <span>⌖</span>';
  if(locked){const g=geometry();showLens(g.targetX,g.targetY);}else lens.hidden=true;
});
const shake=(target=museum)=>{
  if(reduced.matches)return;
  const mobile=window.matchMedia('(max-width:700px)').matches,amplitude=mobile?5:10;
  (mobile?target:museum).animate(Array.from({length:17},(_,i)=>{const age=i/16,k=(1-age)**2;return {offset:age,transform:`translate(${Math.sin(i*2)*amplitude*k}px,${Math.cos(i*1.7)*amplitude*.7*k}px)`};}),{duration:mobile?480:650});
};
$('#police').addEventListener('click',()=>{
  const overlay=$('#police-overlay');overlay.hidden=true;
  void overlay.offsetWidth;
  overlay.hidden=reduced.matches;shake($('.arcade-room'));playSound('police');
  $('#police-status').textContent='抽象警报！510，你已被兄弟们的镜头包围！';
});
$('#police-overlay').addEventListener('animationend',()=>{$('#police-overlay').hidden=true;});
let glitchTimer;
$('#glitch').addEventListener('click',()=>{
  const photo=$('#glitch-photo');photo.classList.remove('glitching');void photo.offsetWidth;
  photo.classList.add('glitching');shake($('.blur-room'));playSound('glitch');clearTimeout(glitchTimer);
  glitchTimer=setTimeout(()=>photo.classList.remove('glitching'),850);
  $('#glitch-status').textContent='哈哈哈哈哈！笑容已溢出，清晰度抢救失败。';
});

const speechNames={1:'很久以前',2:'深情演说',3:'Windows 未激活',16:'火锅大仙',17:'奖牌在手'};
const quotes=['Windows 未激活，但我的抽象已激活！','麦克风给我，主打一个闭眼输出。','奖牌在手，天下我有。','进可电玩城戴手套，退可火锅店吞云吐雾。','别人吃火锅，我在渡劫。','很久以前，510还以为这些照片不会被发现。'];
const addQuote=()=>{
  playSound('quote');
  const box=$('#quotes');if(box.children.length>=4)box.firstElementChild.remove();
  const quote=document.createElement('div');quote.className='quote';quote.textContent=quotes[quoteIndex%quotes.length];quote.style.top=`${23+(quoteIndex%3)*20}%`;quoteIndex++;box.append(quote);
  quote.addEventListener('animationend',()=>quote.remove());
  if(reduced.matches)setTimeout(()=>quote.remove(),4000);
};
document.querySelectorAll('[data-speech]').forEach(button=>button.addEventListener('click',()=>{
  const id=Number(button.dataset.speech);$('#speech-image').src=asset(id);$('#speech-image').srcset=resolveMedia(`assets/previews/${assetNames[id].replace(/\.(jpg|png)$/i,'.jpg')}`);$('#speech-image').alt=labels[id];$('#speech-original').dataset.view=id;
  $('#speech-index').textContent=`EXHIBIT ${String(id).padStart(2,'0')} / ${speechNames[id]}`;
  document.querySelectorAll('[data-speech]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));addQuote();
}));
$('#quote-button').addEventListener('click',addQuote);
$('#watermark').addEventListener('click',()=>{openDialog($('#watermark-dialog'));playSound('proof');});

const film=$('#birthday-film');
$('#play-film').addEventListener('click',()=>{
  if(!film.paused){film.pause();return;}
  if(film.error)film.load();
  film.play().catch(()=>{$('#cinema-status').textContent='请点击播放器内的播放按钮，或检查视频文件是否已完整加载。';});
});
film.addEventListener('play',()=>{sfx.stopAll();$('#play-film').innerHTML='暂停一下，让寿星缓缓 <span>Ⅱ</span>';$('#cinema-status').textContent='正在放映：510的35秒抽象人生。';});
film.addEventListener('pause',()=>{$('#play-film').innerHTML='继续观看生日大片 <span>▶</span>';});
film.addEventListener('ended',()=>{$('#play-film').innerHTML='再来一遍，快乐加倍 <span>↻</span>';$('#cinema-status').textContent='正片结束，往下还有兄弟们的生日祝福。';});
film.addEventListener('error',()=>{$('#cinema-status').textContent='正片未加载成功，点播放按钮重新加载。';});

function celebrate(layer){
  layer.replaceChildren();if(reduced.matches)return;
  const count=window.matchMedia('(max-width:700px), (pointer:coarse)').matches?40:92;
  for(let i=0;i<count;i++){
    const p=document.createElement('i');p.className=`confetti${i%9===0?' head':''}`;
    const colors=['#ffe24b','#ff5b45','#365dff','#beedbe','#ffb9d7'];
    p.style.cssText=`left:${(i*37)%101}%;--duration:${3.4+(i%7)*.2}s;--delay:${(i%11)*.065}s;--drift:${Math.sin(i*2.39)*180}px;--rotation:${(i%2?1:-1)*(250+i*11)}deg;background-color:${colors[i%5]};`;
    if(i%9===0)p.style.backgroundImage=`url("${asset(12)}")`;
    p.addEventListener('animationend',()=>p.remove());layer.append(p);
  }
}
$('#blow-candles').addEventListener('click',()=>{
  film.pause();playSound('birthday');
  $('.candles').classList.add('blown');openDialog($('#blessing'));celebrate($('#final-confetti'));
  if(!reduced.matches){
    const title=$('#blessing-title');title.replaceChildren();
    for(const [i,ch] of Array.from('510，生日快乐！').entries()){
      if(i===4)title.append(document.createElement('br'));
      const span=document.createElement('span');span.textContent=ch;span.style.display='inline-block';title.append(span);
      span.animate(glyphKeyframes(),{duration:430,delay:i*42,fill:'backwards'});
    }
  }
});
$('#blessing').addEventListener('close',()=>{$('.candles').classList.remove('blown');$('#final-confetti').replaceChildren();});
