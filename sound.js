// Original synthesized effects: no downloads, samples, or third-party audio service.
const note=(frequency,duration,delay=0,type='sine',gain=.2,end=frequency)=>({frequency,duration,delay,type,gain,end});
export function effectPlan(name){
  switch(name){
    case 'tap': return [note(880,.07,0,'sine',.15,1200)];
    case 'photo': return [{noise:true,duration:.09,gain:.26,filter:2500},note(180,.08,.025,'square',.09,70)];
    case 'flip': return [{noise:true,duration:.3,gain:.16,filter:1400},note(220,.25,0,'triangle',.17,880)];
    case 'unseal': return [note(85,.55,0,'sine',.4,35),note(180,.4,.08,'sawtooth',.1,950),{noise:true,duration:.18,gain:.24,filter:2200}];
    case 'rotate': return [note(700,.25,0,'triangle',.18,140),note(1100,.12,.17,'sine',.12,450)];
    case 'shutdown': return [659,523,392,262].map((f,i)=>note(f,.3,i*.12,'sine',.21));
    case 'wake': return [262,392,523,784].map((f,i)=>note(f,.17,i*.08,'sine',.16));
    case 'lock': return [note(1200,.13,0,'sine',.22),note(1600,.25,.2,'sine',.2)];
    case 'police': return [{...note(660,1.32,0,'triangle',.32),sustain:true,sweep:[660,1120,660,1120,660,1120,660,1120,660]}];
    case 'glitch': return [90,720,130,1300,60,420].map((f,i)=>note(f,.085,i*.095,'square',.11,f*.55)).concat({noise:true,duration:.6,gain:.08,filter:3500});
    case 'quote': return [note(260,.26,0,'triangle',.24,720),note(1040,.1,.16,'sine',.1,780)];
    case 'proof': return [note(660,.18,0,'triangle',.19),note(440,.3,.15,'triangle',.19),note(550,.25,.3,'triangle',.16)];
    case 'reveal': return [note(160,.45,0,'triangle',.19,850),note(70,.3,.35,'sine',.32,35)];
    case 'celebrate': return [523,659,784,1047].map((f,i)=>note(f,.5,i*.09,'triangle',.18));
    case 'birthday': return [{noise:true,duration:.45,gain:.23,filter:850},...[523,659,784,1047,784,1047].map((f,i)=>note(f,.4,.38+i*.13,'triangle',.2))];
    default: return [];
  }
}

export class SoundEffects{
  constructor(context=null){this.context=context;this.enabled=true;this.sources=new Set();this.master=null;}
  unlock(){
    if(!this.enabled)return Promise.resolve(false);
    if(!this.context){
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Audio)return Promise.resolve(false);
      this.context=new Audio();
    }
    const ctx=this.context;
    if(!this.master){
      this.master=ctx.createGain();this.master.gain.value=.65;
      const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.ratio.value=6;
      this.master.connect(limiter);limiter.connect(ctx.destination);
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*1.5),ctx.sampleRate),data=buffer.getChannelData(0);
      let seed=510;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
      this.noise=buffer;
    }
    // OfflineAudioContext is used by the real browser signal test, and must not be resumed.
    return ['suspended','interrupted'].includes(ctx.state)&&!('startRendering' in ctx)?ctx.resume().then(()=>true):Promise.resolve(ctx.state!=='closed');
  }
  setEnabled(enabled){this.enabled=enabled;if(!enabled)this.stopAll();}
  stopAll(){for(const source of this.sources){try{source.stop();}catch{ /* Already ended during a page suspension. */ }}this.sources.clear();}
  async play(name){
    if(!this.enabled||!await this.unlock()||!this.enabled)return false;
    this.stopAll();
    const ctx=this.context,start=ctx.currentTime+.008;
    for(const item of effectPlan(name)){
      const at=start+(item.delay||0),end=at+item.duration,envelope=ctx.createGain();
      envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(item.gain,at+.008);
      if(item.sustain)envelope.gain.setValueAtTime(item.gain,end-.12);
      envelope.gain.exponentialRampToValueAtTime(.0001,end);
      envelope.connect(this.master);
      let source;
      if(item.noise){
        source=ctx.createBufferSource();source.buffer=this.noise;
        const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=item.filter;source.connect(filter);filter.connect(envelope);
      }else{
        source=ctx.createOscillator();source.type=item.type;source.frequency.setValueAtTime(item.frequency,at);
        if(item.sweep)item.sweep.forEach((f,i)=>source.frequency.linearRampToValueAtTime(f,at+i*item.duration/(item.sweep.length-1)));
        else source.frequency.exponentialRampToValueAtTime(item.end,end);
        source.connect(envelope);
      }
      this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();envelope.disconnect();};
      source.start(at);source.stop(end+.015);
    }
    return true;
  }
}
