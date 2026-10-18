import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareImage,prepareStage} from '../loading.js';
import {revealPlayback} from '../reveal.js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('two-item stage reports real completion, including a recoverable failure',async()=>{
 const events=[];const results=await prepareStage(['poster','hero'],{load:async url=>({url,ok:url==='hero'}),onProgress:p=>events.push(p.done)});
 assert.deepEqual(events,[0,1,2]);assert.equal(results.filter(r=>r.ok).length,1);
});
test('image timeout releases callbacks and a new attempt can succeed',async()=>{
 const image={};assert.equal((await prepareImage('cover',{createImage:()=>image,timeout:5})).ok,false);
 assert.equal(image.onload,null);const retry=prepareImage('cover',{createImage:()=>image});image.onload();assert.equal((await retry).ok,true);
});
test('gate has no Blob/full-media fetch; cinema remains on demand',()=>{
 assert.doesNotMatch(read('loading.js'),/createObjectURL|fetch\(|arrayBuffer/);
 const film=read('index.html').match(/<video id="birthday-film"[^>]*>/)[0];assert.match(film,/preload="none"/);assert.doesNotMatch(film,/\ssrc=/);
 assert.equal((read('index.html').match(/<article class="exhibit /g)||[]).length,6);
});
test('reveal reset supports replay and duplicate starts finish only once',()=>{
 const video=new EventTarget();Object.assign(video,{currentTime:0,duration:4.45,play:()=>Promise.resolve()});let finished=0;
 const player=revealPlayback(video,{schedule:()=>1,cancel:()=>{},onFinish:()=>finished++});
 player.start();player.start();video.dispatchEvent(new Event('ended'));video.dispatchEvent(new Event('ended'));assert.equal(finished,1);
 player.reset();player.start();video.dispatchEvent(new Event('ended'));assert.equal(finished,2);
});
test('all 20 original assets and the 66-second movie match the frozen baseline',()=>{
 const manifest=JSON.parse(read('verification/media-baseline.json'));assert.equal(manifest.length,21);
 for(const item of manifest){const actual=createHash('sha256').update(readFileSync(new URL('../'+item.path,import.meta.url))).digest('hex');assert.equal(actual,item.sha256,item.path);}
});
test('a user can resume reveal completion checks after page departure',()=>{
 const video=new EventTarget();Object.assign(video,{currentTime:0,duration:4.45,play:()=>Promise.resolve()});let finished=0;
 const player=revealPlayback(video,{schedule:()=>1,cancel:()=>{},onFinish:()=>finished++});
 player.start();player.stop();player.resume();video.currentTime=4.4;player.check();assert.equal(finished,1);
});
