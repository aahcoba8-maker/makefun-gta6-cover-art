// Serve the static app folder on port 8080 for local editing.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('./app',import.meta.url)));
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'};
createServer((req,res)=>{
  let pathname:string;
  try{pathname=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=resolve(join(root,pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  try{const st=statSync(file);if(!st.isFile())throw new Error();res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','content-length':st.size,'cache-control':'no-store'});createReadStream(file).pipe(res);}
  catch{res.writeHead(404).end('not found');}
}).listen(8080,'127.0.0.1',()=>console.log('TROPIC HEAT is on http://localhost:8080'));
