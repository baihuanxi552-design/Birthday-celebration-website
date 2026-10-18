import {stampKeyframes} from './motion.js';
// Native cache is shared with <img>; no full-video fetch or Blob URLs.
export function prepareImage(url,{createImage=()=>new Image(),timeout=8000}={}){
  return new Promise(resolve=>{
    const image=createImage();let settled=false;
    const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);image.onload=image.onerror=null;resolve({url,ok});};
    const timer=setTimeout(()=>finish(false),timeout);
    image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=url;
  });
}
export async function prepareStage(urls,{load=prepareImage,onProgress=()=>{}}={}){
  let done=0;onProgress({done,total:urls.length});
  return Promise.all(urls.map(async url=>{const result=await load(url);onProgress({done:++done,total:urls.length});return result;}));
}
export function giftLoading(onEnter,onOpen=()=>{}){
  const screen=document.querySelector('#gift-loading'),button=document.querySelector('#gift-open');
  const status=document.querySelector('#load-status'),bar=document.querySelector('#load-progress'),detail=document.querySelector('#load-detail');
  const label=button.querySelector('.gift-label'),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let opening=false;
  const prepareIntro=()=>document.querySelectorAll('#intro video').forEach(video=>{
    if(!video.getAttribute('src')){video.src=video.dataset.preloadSrc;video.preload='metadata';video.load();}
  });
  const run=async()=>{
    button.disabled=true;label.textContent='礼物打包中…';
    const results=await prepareStage(['assets/intro-poster.jpg','assets/previews/09_stand.jpg'],{onProgress:({done,total})=>{
      bar.value=done/total*100;detail.textContent=`开场准备 · ${done}/${total} 项已完成检查`;
    }});
    const failures=results.filter(result=>!result.ok);
    screen.classList.add('load-ready');button.disabled=false;label.textContent='拆开礼物 ↗';
    button.setAttribute('aria-label','拆开510的生日礼物');
    status.textContent=failures.length?'部分封面暂未就位，仍可拆礼物入馆。':'开场准备好了！点击礼物盒，510 即将登场。';
    document.querySelector('#retry-covers').hidden=!failures.length;
    detail.textContent=`开场准备 · ${results.length-failures.length}/${results.length} 项就绪${failures.length?' · 未完成项可重试':''}`;
    prepareIntro();
    if(!reduced.matches)document.querySelector('.gift-ready-stamp').animate(stampKeyframes(),{duration:500,fill:'both'});
  };
  document.querySelector('#retry-covers').addEventListener('click',run);
  button.addEventListener('click',async()=>{
    if(opening)return;opening=true;document.querySelector('#quick-enter').disabled=true;button.disabled=true;onOpen();prepareIntro();
    screen.classList.add('gift-opening');label.textContent='快乐正在拆封！';
    if(!reduced.matches)await button.querySelector('.gift-art').animate([{transform:'scale(1)',opacity:1},{transform:'scale(.92,1.08)',offset:.25},{transform:'scale(1.12,.94)',offset:.65},{transform:'scale(1.3)',opacity:0}],{duration:650,easing:'cubic-bezier(.34,1.56,.64,1)'}).finished.catch(()=>{});
    screen.hidden=true;onEnter(url=>url);
  });
  run();return url=>url;
}
