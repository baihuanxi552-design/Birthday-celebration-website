import {assetNames,clamp,comicState,lensGeometry} from './logic.js';
import {halftonePath,stampKeyframes,glyphKeyframes} from './motion.js';
import {SoundEffects} from './sound.js?v=20261018-8';
import {giftLoading} from './loading.js?v=20261018-v2';
import {revealPlayback} from './reveal.js?v=20261018-v2';

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
document.addEventListener('visibilitychange',()=>{if(document.hidden){sfx.stopAll();$('#birthday-film').pause();introVideo.pause();revealVideo.pause();}});
window.addEventListener('pagehide',()=>{sfx.stopAll();$('#birthday-film').pause();introVideo.pause();revealVideo.pause();playback.stop();if(phase==='revealing'){continueReveal.hidden=false;revealStatus.textContent='回来了！点继续播放，或直接入馆。';}});
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
  phase='entering';$('#gift-open').disabled=true;$('#quick-enter').disabled=true;playback.stop();introVideo.pause();revealVideo.pause();hud.hidden=true;
  curtain.hidden=false;
  if(!reduced.matches){
    $('.entry-badge').animate(stampKeyframes(),{duration:520,fill:'both'});
    await curtain.animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:320,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'both'}).finished.catch(()=>{});
  }
  // Move the covered curtain out of the modal before closing it, in the same paint.
  document.body.append(curtain);if(intro.open)intro.close();museum.hidden=false;museum.inert=false;
  $('#gift-loading').hidden=true;try{localStorage.setItem('510-visited','1');}catch{}
  document.body.classList.remove('gate-active');window.scrollTo({top:0,behavior:'instant'});
  celebrate($('#celebration'));playSound('celebrate');
  if(!reduced.matches){
    $('.hero-copy').animate([{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'cubic-bezier(.34,1.56,.64,1)'});
    await curtain.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],{delay:240,duration:420,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'}).finished.catch(()=>{});
  }
  curtain.hidden=true;phase='entered';
  const title=$('#hero-title');title.tabIndex=-1;title.focus({preventScroll:true});
}
const openIntro=()=>{
  for(const video of [introVideo,revealVideo])if(!video.getAttribute('src')){video.src=video.dataset.preloadSrc;video.load();}
  phase='masked';playback.reset();reveal.disabled=false;hud.hidden=true;continueReveal.hidden=true;
  intro.classList.remove('revealing','reveal-playing','playback-blocked');$('#reveal-progress').value=0;
  $('.live-tag').textContent='● 神秘寿星 / 身份待确认';
  introVideo.currentTime=0;revealVideo.currentTime=0;document.body.classList.add('gate-active');intro.showModal();
  if(!reduced.matches)intro.animate([{opacity:0},{opacity:1}],{duration:300});
  introVideo.play().catch(()=>{$('#intro-status').textContent='点下按钮，即可开始播放并解锁510。';});
};
resolveMedia=giftLoading(()=>{if(phase==='masked')openIntro();},()=>playSound('unseal'));
try{$('#quick-enter').hidden=localStorage.getItem('510-visited')!=='1';}catch{}
$('#quick-enter').addEventListener('click',()=>{playSound('tap');enterMuseum();});
$('#skip-intro').addEventListener('click',enterMuseum);
$('#replay-intro').addEventListener('click',()=>{film.pause();openIntro();});
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

