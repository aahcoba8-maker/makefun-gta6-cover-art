import { renderCover, preloadCoverPhotos } from './render.js';
const demo={size:'wide',layout:'keyart',grade:'ink',gutter:10,grain:.10,vignette:true,
  panels:[{photo:'boulevard',zoom:1.3,fx:.46,fy:.26},{photo:'rooftop',zoom:1,fx:.42,fy:.32},{photo:'pier',zoom:1,fx:.45,fy:.30},{photo:'neon',zoom:1},{photo:'boulevard',zoom:1.6,x:0,y:.18},{photo:'rooftop',zoom:1.8,fx:.42,fy:.30},{photo:'boulevard',zoom:1}],
  kicker:'WELCOME TO SOLMAR BAY',title:'TROPIC HEAT',script:'solmar bay nights',tagline:'EVERY STREET TELLS A STORY',badge:{on:true,text:'NEW',sub:'SUMMER 2026'},stars:{on:true,n:5},tape:{on:true,text:'COLLECTORS EDITION'}};
const query=new URLSearchParams(location.search), shot=query.get('shot');
if(['keyart','band','slash'].includes(query.get('layout')))demo.layout=query.get('layout');
if(['ink','sunset','neon'].includes(query.get('grade')))demo.grade=query.get('grade');
if(['wide','square','portrait'].includes(query.get('size')))demo.size=query.get('size');
if(demo.layout==='band'){demo.grade='sunset';demo.panels=[{photo:'boulevard',zoom:1.05,fx:.50,fy:.30},{photo:'rooftop',zoom:1,fx:.42,fy:.30},{photo:'neon',zoom:1,fx:.50,fy:.35}];}
if(demo.layout==='slash'){demo.grade='neon';demo.panels=[{photo:'neon'},{photo:'pier'},{photo:'boulevard'}];}
window.__demoState=demo;
if(shot==='cover'){
  document.body.innerHTML='<canvas id="shot"></canvas>';document.body.style.cssText='margin:0;background:#080710;overflow:hidden';
  const sizes={wide:[1920,1080],square:[1080,1080],portrait:[1080,1350]},[W,H]=sizes[demo.size]||sizes.wide,c=document.querySelector('canvas');
  c.width=W;c.height=H;c.style.cssText='max-width:100vw;max-height:100vh;width:auto;height:auto;display:block';
  const fonts=[new FontFace('Anton','url(/fonts/Anton.ttf)'),new FontFace('Pacifico','url(/fonts/Pacifico.ttf)')];
  Promise.all([Promise.all(fonts.map(f=>f.load())),preloadCoverPhotos(demo)]).then(([fs])=>{fs.forEach(f=>document.fonts.add(f));return document.fonts.ready;}).then(()=>{renderCover(c.getContext('2d'),W,H,demo);window.__shotReady=true;}).catch(error=>{document.body.textContent=`Cover render error: ${error.message}`;document.body.style.cssText='margin:24px;background:#180c20;color:white;font:20px sans-serif';window.__shotReady=true;});
}
