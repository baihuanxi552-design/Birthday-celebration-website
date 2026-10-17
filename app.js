import {assetNames,clamp,comicState,lensGeometry} from './logic.js';
import {halftonePath,stampKeyframes,glyphKeyframes} from './motion.js';
import {SoundEffects} from './sound.js';
import {giftLoading} from './loading.js?v=20261018-7';
import {revealPlayback} from './reveal.js?v=20261018-6';

const $=selector=>document.querySelector(selector);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let resolveMedia=url=>url;
const asset=id=>resolveMedia(`assets/${assetNames[id]}`);
const intro=$('#intro'),introVideo=$('#intro-video'),revealVideo=$('#reveal-video'),reveal=$('#reveal'),museum=$('#museum');
let phase='masked',muted=false,unsealed=false,suited=false,locked=false,quoteIndex=0,powerPhase=0,currentSpeech=1;
const sfx=new SoundEffects();
const playSound=name=>sfx.play(name).catch(()=>{$('#sound-status').textContent='音效暂未开启，请点声音开关重试。';});
const syncSoundUI=()=>document.querySelectorAll('[data-sound-toggle]').forEach(button=>{
  button.textContent=muted?'声音：关':'声音：开';button.setAttribute('aria-pressed',String(!muted));
});
const setMuted=value=>{
  muted=value;sfx.setEnabled(!muted);introVideo.muted=muted;revealVideo.muted=muted;$('#birthday-film').muted=muted;syncSoundUI();
};
syncSoundUI();
document.querySelectorAll('[data-sound-toggle]').forEach(button=>button.addEventListener('click',()=>{
  setMuted(!muted);if(!muted)playSound('tap');
  if(intro.open&&(phase==='masked'||phase==='revealing'))(phase==='revealing'?revealVideo:introVideo).play().catch(()=>{$('#intro-status').textContent='请再点一次声音按钮开启视频声音。';});
}));
$('#power').addEventListener('pointerdown',()=>{if(!muted)sfx.unlock().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(document.hidden)sfx.stopAll();});
const labels={1:'很久以前，大师登场',2:'麦克风到手，世界我有',3:'系统未激活，抽象已激活',4:'禁止倒卖游戏币，510在旁边笑',5:'专业装备：黑手套',6:'魔方在手，笑容我有',7:'笑到画质崩坏',8:'宿舍上铺认真看书',9:'纯情二次元乖宝宝',10:'搭肩欢笑的兄弟们',12:'镇馆之宝：510的死亡睡颜',13:'思考人生',14:'当场断电',15:'保安和蓝伞之间的野生510',16:'火锅大仙吞云吐雾',17:'510和他的奖牌',18:'一回头，兄弟都在',19:'五兄弟西装合照，510在最右',20:'这一刻我们彼此相爱'};