let modalScroll=0;
const syncModalBody=()=>{
  const open=!!document.querySelector('dialog[open]:not(#intro)');
  if(open&&!document.body.classList.contains('modal-open')){modalScroll=window.scrollY;document.body.style.top=`-${modalScroll}px`;}
  const wasOpen=document.body.classList.contains('modal-open');document.body.classList.toggle('modal-open',open);
  if(!open&&wasOpen){document.body.style.top='';window.scrollTo({top:modalScroll,behavior:'instant'});}
};
const openDialog=dialog=>{if(dialog.open)return;dialog.showModal();syncModalBody();};
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
  $('#power').setAttribute('aria-valuetext',`精神电量 ${state.battery}%，${state.text}`);
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
const lensPoint=event=>{const r=stage.getBoundingClientRect();showLens(event.clientX-r.left-stage.clientLeft,event.clientY-r.top-stage.clientTop);};
stage.addEventListener('pointerdown',event=>{
  if(locked||event.pointerType!=='touch')return;
  touchStart={x:event.clientX,y:event.clientY,axis:null};
});
stage.addEventListener('pointermove',event=>{
  if(locked)return;
  if(event.pointerType==='touch'){
    if(!touchStart)return;
    const dx=Math.abs(event.clientX-touchStart.x),dy=Math.abs(event.clientY-touchStart.y);
    if(!touchStart.axis&&Math.max(dx,dy)>10)touchStart.axis=dy>dx?'vertical':'horizontal';
    if(touchStart.axis!=='horizontal'){if(touchStart.axis==='vertical')lens.hidden=true;return;}
  }
  const r=stage.getBoundingClientRect();let x=event.clientX-r.left-stage.clientLeft,y=event.clientY-r.top-stage.clientTop;
  const g=geometry(x,y);
  if(Math.hypot(x-g.targetX,y-g.targetY)<40){x=g.targetX;y=g.targetY;}
  showLens(x,y);
});
stage.addEventListener('pointerleave',event=>{if(!locked&&event.pointerType!=='touch')lens.hidden=true;});
stage.addEventListener('pointerup',event=>{if(touchStart&&!locked&&touchStart.axis!=='vertical')lensPoint(event);touchStart=null;});
stage.addEventListener('pointercancel',()=>{touchStart=null;if(!locked)lens.hidden=true;});
$('#lock-target').addEventListener('click',()=>{
  locked=!locked;$('#lock-target').setAttribute('aria-pressed',String(locked));
  playSound(locked?'lock':'tap');
  $('#lock-target').innerHTML=locked?'已锁定！解除狙击 <span>⌖</span>':'锁定傻狍子 ×8 <span>⌖</span>';
  if(locked){const g=geometry();showLens(g.targetX,g.targetY);}else lens.hidden=true;
});
const shakes=new WeakMap();
const shake=(target=museum)=>{
  if(reduced.matches)return;
  const mobile=window.matchMedia('(max-width:700px)').matches,amplitude=mobile?5:10;
  const surface=target;shakes.get(surface)?.cancel();
  shakes.set(surface,surface.animate(Array.from({length:17},(_,i)=>{const age=i/16,k=(1-age)**2;return {offset:age,transform:`translate(${Math.sin(i*2)*amplitude*k}px,${Math.cos(i*1.7)*amplitude*.7*k}px)`};}),{duration:mobile?480:650}));
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
  1:[
    '很久以前，510还以为这些照片不会被发现。',
    '大屏写着“很久以前”，510的传说就从这里开场。',
    '别人上台讲故事，510上台给兄弟们留素材。',
    '道德讲堂很庄严，寿星笑得很自然。',
    '故事才刚开头，兄弟已经按下快门。',
    '台上这位同学，请交代你的寿星身份。',
    '这一笑，直接入选生日博物馆开篇。',
    '大屏负责铺垫，510负责闪亮登场。',
    '摄影师：你继续讲，我继续存。',
    '很久以前是开头，黑历史归档是结局。'
  ],
  2:[
    '麦克风给我，主打一个闭眼输出。',
    '眼睛一闭，麦克风一拿，情绪价值直接拉满。',
    '一手拿麦，一手抱胸，仪式感必须到位。',
    '黄黑麦克风在手，今天这个舞台归我。',
    '看这陶醉的表情，已经进入自己的演唱会。',
    '观众还在台下，510已经沉浸在聚光灯里。',
    '这不是普通发言，这是寿星限定深情版。',
    '先别叫醒他，让他把这个情绪走完。',
    '眼神暂时下班，麦克风继续营业。',
    '摄影师抓到了：闭眼都挡不住的投入。'
  ],
  3:[
    'Windows 未激活，但我的抽象已激活！',
    '兄弟已经同框，Windows 还在等激活。',
    '台上的笑容正常运行，右下角的系统还没转正。',
    '这张合照，有兄弟，有麦克风，还有系统提醒。',
    '舞台是我们的，右下角是 Windows 的。',
    '人到齐了，麦到位了，就差一个激活码。',
    '先把这张合照拍好，激活的事下次再说。',
    '生日快乐可以大声说，激活提示也得一起入镜。',
    '以为只是兄弟同框，放大才发现隐藏彩蛋。',
    '510负责台上发挥，Windows负责角落抢镜。'
  ],
  16:[
    '别人吃火锅，我在渡劫。',
    '锅里冒的是热气，510脸上飘的是仙气。',
    '这一桌吃的是火锅，这一位拍出的是仙侠。',
    '人还坐在饭桌前，脸已经进入云端。',
    '汤底开了，寿星的仙气也到位了。',
    '摄影师刚按快门，火锅先给510加了特效。',
    '天然蒸汽滤镜，一锅就能安排。',
    '没有修图，全靠锅里的热气配合。',
    '兄弟们在涮菜，510在吞云吐雾。',
    '这顿饭的隐藏菜单：火锅大仙限定皮肤。'
  ],
  17:[
    '奖牌在手，得意的小表情藏都藏不住。',
    '请看清楚：510今天可是有奖牌的人！',
    '奖牌拿好了，笑容也已经准备好了。',
    '坐在看台上，也挡不住这份小骄傲。',
    '来，镜头靠近一点，奖牌必须拍清楚。',
    '嘴角说低调，手里的奖牌可不同意。',
    '这一刻，寿星和他的奖牌都很上镜。',
    '别人看比赛，兄弟们看510展示战利品。',
    '这个表情翻译一下：看见我的奖牌了吗？',
    '生日博物馆认证：有牌面的男人。'
  ]
};
const quoteTimers=new Map();
const removeQuote=quote=>{clearTimeout(quoteTimers.get(quote));quoteTimers.delete(quote);quote.remove();};
const clearQuotes=()=>{for(const quote of [...$('#quotes').children])removeQuote(quote);};
const addQuote=()=>{
  playSound('quote');
  const box=$('#quotes'),lines=quotes[currentSpeech];
  for(let i=0;i<2;i++){
    if(box.children.length>=2)removeQuote(box.firstElementChild);
    const quote=document.createElement('div');quote.className='quote';quote.textContent=lines[quoteIndex%lines.length];
    quote.style.top=`${8+(quoteIndex%2)*47}%`;quote.style.animationDelay=`${i*.65}s`;quoteIndex++;box.append(quote);
    quote.addEventListener('animationend',()=>removeQuote(quote),{once:true});
    quoteTimers.set(quote,setTimeout(()=>removeQuote(quote),reduced.matches?6000:8000));
  }
};
document.querySelectorAll('[data-speech]').forEach(button=>button.addEventListener('click',()=>{
  currentSpeech=Number(button.dataset.speech);quoteIndex=0;clearQuotes();
  const id=Number(button.dataset.speech);$('#speech-image').src=asset(id);$('#speech-image').srcset=resolveMedia(`assets/previews/${assetNames[id].replace(/\.(jpg|png)$/i,'.jpg')}`);$('#speech-image').alt=labels[id];$('#speech-original').dataset.view=id;
  $('#speech-index').textContent=`EXHIBIT ${String(id).padStart(2,'0')} / ${speechNames[id]}`;
  document.querySelectorAll('[data-speech]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));addQuote();
}));
$('#quote-button').addEventListener('click',addQuote);
$('#watermark').addEventListener('click',()=>{openDialog($('#watermark-dialog'));playSound('proof');});

const failedPhotos=new Set();
const photoNotice=()=>{$('#media-notice').hidden=!failedPhotos.size;};
document.addEventListener('error',event=>{const image=event.target;if(image.tagName!=='IMG')return;image.classList.add('photo-failed');failedPhotos.add(image);photoNotice();},true);
document.addEventListener('load',event=>{const image=event.target;if(image.tagName!=='IMG')return;image.classList.remove('photo-failed');failedPhotos.delete(image);photoNotice();},true);
document.querySelectorAll('[data-retry-photos]').forEach(button=>button.addEventListener('click',()=>{for(const image of failedPhotos){const src=image.getAttribute('src'),set=image.getAttribute('srcset');image.removeAttribute('src');image.removeAttribute('srcset');if(set)image.srcset=set;image.src=src;} }));
const film=$('#birthday-film');
let filmEndTimer;
const finishFilm=()=>{clearInterval(filmEndTimer);if(!film.paused)film.pause();$('#play-film').innerHTML='再来一遍，快乐加倍 <span>↻</span>';$('#cinema-status').textContent='正片结束，往下还有兄弟们的生日祝福。';};
const checkFilmEnd=()=>{if(!film.seeking&&Number.isFinite(film.duration)&&film.duration>0&&film.currentTime>=film.duration-.03)finishFilm();};
const filmObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){film.poster=film.dataset.poster;filmObserver.disconnect();}},{rootMargin:'500px'});filmObserver.observe(film);
$('#play-film').addEventListener('click',()=>{
  if(!film.paused){film.pause();return;}
  if(!film.getAttribute('src')){film.src=film.dataset.preloadSrc;film.load();}else if(film.error)film.load();
  $('#cinema-status').textContent='正在准备放映，可使用播放器控制播放进度。';
  film.play().catch(error=>{if(error.name!=='AbortError')$('#cinema-status').textContent='播放暂未成功，点播放按钮重试，或使用播放器内的播放键。';});
});
film.addEventListener('waiting',()=>{$('#cinema-status').textContent='影片缓冲中，准备好了会继续播放。';});
film.addEventListener('playing',()=>{$('#cinema-status').textContent='正在放映：510的66秒抽象人生。';});
film.addEventListener('play',()=>{if(film.currentTime>=film.duration-.03)film.currentTime=0;clearInterval(filmEndTimer);filmEndTimer=setInterval(checkFilmEnd,400);sfx.stopAll();$('#play-film').innerHTML='暂停一下，让寿星缓缓 <span>Ⅱ</span>';$('#cinema-status').textContent='正在放映：510的66秒抽象人生。';});
film.addEventListener('pause',()=>{clearInterval(filmEndTimer);$('#play-film').innerHTML='继续观看生日大片 <span>▶</span>';});
film.addEventListener('ended',finishFilm);
film.addEventListener('timeupdate',checkFilmEnd);
film.addEventListener('error',()=>{clearInterval(filmEndTimer);$('#cinema-status').textContent='正片未加载成功，点播放按钮重新加载。';});

