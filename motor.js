/* =====================================================================
   MOTOR DE SHORTS DE TERROR — v1
   Roda no navegador (player) e no Node (render para MP4).
   Um vídeo é um objeto VIDEO = { title, dur, dlg, scene, overlay?, score }.
   ===================================================================== */
(function(root){
'use strict';
const W=1080,H=1920,LW=360,LH=640;
const PX='"Press Start 2P", "Courier New", monospace';

/* ---------- matemática ---------- */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sm=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k)};      // 0→1 suave entre a e b
const win=(t,a,b,f)=>Math.min(sm(a,a+f,t),1-sm(b-f,b,t));                     // janela com fade f
const lerp=(a,b,k)=>a+(b-a)*k;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash=x=>{const s=Math.sin(x*127.1+311.7)*43758.5453;return s-Math.floor(s)};

/* ---------- plataforma ---------- */
let PF=null,LO=null,GL=null,GRAIN=[];
function init(platform){
 PF=platform;LO=PF.createCanvas(LW,LH);GL=LO.getContext('2d');GRAIN=[];
 const r=rng(99);
 for(let k=0;k<6;k++){const c=PF.createCanvas(270,480),x=c.getContext('2d'),d=x.createImageData(270,480);
  for(let i=0;i<d.data.length;i+=4){const v=r()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}
  x.putImageData(d,0,0);GRAIN.push(c)}
}

