// Some embedded mobile players omit `ended`; inspect media time independently.
export function revealPlayback(video,{onPlaying=()=>{},onProgress=()=>{},onBlocked=()=>{},onFinish=()=>{},now=()=>performance.now(),schedule=setInterval,cancel=clearInterval}={}){
  let active=false,finished=false,timer,lastTime=0,lastAdvance=0,lastNotice='';
  const notice=reason=>{if(lastNotice!==reason){lastNotice=reason;onBlocked(reason);}};
  const stop=()=>{active=false;cancel(timer);};
  const finish=()=>{if(!active||finished)return;finished=true;stop();onFinish();};
  const tick=()=>{
    if(!active)return;
    const time=video.currentTime,duration=video.duration;
    if(time>lastTime+.02){lastTime=time;lastAdvance=now();lastNotice='';}
    if(Number.isFinite(duration)&&duration>0){
      onProgress(Math.min(1,time/duration));
      if(!video.seeking&&(video.ended||time>=duration-.14)){finish();return;}
    }
    if(now()-lastAdvance>2500)notice(video.paused?'paused':'stalled');
  };
  video.addEventListener('timeupdate',tick);
  video.addEventListener('ended',finish);
  video.addEventListener('error',()=>{if(active)notice('error');});
  video.addEventListener('playing',()=>{if(active){lastAdvance=now();lastNotice='';onPlaying();}});
  const play=()=>{
    // Called synchronously from the tap, before promises or metadata events.
    const attempt=video.play();
    attempt?.catch(()=>{
      if(!active)return;
      video.muted=true;
      video.play()?.catch(()=>{if(active)notice('paused');});
    });
  };
  return {
    start(){if(active||finished)return;active=true;lastTime=video.currentTime;lastAdvance=now();timer=schedule(tick,200);play();},
    resume(){if(!active)return;if(video.error)video.load();lastAdvance=now();lastNotice='';play();},
    check:tick,stop
  };
}