function celebrate(layer){
  layer.replaceChildren();if(reduced.matches)return;
  const count=layer.id==='final-confetti'?26:window.matchMedia('(max-width:700px), (pointer:coarse)').matches?40:92;
  for(let i=0;i<count;i++){
    const p=document.createElement('i');p.className=`confetti${i%9===0?' head':''}`;
    const colors=['#ffe24b','#ff5b45','#365dff','#beedbe','#ffb9d7'];
    p.style.cssText=`left:${(i*37)%101}%;--duration:${3.4+(i%7)*.2}s;--delay:${(i%11)*.065}s;--drift:${Math.sin(i*2.39)*180}px;--rotation:${(i%2?1:-1)*(250+i*11)}deg;background-color:${colors[i%5]};`;
    if(i%9===0)p.style.backgroundImage='url("assets/previews/12_sleep_face.jpg")';
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

$('#back-exhibits').addEventListener('click',()=>{const returnToExhibits=()=>{$('#exhibits').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});$('#exhibits-title').tabIndex=-1;$('#exhibits-title').focus({preventScroll:true});};$('#blessing').addEventListener('close',returnToExhibits,{once:true});$('#blessing').close();});

window.addEventListener('pagehide',()=>{clearQuotes();clearTimeout(glitchTimer);$('#glitch-photo').classList.remove('glitching');$('#police-overlay').hidden=true;});
