import { renderCover, rects, PHOTOS } from './render.js';
if(new URLSearchParams(location.search).get('shot')==='cover') { /* shot renderer owns the page */ }
else {
const names=['keyart','band','slash','grid6','trio','full','story'], grades=['ink','sunset','neon','golden','noir','clean'];
const sizes={wide:[1920,1080],square:[1080,1080],portrait:[1080,1350]};
const defaults=window.__demoState||{size:'wide',layout:'keyart',grade:'ink',gutter:10,grain:.1,vignette:true,panels:[],kicker:'WELCOME TO SOLMAR BAY',title:'TROPIC HEAT',script:'solmar bay nights',tagline:'EVERY STREET TELLS A STORY',badge:{on:true,text:'NEW'},stars:{on:true,n:5},tape:{on:true,text:'COLLECTORS EDITION'}};
let state=structuredClone(defaults), selected=0, uploads=[], history=[JSON.stringify(state)], cursor=0, drag=null;
const $=id=>document.getElementById(id), canvas=$('cover'), ctx=canvas.getContext('2d');
function save(){const s=JSON.stringify(state);if(history[cursor]!==s){history=history.slice(0,cursor+1);history.push(s);cursor=history.length-1;}render();}
function sync(){const [w,h]=sizes[state.size];canvas.width=w;canvas.height=h;$('dimensions').textContent=`${w} × ${h}`;render();}
function render(){if(!canvas)return;renderCover(ctx,canvas.width,canvas.height,state);const r=rects[state.layout]?.[selected];if(r){ctx.save();ctx.strokeStyle='#ff3f9b';ctx.lineWidth=Math.max(3,canvas.width/480);ctx.strokeRect(r[0]*canvas.width+ctx.lineWidth/2,r[1]*canvas.height+ctx.lineWidth/2,r[2]*canvas.width-ctx.lineWidth,r[3]*canvas.height-ctx.lineWidth);ctx.restore();}document.querySelectorAll('.panel-control').forEach((el,i)=>el.classList.toggle('selected',i===selected));}
function buttonSet(id,values,key){const box=$(id);box.innerHTML='';for(const v of values){const b=document.createElement('button');b.textContent=v[0].toUpperCase()+v.slice(1);b.className=state[key]===v?'active':'';b.onclick=()=>{state[key]=v;box.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');save();};box.append(b);}}
buttonSet('layouts',names,'layout');buttonSet('grades',grades,'grade');
const textFields={kicker:'kicker',title:'title',script:'script',tagline:'tagline'};
for(const [id,key] of Object.entries(textFields)){$(id).value=state[key];$(id).oninput=()=>{state[key]=$(id).value;render();};$(id).onchange=save;}
function panelEditor(){const root=$('panelControls');root.innerHTML='';const count=rects[state.layout].length;
  while(state.panels.length<count)state.panels.push({photo:PHOTOS[state.panels.length%4],zoom:1,x:0,y:0});
  state.panels.slice(0,count).forEach((p,i)=>{const div=document.createElement('div');div.className='panel-control'+(i===selected?' selected':'');const title=document.createElement('b');title.textContent=`Panel ${String(i+1).padStart(2,'0')}`;div.append(title);
    const photo=document.createElement('select');const opts=[...PHOTOS,...uploads.map((u,j)=>`upload:${j}`)];opts.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v.startsWith('upload:')?uploads[+v.split(':')[1]].name:v;photo.append(o);});photo.value=p.photo?.startsWith('data:')?`upload:${uploads.findIndex(u=>u.url===p.photo)}`:p.photo;photo.onchange=()=>{p.photo=photo.value.startsWith('upload:')?uploads[+photo.value.split(':')[1]].url:photo.value;selected=i;save();};div.append(photo);
    const grade=document.createElement('select');['Global',...grades].forEach(v=>{const o=document.createElement('option');o.value=v==='Global'?'':v;o.textContent=v;grade.append(o);});grade.value=p.grade||'';grade.onchange=()=>{p.grade=grade.value||null;save();};div.append(grade);div.onclick=()=>{selected=i;render();};root.append(div);});
}
function syncControls(){panelEditor();$('size').value=state.size;for(const [id,key] of [['badgeOn','badge'],['starsOn','stars'],['tapeOn','tape'],['vignetteOn','vignette']])$(id).checked=key==='vignette'?state[key]!==false:!!state[key]?.on;
  $('grainOn').checked=state.grain>0;$('badgeText').value=state.badge?.text||'';$('tapeText').value=state.tape?.text||'';$('gutter').value=state.gutter;$('grain').value=Math.round(state.grain*100);}
syncControls();sync();
function restore(pos){cursor=pos;state=JSON.parse(history[cursor]);buttonSet('layouts',names,'layout');buttonSet('grades',grades,'grade');syncControls();sync();}
$('undo').onclick=()=>{if(cursor>0)restore(cursor-1);};$('redo').onclick=()=>{if(cursor<history.length-1)restore(cursor+1);};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?$('redo').click():$('undo').click();}});
$('size').onchange=()=>{state.size=$('size').value;save();sync();};
for(const [id,key] of [['badgeOn','badge'],['starsOn','stars'],['tapeOn','tape']])$(id).onchange=()=>{state[key].on=$(id).checked;save();};
$('vignetteOn').onchange=()=>{state.vignette=$('vignetteOn').checked;save();};$('grainOn').onchange=()=>{state.grain=$('grainOn').checked?Number($('grain').value)/100:0;save();};
$('badgeText').onchange=()=>{state.badge.text=$('badgeText').value;save();};$('tapeText').onchange=()=>{state.tape.text=$('tapeText').value;save();};
$('gutter').oninput=()=>{state.gutter=+$('gutter').value;render();};$('gutter').onchange=save;
$('grain').oninput=()=>{state.grain=+$('grain').value/100;$('grainOn').checked=state.grain>0;render();};$('grain').onchange=save;
function addFiles(files){const accepted=[...files].filter(file=>file.type.startsWith('image/'));const count=Math.max(1,rects[state.layout].length);accepted.forEach((file,offset)=>{const target=(selected+offset)%count;const reader=new FileReader();reader.onload=()=>{uploads.push({name:file.name,url:reader.result});state.panels[target]??={zoom:1,x:0,y:0};state.panels[target].photo=reader.result;selected=target;panelEditor();save();};reader.readAsDataURL(file);});}
$('upload').onchange=e=>addFiles(e.target.files);window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>{e.preventDefault();addFiles(e.dataTransfer.files);});
function canvasPoint(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];}
function hitPanel(x,y){const rs=rects[state.layout];return rs.findIndex(([a,b,w,h],i)=>!(state.layout==='keyart'&&i===6)&&x>=a&&x<=a+w&&y>=b&&y<=b+h);}
canvas.onpointerdown=e=>{const [x,y]=canvasPoint(e),i=hitPanel(x,y);if(i<0)return;selected=i;panelEditor();const p=state.panels[i];drag={i,x,y,px:p.x||0,py:p.y||0};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;const [x,y]=canvasPoint(e),p=state.panels[drag.i];p.x=drag.px+(x-drag.x);p.y=drag.py+(y-drag.y);render();};
canvas.onpointerup=()=>{if(drag){drag=null;save();}};
canvas.onwheel=e=>{const [x,y]=canvasPoint(e),i=hitPanel(x,y);if(i<0)return;e.preventDefault();selected=i;state.panels[i].zoom=Math.max(.65,Math.min(3.5,(state.panels[i].zoom||1)*(e.deltaY<0?1.08:.92)));panelEditor();save();};
function exportPng(size){const [w,h]=sizes[size],c=document.createElement('canvas');c.width=w;c.height=h;renderCover(c.getContext('2d'),w,h,state);const a=document.createElement('a');a.download=`tropic-heat-${size}.png`;a.href=c.toDataURL('image/png');a.click();}
$('export').onclick=()=>exportPng(state.size);$('allSizes').onclick=()=>Object.keys(sizes).forEach((s,i)=>setTimeout(()=>exportPng(s),i*450));
$('surprise').onclick=()=>{state.layout=names[Math.floor(Math.random()*names.length)];state.grade=grades[Math.floor(Math.random()*grades.length)];state.panels.forEach(p=>{p.photo=PHOTOS[Math.floor(Math.random()*PHOTOS.length)];p.grade=null;});buttonSet('layouts',names,'layout');buttonSet('grades',grades,'grade');syncControls();save();};
document.fonts.ready.then(()=>{if(new URLSearchParams(location.search).get('shot')==='editor'){state=JSON.parse(JSON.stringify(defaults));syncControls();sync();}window.__shotReady=true;});
}
