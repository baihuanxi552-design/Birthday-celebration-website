import {stampKeyframes,glyphKeyframes} from './motion.js';
// Keep compressed media in Blob URLs for this visit; original photos decode only when opened.
export async function preloadMedia(files,{fetcher=fetch,onProgress=()=>{},loaded=new Map(),concurrency=3}={}){
  const progress=new Map(files.map(f=>[f.url,loaded.has(f.url)?f.bytes:0]));
  const total=files.reduce((sum,f)=>sum+f.bytes,0);
  const report=()=>onProgress({bytes:[...progress.values()].reduce((a,b)=>a+b,0),total,done:loaded.size,count:files.length});
  const pending=files.filter(f=>!loaded.has(f.url));let cursor=0;const errors=[];
  report();
  await Promise.all(Array.from({length:Math.min(concurrency,pending.length)},async()=>{
    while(cursor<pending.length){
      const file=pending[cursor++],controller=new AbortController();let timer;
      const heartbeat=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(),60000);};
      try{
        heartbeat();const response=await fetcher(file.url,{signal:controller.signal});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const chunks=[];let received=0;
        if(response.body){
          const reader=response.body.getReader();
          for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.byteLength;progress.set(file.url,Math.min(received,file.bytes));heartbeat();report();}
        }else{const data=await response.arrayBuffer();chunks.push(data);received=data.byteLength;}
        if(received!==file.bytes)throw new Error('素材大小与清单不符');
        loaded.set(file.url,new Blob(chunks,{type:response.headers.get('content-type')||'application/octet-stream'}));
        progress.set(file.url,file.bytes);report();
      }catch(error){progress.set(file.url,0);errors.push({url:file.url,message:error.message});report();}
      finally{clearTimeout(timer);}
    }
  }));
  return {loaded,errors};
}

export function giftLoading(onEnter,onOpen=()=>{}){
  const screen=document.querySelector('#gift-loading'),button=document.querySelector('#gift-open');
  const status=document.querySelector('#load-status'),bar=document.querySelector('#load-progress'),detail=document.querySelector('#load-detail');
  const label=button.querySelector('.gift-label'),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const urls=new Map(),loaded=new Map();let ready=false;
  const resolve=url=>urls.get(url)||url;
  const run=async()=>{
    button.disabled=true;label.textContent='礼物打包中…';screen.classList.remove('load-failed');
    status.textContent='正在把 510 的黑历史装进礼物盒……';
    try{
      const response=await fetch('load-manifest.json?v=20261018-7');if(!response.ok)throw new Error('加载清单获取失败');
      const files=await response.json();
      const result=await preloadMedia(files,{loaded,onProgress:p=>{
        const percent=p.done===p.count?100:Math.min(99,Math.floor(p.bytes/p.total*100));bar.value=percent;
        detail.textContent=`${percent}% · ${(p.bytes/1048576).toFixed(1)} / ${(p.total/1048576).toFixed(1)} MB · ${p.done}/${p.count} 项`;
      }});
      if(result.errors.length)throw new Error(`${result.errors.length} 项素材未能加载`);
      for(const [url,blob] of loaded)urls.set(url,URL.createObjectURL(blob));
      document.documentElement.style.setProperty('--loaded-glitch',`url("${resolve('assets/07_blur.jpg')}")`);
      // Replace both responsive previews and original media with prepared local bytes.
      document.querySelectorAll('img').forEach(img=>{
        const src=img.getAttribute('src'),srcset=img.getAttribute('srcset');
        if(srcset&&urls.has(srcset))img.srcset=resolve(srcset);
        if(urls.has(src))img.src=resolve(src);
      });
      document.querySelectorAll('video').forEach(video=>{
        const src=video.getAttribute('data-preload-src')||video.getAttribute('src');
        if(urls.has(src)){video.src=resolve(src);video.load();}
        const poster=video.getAttribute('poster');if(urls.has(poster))video.poster=resolve(poster);
      });
      ready=true;bar.value=100;screen.classList.add('load-ready');status.textContent='全部素材已就位！点击礼物盒，510 即将登场。';
      label.textContent='拆开礼物 ↗';button.setAttribute('aria-label','拆开510的生日礼物');button.disabled=false;
      if(!reduced.matches){
        button.querySelector('.gift-art').animate(glyphKeyframes(),{duration:650});
        document.querySelector('.gift-ready-stamp').animate(stampKeyframes(),{duration:650,fill:'both'});
      }
    }catch(error){screen.classList.add('load-failed');status.textContent=`${error.message}。请检查网络后重试，已完成的素材会保留。`;label.textContent='↻ 重试加载';button.setAttribute('aria-label','重试加载未完成的素材');button.disabled=false;}
  };
  button.addEventListener('click',async()=>{
    if(!ready){run();return;}
    button.disabled=true;onOpen();screen.classList.add('gift-opening');label.textContent='快乐正在拆封！';
    if(!reduced.matches)await button.querySelector('.gift-art').animate([{transform:'scale(1)'},{transform:'scale(.9,1.12)',offset:.25},{transform:'scale(1.14,.92)',offset:.65},{transform:'scale(1.5)',opacity:0}],{duration:700,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'forwards'}).finished.catch(()=>{});
    screen.hidden=true;onEnter(resolve);
  });
  run();return resolve;
}