$('.halftone path').setAttribute('d',halftonePath());
$('.entry-dots path').setAttribute('d',halftonePath());
intro.addEventListener('cancel',event=>event.preventDefault());
const hud=$('#reveal-hud'),revealStatus=$('#reveal-status'),continueReveal=$('#continue-reveal');
const curtain=$('#entry-curtain');
const playback=revealPlayback(revealVideo,{
  onPlaying:()=>{
    intro.classList.add('reveal-playing');intro.classList.remove('playback-blocked');introVideo.pause();continueReveal.hidden=true;
    revealStatus.textContent='头套拆卸中，真容马上揭晓……';
  },
  onProgress:value=>{
    $('#reveal-progress').value=Math.round(value*100);
    if(value>.48){
      $('.live-tag').textContent='● 真容已揭晓 / 今日寿星 510';
      if(!intro.classList.contains('playback-blocked'))revealStatus.textContent='就是他！今日大寿星：510！';
    }
  },
  onBlocked:reason=>{
    intro.classList.add('playback-blocked');
    continueReveal.hidden=false;
    revealStatus.textContent=reason==='error'?'视频播放遇到问题，可以直接入馆。':'播放暂时停住了，点继续播放，或直接入馆。';
  },
  onFinish:()=>enterMuseum()
});
async function enterMuseum(){
  if(phase==='entering'||phase==='entered')return;
  phase='entering';playback.stop();introVideo.pause();revealVideo.pause();hud.hidden=true;
  curtain.hidden=false;
  if(!reduced.matches){
    $('.entry-badge').animate(stampKeyframes(),{duration:520,fill:'both'});
    await curtain.animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:320,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'both'}).finished.catch(()=>{});
  }
  // Move the covered curtain out of the modal before closing it, in the same paint.
  document.body.append(curtain);intro.close();museum.inert=false;
  document.body.classList.remove('gate-active');
  celebrate($('#celebration'));playSound('celebrate');
  if(!reduced.matches){
    $('.hero-copy').animate([{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'cubic-bezier(.34,1.56,.64,1)'});
    await curtain.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],{delay:240,duration:420,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'}).finished.catch(()=>{});
  }
  curtain.hidden=true;phase='entered';
  const title=$('#hero-title');title.tabIndex=-1;title.focus({preventScroll:true});
}
resolveMedia=giftLoading(()=>{
  intro.showModal();
  if(!reduced.matches)intro.animate([{opacity:0},{opacity:1}],{duration:300});
  introVideo.play().catch(()=>{$('#intro-status').textContent='点下按钮，即可开始播放并解锁510。';});
},()=>playSound('unseal'));
introVideo.addEventListener('error',()=>{
  if(phase!=='masked')return;
  $('#intro-retry').hidden=false;
  $('#intro-status').textContent='开场视频暂未播放，可重试或直接点击揭面。';
});
$('#intro-retry').addEventListener('click',()=>{
  $('#intro-retry').hidden=true;introVideo.load();
  introVideo.play().catch(()=>{$('#intro-status').textContent='请点击揭面按钮开始播放。';});
});
reveal.addEventListener('click',()=>{
  if(phase!=='masked')return;
  phase='revealing';reveal.disabled=true;hud.hidden=false;
  playSound('reveal');intro.classList.add('revealing');
  revealVideo.muted=muted;playback.start();
});
continueReveal.addEventListener('click',()=>{
  revealStatus.textContent='正在恢复播放……';revealVideo.muted=muted;playback.resume();
});
$('#enter-museum').addEventListener('click',()=>enterMuseum());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)playback.check();});

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
// Position accessories in the photo's contain rectangle, excluding the card and letterbox.
const portrait=$('.flip-face.front img'),accessories=$('.portrait-overlays');
const alignAccessories=()=>{
  if(!portrait.naturalWidth||!portrait.clientWidth)return;
  const scale=Math.min(portrait.clientWidth/portrait.naturalWidth,portrait.clientHeight/portrait.naturalHeight);
  const width=portrait.naturalWidth*scale,height=portrait.naturalHeight*scale;
  Object.assign(accessories.style,{width:`${width}px`,height:`${height}px`,left:`${portrait.offsetLeft+(portrait.clientWidth-width)*.5}px`,top:`${portrait.offsetTop+(portrait.clientHeight-height)*.4}px`});
};
portrait.addEventListener('load',alignAccessories);new ResizeObserver(alignAccessories).observe(portrait);alignAccessories();
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
const quotes={
  1:['很久以前，510还以为这些照片不会被发现。','大屏写着“很久以前”，510的传说就从这里开场。'],
  2:['麦克风给我，主打一个闭眼输出。','眼睛一闭，麦克风一拿，情绪价值直接拉满。'],
  3:['Windows 未激活，但我的抽象已激活！','兄弟已经同框，Windows 还在等激活。'],
  16:['别人吃火锅，我在渡劫。','锅里冒的是热气，510脸上飘的是仙气。'],
  17:['奖牌在手，得意的小表情藏都藏不住。','请看清楚：510今天可是有奖牌的人！']
};
const addQuote=()=>{
  playSound('quote');
  const box=$('#quotes');if(box.children.length>=4)box.firstElementChild.remove();
  const lines=quotes[currentSpeech];
  const quote=document.createElement('div');quote.className='quote';quote.textContent=lines[quoteIndex%lines.length];quote.style.top=`${23+(quoteIndex%3)*20}%`;quoteIndex++;box.append(quote);
  quote.addEventListener('animationend',()=>quote.remove());
  if(reduced.matches)setTimeout(()=>quote.remove(),4000);
};
document.querySelectorAll('[data-speech]').forEach(button=>button.addEventListener('click',()=>{
  currentSpeech=Number(button.dataset.speech);quoteIndex=0;$('#quotes').replaceChildren();
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
film.addEventListener('play',()=>{sfx.stopAll();$('#play-film').innerHTML='暂停一下，让寿星缓缓 <span>Ⅱ</span>';$('#cinema-status').textContent='正在放映：510的66秒抽象人生。';});
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
