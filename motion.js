// Adapted from LemoLab halftone-dossier, MIT, commit c4bc370.
// Retained mechanisms: rotated density-field dots, stamp overshoot, volume-preserving glyph squash.
// Full source attribution and license live in ../vendor/claude-motion/ and WEB-README.md.
const clamp=v=>Math.max(0,Math.min(1,v));
export const halftonePath = () => {
  const angle=15*Math.PI/180,step=32;
  let path='';
  for(let i=-40;i<=40;i++)for(let j=-40;j<=40;j++){
    const x=960+i*step*Math.cos(angle)-j*step*Math.sin(angle);
    const y=540+i*step*Math.sin(angle)+j*step*Math.cos(angle);
    if(x<-step||x>1952||y<-step||y>1112)continue;
    const density=clamp(Math.hypot(x-960,y-540)/1000-.2);
    if(density<.05)continue;
    const r=+(density*step*.62).toFixed(1);
    path+=`M${(x-r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0`;
  }
  return path;
};
export const stampKeyframes = () => Array.from({length:22},(_,i)=>{
  const t=i/21,p=clamp(t/.18),after=Math.max(0,t-.18);
  const scale=(2.6-1.6*p*p)*(1+.05*Math.sin(after*30)*Math.exp(-after*9));
  return {offset:t,transform:`rotate(-8deg) scale(${scale})`,opacity:i?1:0};
});
export const glyphKeyframes = () => Array.from({length:18},(_,i)=>{
  const p=i/17,sc=1+2.9*(p-1)**3+1.9*(p-1)**2,sq=1+.25*Math.sin(p*Math.PI)*(1-p);
  return {offset:p,transform:`translateY(${60*(1-p)**3}px) scale(${sc/sq},${sc*sq})`,opacity:i?1:0};
});