/* ---------- desenho básico ---------- */
function q(g,a,b,c,d){g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.lineTo(d[0],d[1]);g.closePath()}
function line(g,a,b,w){g.lineWidth=w;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()}
function pine(g,x,base,h,w){g.beginPath();for(let i=0;i<5;i++){const top=base-h+i*h*.17,tw=w*(.3+i*.2),bot=top+h*.3;g.moveTo(x,top);g.lineTo(x-tw/2,bot);g.lineTo(x+tw/2,bot);g.closePath()}g.rect(x-w*.05,base-h*.2,w*.1,h*.2);g.fill()}
function glow(g,x,y,r,rgb,a){g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${rgb},${a})`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.restore()}
function nightSky(g,t,o={}){
 const sg=g.createLinearGradient(0,0,0,o.h||1500);sg.addColorStop(0,'#04060b');sg.addColorStop(.6,'#101829');sg.addColorStop(1,'#1c2436');
 g.fillStyle=sg;g.fillRect(-600,-600,W+1200,H+1200);
 g.fillStyle='#cfd8ff';for(let i=0;i<80;i++){g.globalAlpha=(.3+hash(i)*.5)*(.6+.4*Math.sin(t*(1+hash(i+1)*3)+i));g.fillRect(hash(i+2)*W,hash(i+3)*900,3,3)}g.globalAlpha=1;
 if(o.moon!==false){const [mx,my]=o.moon||[780,380],mr=o.mr||60;glow(g,mx,my,mr*5,'190,205,255',.22);g.fillStyle='#e6e9f2';g.beginPath();g.arc(mx,my,mr,0,7);g.fill()}
}
function fog(g,y,t,a){for(let i=0;i<4;i++){const x=((i*420+t*(18+i*6))%(W+900))-450;g.save();g.translate(x,y+Math.sin(t*.3+i)*20);g.scale(3.2,1);
 const r=g.createRadialGradient(0,0,0,0,0,180);r.addColorStop(0,`rgba(130,145,175,${a})`);r.addColorStop(1,'rgba(130,145,175,0)');g.fillStyle=r;g.fillRect(-180,-180,360,360);g.restore()}}

/* ---------- personagem reutilizável: o encapuzado ---------- */
// (x,y)=pés; s=escala (1 = ~600px de altura); o: {run, tilt, alpha, glint, eyes:'red'|'pale'|false, knife:true}
function hooded(g,x,y,s,t,o={}){
 g.save();g.translate(x,y);g.scale(s,s);g.globalAlpha*=(o.alpha??1);
 if(o.run)g.translate(0,-Math.abs(Math.sin(t*9))*14);
 if(o.tilt){g.translate(0,-380);g.rotate(o.tilt);g.translate(0,380)}
 const rim='rgba(120,140,190,.4)';
 const robe=()=>{g.beginPath();g.moveTo(-66,-430);g.quadraticCurveTo(-104,-250,-132,0);
  for(let i=0;i<=12;i++){const u=i/12,xx=-132+u*264,flap=Math.sin(t*(o.run?14:4)+i*1.3)*(o.run?16:5);g.lineTo(xx+flap*.4,(i%2?-26:8)+flap)}
  g.quadraticCurveTo(104,-250,66,-430);g.closePath()};
 g.fillStyle='#060608';robe();g.fill();g.strokeStyle=rim;g.lineWidth=5;robe();g.stroke();
 // tiras soltas (movimento secundário)
 g.strokeStyle='#060608';g.lineWidth=10;g.lineCap='round';
 for(let i=0;i<3;i++){const bx=-90+i*70,ph=t*(o.run?12:3)+i;g.beginPath();g.moveTo(bx,-10);g.quadraticCurveTo(bx-20+Math.sin(ph)*18,30,bx-34+Math.sin(ph+.8)*26,60+i*6);g.stroke()}
 // capuz com ponta caída
 g.fillStyle='#060608';g.beginPath();g.ellipse(0,-458,74,88,0,0,7);g.fill();
 const tip=Math.sin(t*(o.run?10:2))*10;
 g.beginPath();g.moveTo(-60,-500);g.quadraticCurveTo(-120,-560,-150+tip,-470);g.quadraticCurveTo(-110,-470,-70,-440);g.fill();
 g.strokeStyle=rim;g.lineWidth=4;g.beginPath();g.ellipse(0,-458,74,88,0,Math.PI*1.05,Math.PI*1.95);g.stroke();
 g.fillStyle='#000';g.beginPath();g.ellipse(4,-440,42,54,0,0,7);g.fill();
 if(o.eyes!==false){const red=(o.eyes||'red')==='red';g.save();if(red){g.shadowColor='#ff2a1a';g.shadowBlur=18}
  g.fillStyle=red?'#ff2a1a':'rgba(225,230,240,.9)';g.beginPath();g.ellipse(-12,-448,7,4,.25,0,7);g.ellipse(18,-448,7,4,-.25,0,7);g.fill();g.restore()}
 // braço, mão ossuda e faca
 if(o.knife!==false){
  g.strokeStyle='#060608';g.lineWidth=32;g.beginPath();g.moveTo(48,-380);g.lineTo(100,-468);g.stroke();
  g.strokeStyle='#1a1a1e';g.lineWidth=5;for(let i=0;i<3;i++){g.beginPath();g.moveTo(92+i*8,-470);g.lineTo(96+i*8,-500);g.stroke()}
  g.fillStyle='#2a1a10';g.fillRect(90,-510,20,44);g.fillStyle='#777';g.fillRect(88,-516,24,6);
  g.fillStyle='#c9cdd3';g.beginPath();g.moveTo(90,-516);g.lineTo(84,-614);g.lineTo(130,-654);g.lineTo(112,-516);g.fill();
  g.fillStyle='rgba(60,20,20,.6)';g.fillRect(96,-570,10,22);
  if(o.glint){g.fillStyle=`rgba(255,255,255,${o.glint})`;g.beginPath();g.arc(100,-600,10*o.glint,0,7);g.fill()}}
 g.restore();
}

/* ---------- pós-processamento e efeitos de tela ---------- */
function post(g,t){
 const vg=g.createRadialGradient(540,960,420,540,960,1250);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.72)');g.fillStyle=vg;g.fillRect(0,0,W,H);
 g.globalAlpha=.07;g.drawImage(GRAIN[Math.floor(t*24)%6],0,0,W,H);g.globalAlpha=1;
}
function fade(g,a,color='0,0,0'){if(a>0){g.fillStyle=`rgba(${color},${clamp(a,0,1)})`;g.fillRect(-50,-50,W+100,H+100)}}
function flash(g,a,rgb='255,248,235'){fade(g,a,rgb)}
function desat(g,amount=.75,dark=.15){g.save();g.globalCompositeOperation='saturation';g.fillStyle=`rgba(128,128,128,${amount})`;g.fillRect(0,0,W,H);g.restore();fade(g,dark)}
function shake(g,t,amp){if(amp>0)g.translate((hash(t*60)-.5)*amp*2,(hash(t*60+9)-.5)*amp*2)}
function badge(g,n,x,y){g.fillStyle='rgba(0,0,0,.7)';g.beginPath();g.arc(x,y,52,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=5;g.stroke();
 g.fillStyle='#fff';g.font='54px '+PX;g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),x+3,y+5)}
function glitch(g,t,k=1){const fr=Math.floor(t*30);
 for(let i=0;i<14;i++){const y=hash(i*3.1+fr)*H,h=20+hash(i+fr*1.7)*120,dx=(hash(i*7+fr)-.5)*260*k;
  g.fillStyle=`rgba(${i%3?255:0},${i%2?255:40},${i%3?40:255},${.18*k})`;g.fillRect(0,y,W,h);g.fillStyle=`rgba(0,0,0,${.5*k})`;g.fillRect(dx>0?0:W+dx,y,Math.abs(dx),h)}
 g.globalAlpha=.35*k;g.drawImage(GRAIN[fr%6],0,0,W,H);g.globalAlpha=1}
function countdown(g,t,start,y=1300){if(t<start||t>=start+3)return;const n=3-Math.floor(t-start),f=t-start-Math.floor(t-start);
 g.save();g.font=`${Math.round(130+(1-sm(0,.25,f))*50)}px `+PX;g.textAlign='center';g.textBaseline='middle';
 g.lineWidth=14;g.strokeStyle='#000';g.strokeText(String(n),540,y);g.fillStyle='#e3241b';g.fillText(String(n),540,y);g.restore()}

/* ---------- diálogo digitado ---------- */
// item: {a,b,v:'n'|'e'|'E',text,y?,cps?}  n=narrador  e=entidade  E=entidade grande sem caixa
function prepDLG(list){for(const L of list){const cps=L.cps||(L.v==='n'?26:13);let x=L.a;L.ts=[];
 for(const c of L.text){L.ts.push(x);x+=1/cps;if(',;:'.includes(c))x+=.12;if('.?!'.includes(c))x+=.2}L.end=L.ts[L.ts.length-1]||L.a}return list}
function wrapText(g,txt,maxW){const words=txt.split(' '),lines=[];let cur='';for(const w of words){const tr=cur?cur+' '+w:w;if(g.measureText(tr).width>maxW&&cur){lines.push(cur);cur=w}else cur=tr}lines.push(cur);return lines}
const YPOS={ALTA:480,MEDIA:960,BAIXA:1500};
function dialog(g,t,list){
 for(const L of list){if(t<L.a||t>L.b)continue;
  let n=0;for(const x of L.ts)if(x<=t)n++;
  const al=Math.min(1,(L.b-t)/.2,(t-L.a)/.08),big=L.v==='E',ent=L.v!=='n',fr=Math.floor(t*20);
  const fs=big?62:34,lh=big?96:56;
  g.save();g.globalAlpha=al;g.font=fs+'px '+PX;g.textBaseline='top';g.textAlign='left';
  const lines=wrapText(g,L.text,big?940:880),bh=lines.length*lh+(big?0:38),cy=typeof L.y==='string'?YPOS[L.y]:(L.y||1500),by=cy-bh/2;
  if(!big){g.fillStyle='rgba(0,0,0,.92)';g.fillRect(70,by,940,bh);g.strokeStyle=ent?'#b31212':'#fff';g.lineWidth=6;g.strokeRect(70,by,940,bh)}
  let k=0;lines.forEach((ln,li)=>{const lw=g.measureText(ln).width,x0=big?540-lw/2:104,y=big?by+li*lh:by+24+li*lh;
   for(let i=0;i<ln.length;i++){if(k>=n)break;let dx=0,dy=0;if(ent){const m=big?7:3;dx=(hash(k*13.1+fr)-.5)*m*2;dy=(hash(k*7.7+fr+3)-.5)*m*2}
    const cx=x0+g.measureText(ln.slice(0,i)).width;
    if(big){g.fillStyle='#000';g.fillText(ln[i],cx+dx+5,y+dy+5)}g.fillStyle=ent?'#ff2e2e':'#fff';g.fillText(ln[i],cx+dx,y+dy);k++}k++});
  g.restore()}
}

/* ---------- quadro completo ---------- */
/* ---------- modo pixel: VIDEO.pix(t,E) → {p, light, shake:[dx,dy], post(buf)} em 180×320 (ver pix.js / PIXEL.md) ---------- */
let PLO=null,PLG=null;
function framePix(m,t,video,S){
 const P=root.PIX;if(!PLO){PLO=PF.createCanvas(P.PW,P.PH);PLG=PLO.getContext('2d')}
 m.setTransform(1,0,0,1,0,0);m.fillStyle='#000';m.fillRect(0,0,W*S,H*S);
 let r=null;try{r=video.pix(t,API)}catch(e){if(!frame._err){frame._err=1;console.error(e)}}
 if(r){const buf=r.p.render(r.light);if(r.post)r.post(buf);const id=PLG.createImageData(P.PW,P.PH);id.data.set(buf);PLG.putImageData(id,0,0);
  const [sx,sy]=r.shake||[0,0],k=P.SC*S;m.imageSmoothingEnabled=false;m.drawImage(PLO,Math.round(sx)*k,Math.round(sy)*k,P.PW*k,P.PH*k)}
}
function frame(main,t,video,opts={}){
 if(video.pix){const S=main.width/W,m=main.getContext('2d');framePix(m,t,video,S);m.setTransform(S,0,0,S,0,0);
  if(video.overlay){m.save();try{video.overlay(t,m,API)}catch(e){console.error(e)}m.restore()}
  dialog(m,t,video.dlg||[]);return}
 const pix=opts.pixel!==false,S=main.width/W,m=main.getContext('2d');
 const g=pix?GL:m;g.setTransform(pix?LW/W:S,0,0,pix?LW/W:S,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
 g.fillStyle='#000';g.fillRect(0,0,W,H);
 g.save();try{video.scene(t,g,API)}catch(e){if(!frame._err){frame._err=1;console.error(e)}}g.restore();
 post(g,t);
 if(pix){m.setTransform(1,0,0,1,0,0);m.imageSmoothingEnabled=false;m.drawImage(LO,0,0,main.width,main.height)}
 m.setTransform(S,0,0,S,0,0);
 if(video.overlay){m.save();try{video.overlay(t,m,API)}catch(e){console.error(e)}m.restore()}
 dialog(m,t,video.dlg||[]);
}

/* =====================================================================
   ÁUDIO — mixagem padrão do canal
   Narração (blips) = referência 0 dB | música −6 | ambiente −16 | efeitos −4 | impactos +3
   Ducking de −6 dB em música/ambiente enquanto o texto é digitado.
   Limitador no final. O render normaliza para −14 LUFS / −1 dBTP.
   ===================================================================== */
const MIX={voice:0,music:-6,amb:-16,sfx:-4,hit:3,duck:-6};
const dB=d=>Math.pow(10,d/20);
function audioInit(ac){
 const out=ac.createGain();out.gain.value=1;
 const lim=ac.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.002;lim.release.value=.1;
 out.connect(lim);lim.connect(ac.destination);
 const noise=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),nd=noise.getChannelData(0),r=rng(7);for(let i=0;i<nd.length;i++)nd[i]=r()*2-1;
 const len=Math.floor(ac.sampleRate*2.5),ir=ac.createBuffer(2,len,ac.sampleRate);
 for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(r()*2-1)*Math.pow(1-i/len,3)}
 return {ac,out,noise,ir};
}
function session(A,t0,video,base){
 const ac=A.ac,master=ac.createGain();master.connect(A.out);
 const rev=ac.createConvolver();rev.buffer=A.ir;const rg=ac.createGain();rg.gain.value=.35;rev.connect(rg);rg.connect(master);
 const S={ac,A,master,rev,base,t0,nodes:[],at:x=>base+(x-t0)};
 const dlg=video.dlg||[];
 S.B={};
 for(const k of ['voice','music','amb','sfx','hit']){const b=ac.createGain();b.gain.value=dB(MIX[k]);const gate=ac.createGain();gate.gain.value=1;b.connect(gate);
  if(k==='music'||k==='amb'){const d=ac.createGain();gate.connect(d);d.connect(master);b.duck=d}else gate.connect(master);b.gate=gate;S.B[k]=b}
 const pts=[[0,1]];let last=0;const dk=dB(MIX.duck);
 for(const L of dlg){const a=L.a-.08,e=L.end+.1;if(a<=last)continue;pts.push([a,1],[L.a,dk],[e,dk],[e+.3,1]);last=e+.3}
 SND.env(S,S.B.music.duck.gain,pts);SND.env(S,S.B.amb.duck.gain,pts);
 try{video.score&&video.score(S,SND,API)}catch(e){console.error(e)}
 for(const L of dlg)L.ts.forEach((x,i)=>{if(/[A-Za-z0-9À-ÿ]/.test(L.text[i]))SND.blip(S,x,i,L.v)});
 return S;
}
function stopSession(S){if(!S)return;const ac=S.ac;S.master.gain.setTargetAtTime(0,ac.currentTime,.02);
 setTimeout(()=>{S.nodes.forEach(n=>{try{n.stop()}catch(e){}});try{S.master.disconnect()}catch(e){}},200)}

/* ---------- biblioteca de sons ----------
   Todas as funções usam tempo do VÍDEO em segundos (x, a, b) e um barramento:
   'voice' | 'music' | 'amb' | 'sfx' | 'hit'
*/
const SND=(()=>{
 const reg=(S,n)=>{S.nodes.push(n);return n};
 const O=(S,type,f)=>{const o=S.ac.createOscillator();o.type=type;o.frequency.value=f;return reg(S,o)};
 const N=S=>{const n=S.ac.createBufferSource();n.buffer=S.A.noise;n.loop=true;return reg(S,n)};
 const F=(S,type,f,q)=>{const b=S.ac.createBiquadFilter();b.type=type;b.frequency.value=f;if(q)b.Q.value=q;return b};
 const G=(S,v=0)=>{const x=S.ac.createGain();x.gain.value=v;return x};
 const bus=(S,b)=>typeof b==='string'?S.B[b]:b;
 function env(S,p,pts){const t0=S.t0;let v=pts[0][1];
  for(let i=0;i<pts.length;i++){if(pts[i][0]<=t0)v=pts[i][1];else{if(i>0){const [a,va]=pts[i-1],[b,vb]=pts[i];v=va+(vb-va)*(t0-a)/(b-a)}break}}
  p.cancelScheduledValues(0);p.setValueAtTime(v,S.base);for(const [x,val] of pts)if(x>t0)p.linearRampToValueAtTime(val,S.at(x))}
 const run=(S,n,end)=>{n.start(S.base,n.buffer?1.5*hash(S.nodes.length):undefined);n.stop(S.at(end)+.1)};
 function shot(S,x,fn){if(x<S.t0-.001)return;try{fn(S.at(x))}catch(e){console.warn(e)}}
 function noise(S,x,v,dec,filt,f,b='sfx',q,rv){shot(S,x,w=>{const n=reg(S,S.ac.createBufferSource());n.buffer=S.A.noise;const fl=F(S,filt,f,q),gg=G(S);
  gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v,w+.004);gg.gain.exponentialRampToValueAtTime(.0001,w+dec);
  n.connect(fl);fl.connect(gg);gg.connect(bus(S,b));if(rv)gg.connect(S.rev);n.start(w,1.5*hash(x));n.stop(w+dec+.05)})}
 function tone(S,x,type,f0,f1,v,dec,glide,b='sfx',rv){shot(S,x,w=>{const o=reg(S,S.ac.createOscillator());o.type=type;o.frequency.setValueAtTime(f0,w);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),w+Math.max(.005,glide));
  const gg=G(S);gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v,w+.006);gg.gain.exponentialRampToValueAtTime(.0001,w+dec);
  o.connect(gg);gg.connect(bus(S,b));if(rv)gg.connect(S.rev);o.start(w);o.stop(w+dec+.05)})}
 function sweep(S,x,dur,f0,f1,v,b='sfx',q=1.4){shot(S,x,w=>{const n=reg(S,S.ac.createBufferSource());n.buffer=S.A.noise;const bp=F(S,'bandpass',f0,q);
  bp.frequency.setValueAtTime(f0,w);bp.frequency.exponentialRampToValueAtTime(f1,w+dur);const gg=G(S);
  gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v,w+dur*.6);gg.gain.exponentialRampToValueAtTime(.0001,w+dur);
  n.connect(bp);bp.connect(gg);gg.connect(bus(S,b));gg.connect(S.rev);n.start(w);n.stop(w+dur+.05)})}
 const whoosh=(S,x,dur=.45,v=.6)=>sweep(S,x,dur,300,3500,v,'sfx');
 function rewind(S,x){sweep(S,x,.5,4000,200,.7,'sfx',2);for(let i=0;i<8;i++)noise(S,x+i*.06,.35,.03,'bandpass',1500+i*300,'sfx')}
 function creak(S,x,dur,v,b='sfx'){shot(S,x,w=>{const o=reg(S,S.ac.createOscillator());o.type='sawtooth';
  const r=rng(Math.floor(x*100)),c=new Float32Array(64);for(let i=0;i<64;i++)c[i]=60+r()*55+35*Math.sin(i*.4);o.frequency.setValueCurveAtTime(c,w,dur);
  const bp=F(S,'bandpass',1000,5),gg=G(S);gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v,w+.06);gg.gain.setValueAtTime(v,w+Math.max(.07,dur-.12));gg.gain.linearRampToValueAtTime(0,w+dur);
  o.connect(bp);bp.connect(gg);gg.connect(bus(S,b));gg.connect(S.rev);o.start(w);o.stop(w+dur+.05)})}
 function breath(S,x,dur,v,f,b='sfx'){shot(S,x,w=>{const n=reg(S,S.ac.createBufferSource());n.buffer=S.A.noise;const bp=F(S,'bandpass',f,1.1),gg=G(S);
  gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v,w+dur*.35);gg.gain.linearRampToValueAtTime(0,w+dur);n.connect(bp);bp.connect(gg);gg.connect(bus(S,b));n.start(w,hash(x));n.stop(w+dur+.05)})}
 // respiração contínua: period .36 (pânico) · .45 (correndo) · .9 (dor/cansaço)
 function breathing(S,a,b,period=.45,v=.5){for(let x=a;x<b;x+=period){breath(S,x,period*.44,v,1700);breath(S,x+period*.45,period*.52,v*.82,1050)}}
 function groan(S,x,v=.45,b='sfx'){shot(S,x,w=>{const o=reg(S,S.ac.createOscillator());o.type='sawtooth';o.frequency.setValueAtTime(128,w);o.frequency.linearRampToValueAtTime(96,w+.55);
  const bp=F(S,'bandpass',620,3),lp=F(S,'lowpass',1200),gg=G(S);gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v,w+.08);gg.gain.linearRampToValueAtTime(0,w+.6);
  o.connect(bp);bp.connect(lp);lp.connect(gg);gg.connect(bus(S,b));o.start(w);o.stop(w+.65)})}
 function beat(S,x,v=.85,b='sfx'){tone(S,x,'sine',68,40,v,.24,.14,b);tone(S,x,'triangle',136,80,v*.35,.12,.1,b);tone(S,x+.2,'sine',60,38,v*.6,.22,.14,b)}
 function heartbeat(S,a,b,iv=.9,accel=.94,v=.85){let x=a;while(x<b){beat(S,x,v);iv=Math.max(.3,iv*accel);x+=iv}}
 function knock(S,x,v=.9){noise(S,x,v,.13,'lowpass',900,'sfx',0,true);tone(S,x,'sine',140,65,v*.9,.16,.08,'sfx',true)}
 // passos: kind = 'wood' | 'grass' | 'heavy' (entidade) | 'drag' (mancando)
 function step(S,x,v=.6,kind='wood',b='sfx'){
  if(kind==='wood'){noise(S,x,v,.07,'lowpass',650,b);tone(S,x,'sine',120,60,v*.5,.08,.06,b)}
  else if(kind==='grass')noise(S,x,v,.08,'lowpass',1100,b);
  else if(kind==='heavy'){tone(S,x,'sine',72,38,v,.22,.18,b,true);noise(S,x,v*.7,.16,'lowpass',320,b)}
  else if(kind==='drag')shot(S,x,w=>{const n=reg(S,S.ac.createBufferSource());n.buffer=S.A.noise;const bp=F(S,'bandpass',650,1.5),gg=G(S);
   gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v*.6,w+.12);gg.gain.linearRampToValueAtTime(0,w+.4);n.connect(bp);bp.connect(gg);gg.connect(bus(S,b));n.start(w,hash(x));n.stop(w+.45)})}
 function steps(S,a,b,iv,v=.6,kind='wood',vEnd){let x=a,i=0;const n=Math.max(1,Math.floor((b-a)/iv));while(x<b){step(S,x,vEnd!=null?lerp(v,vEnd,i/n):v,kind);x+=iv;i++}}
 function glass(S,x,v=.9){for(let i=0;i<7;i++)noise(S,x+i*.012,v-i*.08,.15+hash(x+i)*.25,'highpass',3500+i*400,'hit',0,true);
  for(let i=0;i<18;i++){const f=3000+hash(x*3+i)*4000;tone(S,x+.05+hash(x+i*7)*.8,'sine',f,f,.12,.08,.05,'sfx')}}
 function impact(S,x,v=1){tone(S,x,'sine',75,32,v,.5,.35,'hit');noise(S,x,v*.9,.3,'lowpass',260,'hit')}
 function crack(S,x,v=1){noise(S,x,v,.035,'highpass',2600,'hit');noise(S,x+.01,v*.8,.08,'bandpass',1300,'hit',2)}
 function slam(S,x,v=1){noise(S,x,v*1.1,.4,'lowpass',400,'hit',0,true);tone(S,x,'sine',55,32,v,.6,.4,'hit')}
 function boom(S,x,v=.8){tone(S,x,'sine',58,28,v,2.2,1.6,'hit',true);noise(S,x,v*.6,1.2,'lowpass',180,'hit')}
 function ring(S,x,f=2800,v=.18,dec=1.2){tone(S,x,'sine',f,f,v,dec,dec*.8,'sfx',true)}
 function click(S,x,v=.5){noise(S,x,v,.03,'highpass',3000,'sfx')}
 function lockClunk(S,x){tone(S,x,'square',190,120,.35,.08,.06,'sfx');noise(S,x,.7,.07,'bandpass',800,'sfx',2)}
 function rattle(S,a,b,v=.45){for(let x=a;x<b;x+=.06)noise(S,x,v,.03,'highpass',2800,'sfx')}
 function caw(S,x,v=.25){for(let i=0;i<2;i++)shot(S,x+i*.3,w=>{const o=reg(S,S.ac.createOscillator());o.type='sawtooth';o.frequency.setValueAtTime(760,w);o.frequency.exponentialRampToValueAtTime(420,w+.22);
  const bp=F(S,'bandpass',1500,2.5),gg=G(S);gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(v,w+.02);gg.gain.exponentialRampToValueAtTime(.0001,w+.25);
  o.connect(bp);bp.connect(gg);gg.connect(S.B.sfx);gg.connect(S.rev);o.start(w);o.stop(w+.3)})}
 function tinnitus(S,a,b,v=.14){if(b<=S.t0)return;const o=O(S,'sine',5200),gg=G(S);env(S,gg.gain,[[0,0],[a,0],[a+.04,v],[b,0]]);o.connect(gg);gg.connect(S.B.sfx);run(S,o,b)}
 // susto: acorde dissonante seco; corta em x+dur (use dur curto + corte seco para preto)
 function stinger(S,x,dur=.3,v=.9){shot(S,x,w=>{const st=G(S);st.gain.setValueAtTime(0,w);st.gain.linearRampToValueAtTime(v,w+.006);
  if(dur<1){st.gain.setValueAtTime(v,w+dur-.01);st.gain.setValueAtTime(0,w+dur)}else st.gain.exponentialRampToValueAtTime(.001,w+dur);
  st.connect(S.B.hit);st.connect(S.rev);for(const f of [110,116.5,155.6,164.8,233.1]){const o=reg(S,S.ac.createOscillator());o.type='sawtooth';o.frequency.value=f;const og=G(S,.12);o.connect(og);og.connect(st);o.start(w);o.stop(w+dur+.05)}});
  noise(S,x,v*.6,Math.min(.6,dur),'lowpass',4000,'hit',0,true)}
 function riser(S,a,b,v=.35){if(b<=S.t0)return;const n=N(S),hp=F(S,'highpass',200),gg=G(S);env(S,hp.frequency,[[0,200],[a,200],[b,5000]]);env(S,gg.gain,[[0,0],[a,0],[b-.02,v],[b,0]]);
  n.connect(hp);hp.connect(gg);gg.connect(S.B.sfx);run(S,n,b)}
 // camadas contínuas (com fade de entrada/saída)
 function layer(S,a,b,v,build,busName,fin=.5,fout=.5){if(b<=S.t0)return;const gg=G(S);env(S,gg.gain,[[0,0],[a,0],[a+fin,v],[b-fout,v],[b,0]]);gg.connect(bus(S,busName));build(gg);}
 function drone(S,a,b,v=.3,freqs=[41.2,55],lp=160,busName='music'){layer(S,a,b,v,gg=>{const f=F(S,'lowpass',lp);f.connect(gg);for(const hz of freqs){const o=O(S,'sawtooth',hz);o.connect(f);run(S,o,b)}},busName)}
 function tension(S,a,b,v=.03,f=1318){layer(S,a,b,v,gg=>{const o=O(S,'sine',f),l=O(S,'sine',4.2),lg=G(S,9);l.connect(lg);lg.connect(o.frequency);o.connect(gg);gg.connect(S.rev);run(S,o,b);run(S,l,b)},'music',1,.3)}
 function room(S,a,b,v=.8){layer(S,a,b,v,gg=>{const n=N(S),f=F(S,'lowpass',260);n.connect(f);f.connect(gg);run(S,n,b)},'amb',.3,.05)}
 function wind(S,a,b,v=.6){layer(S,a,b,v,gg=>{const n=N(S),bp=F(S,'bandpass',450,.8),l1=O(S,'sine',.11),g1=G(S,260),l2=O(S,'sine',.37),g2=G(S,120);
  l1.connect(g1);g1.connect(bp.frequency);l2.connect(g2);g2.connect(bp.frequency);n.connect(bp);bp.connect(gg);run(S,n,b);run(S,l1,b);run(S,l2,b)},'amb',1,.8)}
 function fire(S,a,b,v=.6){layer(S,a,b,v*.35,gg=>{const n=N(S),lp=F(S,'lowpass',500);n.connect(lp);lp.connect(gg);run(S,n,b)},'amb');
  const r=rng(Math.floor(a*100));for(let x=a+.2;x<b-.2;x+=.05+r()*.28)noise(S,x,v*(.25+r()*.75),.03+r()*.05,'highpass',1800,'amb')}
 function crickets(S,a,b,v=.35){for(let x=a;x<b;x+=.45+hash(x)*.5)for(let i=0;i<3;i++)tone(S,x+i*.05,'sine',4500,4400,v,.025,.02,'amb')}
 function drips(S,a,b,v=.3){for(let x=a;x<b;x+=.6+hash(x*2)*1.4){const f=900+hash(x)*900;tone(S,x,'sine',f,f*1.6,v,.12,.05,'amb',true)}}
 function birds(S,a,b,v=.06){for(let x=a;x<b;x+=.5+hash(x)*.7){tone(S,x,'sine',2800,4200,v,.09,.07,'amb');tone(S,x+.12,'sine',3600,2600,v*.8,.09,.07,'amb')}}
 function waves(S,a,b,v=.6){layer(S,a,b,v,gg=>{const n=N(S),lp=F(S,'lowpass',700),l=O(S,'sine',.12),lg=G(S,.5),wg=G(S,.5);l.connect(lg);lg.connect(wg.gain);n.connect(lp);lp.connect(wg);wg.connect(gg);run(S,n,b);run(S,l,b)},'amb',1,1)}
 function pad(S,a,b,v=.05,freqs=[293.66,369.99,440,587.33]){layer(S,a,b,v,gg=>{gg.connect(S.rev);for(const f of freqs){const o=O(S,'sine',f);o.connect(gg);run(S,o,b)}},'music',1,1)}
 // música de perseguição: ostinato grave em semicolcheias + cordas dissonantes com trêmolo
 function chase(S,a,b,bpm=140,root=55,v=1){if(b<=S.t0)return;const lp=F(S,'lowpass',420,2);lp.connect(S.B.music);
  const pat=[1,1,1,1.189,1,1,1.059,1],st=60/bpm/4;let k=0;
  for(let x=a;x<b-.02;x+=st,k++){const f=root*pat[k%8];tone(S,x,'sawtooth',f,f*.98,(k%4===0?.55:.34)*v,.1,.09,lp)}
  for(let x=a;x<b;x+=st*16)tone(S,x,'sine',60,30,.7*v,.7,.5,'music');
  layer(S,a,b,.1*v,gg=>{const f=F(S,'lowpass',2200),l=O(S,'sine',12),lg=G(S,.35);l.connect(lg);lg.connect(gg.gain);f.connect(gg);
   for(const hz of [root*4,root*4*1.0595]){const o=O(S,'sawtooth',hz);o.connect(f);run(S,o,b)}run(S,l,b)},'music',.05,.05)}
 // silêncio absoluto (exceto narração) entre a e b
 function silence(S,a,b){for(const k of ['music','amb','sfx','hit']){const p=S.B[k].gate.gain;p.setValueAtTime(1,S.at(Math.max(S.t0,a-.001)));if(a>=S.t0)p.setValueAtTime(0,S.at(a));else p.setValueAtTime(0,S.base);if(b>S.t0)p.setValueAtTime(1,S.at(b))}}
 // blips da digitação: narrador agudo e limpo; entidade grave e distorcida
 function blip(S,x,i,v){if(v==='n'){const f=560+(i%3)*18;tone(S,x,'square',f,f*.97,.09,.045,.04,'voice')}
  else{const f=v==='E'?70:95+(i%4)*7;tone(S,x,'sawtooth',f,f*.8,v==='E'?.2:.13,v==='E'?.18:.1,.1,'voice',true);tone(S,x,'square',f/2,f/2.2,.07,.1,.1,'voice')}}
 return {reg,O,N,F,G,env,run,shot,noise,tone,sweep,whoosh,rewind,creak,breath,breathing,groan,beat,heartbeat,knock,step,steps,glass,impact,crack,slam,boom,ring,click,lockClunk,rattle,caw,tinnitus,stinger,riser,layer,drone,tension,room,wind,fire,crickets,drips,birds,waves,pad,chase,silence,blip};
})();

const API={W,H,LW,LH,PX,clamp,sm,win,lerp,rng,hash,q,line,pine,glow,nightSky,fog,hooded,post,fade,flash,desat,shake,badge,glitch,countdown,dialog,prepDLG,YPOS};
root.ENGINE={...API,init,frame,audioInit,session,stopSession,SND,MIX};
})(typeof window!=='undefined'?window:globalThis);
