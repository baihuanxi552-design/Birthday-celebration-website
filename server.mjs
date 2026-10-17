import {createServer} from 'node:http';
import {createReadStream,statSync,existsSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
const staticMode=Boolean(process.argv[2]);
const root=resolve(process.argv[2]??'museum'),assets=resolve('public/assets'),port=Number(process.argv[3]??5180);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4'};
const server=createServer((req,res)=>{
  let path;
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(staticMode){
      path=resolve(root,'.'+(name==='/'?'/index.html':name));if(!path.startsWith(root+sep))throw new Error('outside static site');
    }
    else if(name==='/assets/birthday-masterpiece.mp4')path=resolve('out/birthday-masterpiece.mp4');
    else if(name==='/assets/intro-loop.mp4'||name==='/assets/intro-poster.jpg')path=join(root,'generated',name.split('/').pop());
    else if(name.startsWith('/assets/')){
      path=resolve(assets,name.slice(8));if(!path.startsWith(assets+sep))throw new Error('outside assets');
    }else{
      path=resolve(root,'.'+(name==='/'?'/index.html':name));if(!path.startsWith(root+sep))throw new Error('outside museum');
    }
    if(!existsSync(path)||!statSync(path).isFile()){res.writeHead(404);res.end('Not found');return;}
    const {size}=statSync(path);
    const headers={'Content-Type':types[extname(path)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
      let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
      let end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
      if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
      if(req.method==='HEAD'){res.end();return;}createReadStream(path,{start,end}).pipe(res);
    }else{
      res.writeHead(200,{...headers,'Content-Length':size});
      if(req.method==='HEAD'){res.end();return;}createReadStream(path).pipe(res);
    }
  }catch{res.writeHead(400);res.end('Bad request');}
});
server.listen(port,'127.0.0.1',()=>console.log(`510 黑历史博物馆 Local: http://localhost:${port}`));
