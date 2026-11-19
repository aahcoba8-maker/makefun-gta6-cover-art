import { createServer } from 'node:http';
import { createReadStream, mkdirSync, readFileSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo=resolve(fileURLToPath(new URL('..',import.meta.url))), app=join(repo,'app'), shots=JSON.parse(readFileSync(join(repo,'shots.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'};
const server=createServer((req,res)=>{
  let p;try{p=decodeURIComponent(new URL(req.url||'/', 'http://127.0.0.1').pathname);}catch{res.writeHead(400).end();return;}
  if(p.endsWith('/'))p+='index.html';const file=resolve(join(app,p));
  if(file!==app&&!file.startsWith(app+sep)){res.writeHead(403).end();return;}
  try{const st=statSync(file);if(!st.isFile())throw new Error();res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','content-length':st.size});createReadStream(file).pipe(res);}catch{res.writeHead(404).end('not found');}
});
const chrome='/home/hatch/shot-chrome/chrome-extracted/opt/google/chrome/chrome', temp=join(repo,'.shot-tmp.png');
mkdirSync(join(repo,'screenshots'),{recursive:true});
const py=`from PIL import Image\nimport sys\nim=Image.open(sys.argv[1]).convert('RGB')\nw,h=im.size\nscale=min(1,1280/max(w,h))\nif scale<1: im=im.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS)\nout=sys.argv[2]\nfor q in (82,74,68):\n im.save(out,'JPEG',quality=q,optimize=True,progressive=True)\n if __import__('os').path.getsize(out)<=262144: break\nprint(f'{im.width}x{im.height} {__import__("os").path.getsize(out)} bytes')\n`;
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.status!==0)throw new Error(`${cmd} failed: ${r.stderr||r.stdout}`);return r.stdout.trim();}
function runChrome(args){return new Promise((ok,no)=>{const child=spawn(chrome,args,{stdio:'ignore'});child.once('error',no);child.once('exit',code=>code===0?ok():no(new Error(`Chrome exited ${code}`)));});}
server.listen(8907,'127.0.0.1',async()=>{
  try{
    for(const item of shots){const url=`http://127.0.0.1:8907/index.html${item.query}`;
      await runChrome(['--headless=new','--disable-gpu','--no-sandbox','--no-proxy-server','--hide-scrollbars','--force-device-scale-factor=1','--virtual-time-budget=12000',`--window-size=${item.width},${item.height}`,`--screenshot=${temp}`,url]);
      const out=join(repo,'screenshots',item.name),details=run('python3',['-c',py,temp,out]);console.log(`${item.name}: ${details}`);
    }
  }catch(e){console.error(e.message);process.exitCode=1;}
  finally{try{unlinkSync(temp);}catch{}server.close();}
});
