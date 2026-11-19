const PHOTOS = ['boulevard', 'pier', 'rooftop', 'neon'];
const PALETTES = {
  ink: [[42,10,46],[194,42,109],[255,179,71]], sunset: [[59,17,84],[194,65,93],[255,196,107]],
  neon: [[6,42,51],[30,113,139],[255,93,162]], golden: [[43,28,17],[157,105,51],[255,222,142]],
  noir: [[8,8,13],[112,112,112],[250,250,250]], clean: [[18,28,54],[128,126,128],[255,242,220]]
};
const rects = {
  keyart:[[0,0,.58,.62],[.58,0,.42,.31],[.58,.31,.42,.31],[0,.62,.193,.38],[.193,.62,.193,.38],[.386,.62,.194,.38],[.58,.62,.42,.38]],
  band:[[0,0,.62,.68],[.62,0,.19,.68],[.81,0,.19,.68],[0,.68,1,.32]],
  slash:[[0,0,.66,.72],[.65,0,.35,.36],[.62,.36,.38,.36],[0,.72,1,.28]],
  grid6:[[0,0,1/3,.5],[1/3,0,1/3,.5],[2/3,0,1/3,.5],[0,.5,1/3,.5],[1/3,.5,1/3,.5],[2/3,.5,1/3,.5]],
  trio:[[0,0,1/3,1],[1/3,0,1/3,1],[2/3,0,1/3,1]], full:[[0,0,1,1]],
  story:[[0,0,1,.5],[0,.5,.5,.22],[.5,.5,.5,.22],[0,.72,1,.28]]
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const imageCache=new Map();
function photoSource(name) {
  const key=name&&name.startsWith('data:')?name:`sample:${PHOTOS.includes(name)?name:'boulevard'}`;
  if(imageCache.has(key))return imageCache.get(key);
  const im=new Image();im.src=key.startsWith('sample:')?`/samples/${key.slice(7)}.jpg`:key;imageCache.set(key,im);return im;
}
export function preloadCoverPhotos(state={}) {
  const list=[...new Set(state.panels?.length?state.panels.map(p=>p.photo||'boulevard'):['boulevard','pier','rooftop','neon'])];
  return Promise.all(list.map(name=>new Promise(resolve=>{const im=photoSource(name);if(im.complete){resolve();return;}im.onload=im.onerror=()=>resolve();})));
}
function panelPath(ctx,x,y,w,h,index,layout) {
  ctx.beginPath();
  if(layout==='slash'&&index<3) {
    const sl=Math.min(w*.12, h*.08);
    ctx.moveTo(x+sl,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-sl,y+h);ctx.lineTo(x,y+h);ctx.closePath();
  } else ctx.rect(x,y,w,h);
}
function drawPhoto(ctx,W,H,r,panel,index,state,layout) {
  const [rx,ry,rw,rh]=r, x=rx*W, y=ry*H, w=rw*W, h=rh*H;
  panelPath(ctx,x,y,w,h,index,layout);ctx.save();ctx.clip();
  ctx.fillStyle='#1b1428';ctx.fillRect(x,y,w,h);
  const img=photoSource(panel.photo||PHOTOS[index%4]);
  if(img.complete&&img.naturalWidth) {
    const scale=Math.max(w/img.width,h/img.height)*(panel.zoom||1), dw=img.width*scale, dh=img.height*scale;
    const cx=x+(w-dw)/2+(panel.x||0)*w, cy=y+(h-dh)/2+(panel.y||0)*h;
    const quality=.5,off=document.createElement('canvas');off.width=Math.max(1,Math.round(w*quality));off.height=Math.max(1,Math.round(h*quality));
    const oc=off.getContext('2d',{willReadFrequently:true});oc.drawImage(img,(cx-x)*quality,(cy-y)*quality,dw*quality,dh*quality);
    try {
      const data=oc.getImageData(0,0,off.width,off.height), px=data.data, grade=panel.grade||state.grade||'ink', pal=PALETTES[grade]||PALETTES.ink;
      for(let i=0;i<px.length;i+=4) {
        const lum=(px[i]*.299+px[i+1]*.587+px[i+2]*.114)/255;
        if(grade==='noir'){const v=Math.round(clamp((lum-.38)*1.7,0,1)*255);px[i]=px[i+1]=px[i+2]=v;continue;}
        if(grade==='clean'){const f=1.08;for(let c=0;c<3;c++)px[i+c]=clamp((px[i+c]-128)*f+128,0,255);continue;}
        let t=lum*2, a=t<1?pal[0]:pal[1],b=t<1?pal[1]:pal[2];t=t<1?t: t-1;
        if(grade==='ink') t=Math.round(t*4)/4;
        for(let c=0;c<3;c++)px[i+c]=a[c]*(1-t)+b[c]*t;
      }
      oc.putImageData(data,0,0);
      if(grade==='ink') { oc.fillStyle='rgba(18,2,12,.20)'; for(let yy=3;yy<off.height;yy+=7)for(let xx=3;xx<off.width;xx+=7){const rad=1+Math.random()*1.2;oc.beginPath();oc.arc(xx,yy,rad,0,Math.PI*2);oc.fill();} }
    } catch(e) { /* very large browser canvas: preserve the photo */ }
    ctx.drawImage(off,x,y,w,h);
  }
  const tint={ink:'rgba(115,12,65,.13)',sunset:'rgba(255,100,32,.12)',neon:'rgba(0,220,220,.15)',golden:'rgba(204,145,35,.12)',noir:'rgba(0,0,0,.08)',clean:'rgba(255,255,255,.02)'}[panel.grade||state.grade]||'rgba(0,0,0,.1)';
  ctx.fillStyle=tint;ctx.fillRect(x,y,w,h);ctx.restore();
}
function palm(ctx,x,y,s) {
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='rgba(17,8,35,.8)';ctx.lineWidth=10;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-8,-55,2,-125);ctx.stroke();
  for(let i=0;i<7;i++){const a=-Math.PI*.93+i*Math.PI*.27;ctx.beginPath();ctx.moveTo(2,-125);ctx.quadraticCurveTo(Math.cos(a)*52,-125+Math.sin(a)*22,Math.cos(a)*110,-125+Math.sin(a)*65);ctx.stroke();}
  ctx.restore();
}
function titleBlock(ctx,x,y,w,h,state) {
  const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#47105d');g.addColorStop(.55,'#c32179');g.addColorStop(1,'#ff7a24');
  ctx.fillStyle=g;ctx.fillRect(x,y,w,h);palm(ctx,x+w*.09,y+h*.96,Math.min(w,h)*.003);palm(ctx,x+w*.92,y+h*.96,Math.min(w,h)*.003);
  const pad=w*.08, maxW=w*.84;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`bold ${Math.max(14,h*.13)}px Anton, Impact, sans-serif`;ctx.fillStyle='#ffd23f';ctx.letterSpacing=`${Math.max(1,h*.012)}px`;
  ctx.fillText((state.kicker||'WELCOME TO SOLMAR BAY').toUpperCase(),x+w/2,y+h*.17,maxW);
  let title=(state.title||'TROPIC HEAT').toUpperCase(), fs=h*.43;ctx.letterSpacing='0px';
  ctx.font=`bold ${fs}px Anton, Impact, sans-serif`;
  while(ctx.measureText(title).width>maxW&&fs>10){fs*=.94;ctx.font=`bold ${fs}px Anton, Impact, sans-serif`;}
  const tg=ctx.createLinearGradient(0,y+h*.27,0,y+h*.68);tg.addColorStop(0,'#ffe259');tg.addColorStop(.5,'#ff7518');tg.addColorStop(1,'#ff2e88');
  ctx.lineWidth=Math.max(3,fs*.035);ctx.strokeStyle='#160a2e';ctx.shadowColor='#160a2e';ctx.shadowBlur=0;ctx.shadowOffsetX=fs*.045;ctx.shadowOffsetY=fs*.055;
  ctx.font=`bold ${fs}px Anton, Impact, sans-serif`;ctx.strokeText(title,x+w/2,y+h*.48,maxW);ctx.fillStyle=tg;ctx.fillText(title,x+w/2,y+h*.48,maxW);ctx.shadowOffsetX=ctx.shadowOffsetY=0;
  ctx.font=`italic ${Math.max(15,h*.13)}px Pacifico, cursive`;ctx.fillStyle='#fff';ctx.shadowColor='#ff2eae';ctx.shadowBlur=12;
  ctx.fillText(state.script||'solmar bay nights',x+w/2,y+h*.76,maxW);ctx.shadowBlur=0;
  ctx.font=`${Math.max(9,h*.055)}px Anton, sans-serif`;ctx.fillStyle='#fff';ctx.letterSpacing=`${Math.max(1,h*.008)}px`;
  ctx.fillText((state.tagline||'EVERY STREET TELLS A STORY').toUpperCase(),x+w/2,y+h*.92,maxW);ctx.letterSpacing='0px';
  if(state.stars?.on){ctx.font=`${h*.1}px sans-serif`;ctx.fillStyle='#ffd23f';ctx.textAlign='right';ctx.fillText('★'.repeat(Math.max(0,Math.min(5,state.stars.n||5)))+'☆'.repeat(5-Math.max(0,Math.min(5,state.stars.n||5))),x+w*.96,y+h*.27);}
}
function starburst(ctx,x,y,r,text) {
  ctx.save();ctx.translate(x,y);ctx.rotate(-.13);ctx.beginPath();
  for(let i=0;i<32;i++){const a=-Math.PI/2+i*Math.PI/16, rr=i%2?r*.78:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fillStyle='#ffd23f';ctx.strokeStyle='#160a2e';ctx.lineWidth=3;ctx.fill();ctx.stroke();
  ctx.fillStyle='#160a2e';ctx.font=`bold ${r*.48}px Anton, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text||'NEW',0,0,r*1.35);ctx.restore();
}
function tape(ctx,x,y,w,text) {ctx.save();ctx.translate(x,y);ctx.rotate(-.105);ctx.fillStyle='rgba(255,239,194,.93)';ctx.fillRect(-w/2,-15,w,30);ctx.fillStyle='#17131a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 13px Anton, sans-serif';ctx.fillText(text||'COLLECTORS EDITION',0,0,w*.94);ctx.restore();}
function skyline(ctx,x,y,w,h){ctx.fillStyle='rgba(18,8,34,.78)';ctx.beginPath();ctx.moveTo(x,y+h);for(let i=0;i<18;i++){let bx=x+w*i/18,bw=w/18;ctx.lineTo(bx,y+h);ctx.lineTo(bx,y+h*(.42+((i*17)%35)/100));ctx.lineTo(bx+bw*.7,y+h*(.42+((i*17)%35)/100));}ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill();}
export function renderCover(ctx,W,H,state={}) {
  const layout=state.layout||'keyart', rs=rects[layout]||rects.keyart, gutter=state.gutter??10;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a12';ctx.fillRect(0,0,W,H);
  rs.forEach((r,i)=>{if((layout==='keyart'&&i===6)||(layout==='band'&&i===3)||(layout==='slash'&&i===3)||(layout==='full'&&i===0)||(layout==='story'&&i===3))return;
    const p=state.panels?.[i]||{photo:PHOTOS[i%4],zoom:1};drawPhoto(ctx,W,H,r,p,i,state,layout);
  });
  if(layout==='keyart')titleBlock(ctx,W*.58,H*.62,W*.42,H*.38,state);
  if(layout==='band'){const g=ctx.createLinearGradient(0,H*.68,0,H);g.addColorStop(0,'#501361');g.addColorStop(1,'#f05451');ctx.fillStyle=g;ctx.fillRect(0,H*.68,W,H*.32);skyline(ctx,0,H*.77,W,H*.23);titleBlock(ctx,0,H*.68,W,H*.32,state);}
  if(layout==='slash'){ctx.save();ctx.beginPath();ctx.moveTo(0,H*.72);ctx.lineTo(W,H*.68);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.clip();titleBlock(ctx,0,H*.7,W,H*.3,state);ctx.restore();}
  if(layout==='grid6'){const g=ctx.createLinearGradient(0,H*.55,0,H);g.addColorStop(0,'rgba(48,8,59,0)');g.addColorStop(1,'rgba(21,5,34,.96)');ctx.fillStyle=g;ctx.fillRect(0,H*.5,W,H*.5);titleBlock(ctx,0,H*.57,W,H*.43,state);}
  if(layout==='trio'){const g=ctx.createLinearGradient(0,H*.57,0,H);g.addColorStop(0,'rgba(55,5,47,0)');g.addColorStop(1,'rgba(18,5,30,.95)');ctx.fillStyle=g;ctx.fillRect(0,H*.55,W,H*.45);titleBlock(ctx,W*.1,H*.63,W*.8,H*.34,state);}
  if(layout==='full'){drawPhoto(ctx,W,H,rs[0],state.panels?.[0]||{photo:'boulevard',zoom:1},0,state,layout);titleBlock(ctx,0,H*.68,W,H*.32,state);}
  if(layout==='story')titleBlock(ctx,0,H*.72,W,H*.28,state);
  if(state.badge?.on)starburst(ctx,W*.1,H*.12,Math.min(W,H)*.075,state.badge.text);
  if(state.tape?.on)tape(ctx,W*.78,H*.09,Math.min(W*.34,260),state.tape.text);
  if(gutter>0&&layout!=='full'){
    rs.forEach((r,i)=>{if((layout==='keyart'&&i===6)||(layout==='band'&&i===3)||(layout==='slash'&&i===3)||(layout==='story'&&i===3))return;ctx.strokeStyle='#0a0a12';ctx.lineWidth=gutter*W/1920;panelPath(ctx,r[0]*W,r[1]*H,r[2]*W,r[3]*H,i,layout);ctx.stroke();});
  }
  if(state.grain>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(.12,state.grain)*.16})`;for(let i=0;i<Math.min(900,Math.floor(W*H/3000));i++){const x=(i*7919)%W,y=(i*3571)%H;ctx.fillRect(x,y,1,1);}}
  if(state.vignette!==false){const vg=ctx.createRadialGradient(W*.5,H*.48,Math.min(W,H)*.25,W*.5,H*.5,Math.max(W,H)*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,2,12,.62)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);}
}
export { rects, PHOTOS };
