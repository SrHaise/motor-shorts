/* =====================================================================
   THE KNIFE OR THE BOOK (40,5s) — versão PIXEL ART
   Mesmos textos, tempos e som do vídeo original; cenas redesenhadas
   pixel a pixel em 180×320 (ampliado 6×) com o kit pix.js.
   Exemplo completo do MODO PIXEL: em vez de scene(), o vídeo tem pix(t,E),
   que desenha numa tela de 180×320 com o kit PIX (ver PIXEL.md).
   Render igual aos outros: node render.js exemplo_pixel.js saida.mp4
   ===================================================================== */
const {Pix,mat,MI,dith,clamp,sm,lerp,hash,h2,rng,PW,PH,bay}=PIX;

/* ---------- paleta: rampas por material (escuro → claro) ---------- */
mat('pedra',['#07080B','#101219','#171A21','#232835','#2E3446','#394052','#4d5872','#6F86B8']);
mat('couro',['#120a06','#2A1A10','#4A2F1A','#63401f','#80552a','#a06c38']);
mat('metal',['#121318','#24262d','#3d4049','#5d626d','#8b919c','#c9cfd8']);
mat('papel',['#2a2418','#4a4436','#6d6450','#8c8266','#a39a80','#d8cfb0','#fff6e0']);
mat('ouro',['#2A1A10','#5a3418','#9a5c24','#d08a36','#FFC878','#fff1c8'],['#2A1A10','#5a3418','#9a5c24','#d08a36','#FFC878','#fff1c8']);
mat('terra',['#07050a','#120c08','#1f150d','#2e1f12','#3d2a18','#4A2F1A','#63401f']);
mat('noite',['#1a2133','#2a3550','#3d4a66','#5a6c93','#8ea3cc','#b8c8e8']);
mat('pinho',['#07080B','#0d0f14','#171A21']);
mat('lamina',['#141a2a','#2E3446','#4a5a80','#6F86B8','#94a6d0','#B8C6E6','#ffffff']);
mat('madeira',['#140c07','#2B2019','#4A2F1A','#63401f']);
mat('cabelo',['#060504','#120e0b','#1c1612','#2e241c','#463626']);
mat('ceu',['#2f6fa8','#4a94c9','#6fb9e0','#9BE3F5','#c9f3fb','#ffffff']);
mat('halo',['#b9ead9','#d9efb0','#efe98a','#FFE066','#fff6c0','#ffffff']);
mat('nuvem',['#6fa9cf','#a9d6ee','#dff4fc','#ffffff']);
mat('mar',['#123f66','#185d86','#2386ad','#4FC3E0','#8fe0ef','#ffffff']);
mat('areia',['#7a5c3a','#a8865a','#cfb487','#e8d6aa','#F4E9C8','#fffaf0']);
mat('tronco',['#20150e','#3b2a1c','#5c432c','#7d6040','#a2825a']);
mat('folha',['#0a211c','#12392f','#1F5A4A','#2c7556','#4a9a64','#8cc272']);
mat('coco',['#1a100a','#3a2414','#5c3a20']);
mat('oliva',['#10140f','#1d241b','#2c3529','#3E4A3A','#56664f','#7a8c62','#c8cc7e']);
mat('mochila',['#120c08','#2B2019','#45321f','#634a2e','#86663f','#b89458']);
mat('manta',['#3a2a10','#6b4c1c','#9a7230','#c9a048','#f0d070']);
mat('jeans',['#0f1320','#1c2338','#2c3654','#3f4c72','#5d6c96']);
mat('pele',['#3a2218','#6b4030','#8A6A55','#b08a70','#d0aa88']);
mat('caverna',['#07080B','#171A21','#232835','#2E3446','#394052','#6F86B8']);
mat('metal_',['#2a2c33','#5d626d','#8b919c']);
mat('contorno',['#07080B']);
mat('contornoP',['#141a14']);
mat('borda',['#9BE3F5','#e8fbff','#ffffff']);
mat('branco',['#fff8eb','#ffffff']);
mat('cinza',['#100d0e','#1A1617','#2a2324','#3B3536','#4A4345','#5A5254','#6B6264','#847a7c']);
mat('sangue',['#1a0504','#4A1414','#7a2a22','#c0281a','#FF2A1A','#ff8a6a']);

/* ---------- utilidades ---------- */
// objeto girado desenhado pixel a pixel: fn(lx,ly) devolve [material,nível,flag] no espaço local
function rot(p,cx,cy,ang,R,fn){const c=Math.cos(ang),s=Math.sin(ang);p.begin();
 for(let Y=Math.max(0,Math.floor(cy-R));Y<=Math.min(PH-1,cy+R);Y++)for(let X=Math.max(0,Math.floor(cx-R));X<=Math.min(PW-1,cx+R);X++){
  const dx=X+.5-cx,dy=Y+.5-cy,r=fn(dx*c+dy*s,-dx*s+dy*c);if(r)p.px(X,Y,r[0],r[1],r[2]||0)}
 return p.end()}
const inE=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
function vign(x,y,k=1.6,a=.55,b=1.15){const vx=(x-90)/90,vy=(y-165)/165,v=Math.sqrt(vx*vx*1.1+vy*vy);return -k*sm(a,b,v)}
// feixe diagonal: devolve intensidade 0..1 no ponto
function beamAt(x,y,b){const u=(y-b[1])/(b[3]-b[1]);if(u<0||u>1.15)return 0;const xc=b[0]+(b[2]-b[0])*u,hw=lerp(2.5,b[5]||15,u);const d=Math.abs(x-xc)/hw;return d<1?(1-u*.45)*(d<.75?1:.5):0}
function beamDust(p,t,b,seed,n=10,m='pedra',l=7){for(let i=0;i<n;i++){const u=(hash(i+seed)+t*.04*(1+hash(i*3+seed)))%1,xc=b[0]+(b[2]-b[0])*u,hw=lerp(2.5,b[5]||15,u);
 const x=xc+(hash(i*7+seed)-.5)*hw*1.6+Math.sin(t*.8+i)*1.5,y=b[1]+(b[3]-b[1])*u;if((Math.sin(t*1.3+i*2)>-.3))p.px(x,y,m,l,1)}}
const GLIFOS=[['.111.','1...1','1.1.1','1...1','.111.'],['11111','....1','.11.1','.1..1','.1111'],['1.1.1','1.1.1','11111','1.1.1','1.1.1'],['..1..','.1.1.','1...1','.1.1.','..1..']];
function glifo(p,gx,gy,k,d=1.6){const gl=GLIFOS[k%4];for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(gl[j][i]==='1'){p.add(gx+i,gy+j,-d);p.add(gx+i,gy+j+1,d*.45)}}
// tijolo de pedra procedural: nível de luz da pedra na coordenada (x,y) do desenho
function tijolo(x,y,bw=14,bh=7,base=2.7,seed=0){const row=Math.floor(y/bh),off=hash(row*3.7+seed)*bw,bx=Math.floor((x+off)/bw),fx=((x+off)%bw+bw)%bw,fy=((y%bh)+bh)%bh;
 if(fy>=bh-1||fx>=bw-1)return 1.2;const n=h2(Math.floor(x),Math.floor(y)),b=base+(hash(bx*7.1+row*13.3+seed)-.5)*.8;let L=b+(n<.07?-1:n>.96?.8:0);
 if(fy<1)L+=.9;else if(fy>=bh-2)L-=.6;if(fx<1)L+=.4;return L}

/* ---------- o andarilho (sprite reaproveitado da praia) ---------- */
const LEG={h:['oliva',3],H:['oliva',4],G:['oliva',5.4],d:['oliva',2],k:['oliva',1],M:['manta',3],m:['manta',2],n:['manta',1],
 C:['mochila',4],B:['mochila',3],b:['mochila',2],e:['mochila',1],s:['mochila',1],x:['metal_',1],
 J:['jeans',3],j:['jeans',2],q:['jeans',1],F:['mochila',1.6],f:['mochila',1],E:['mochila',0],p:['pele',2],P:['pele',3]};
const TRONCO=['........hhhh........','......hGHHhhhd......','.....hGHHhhhhhd.....','.....GHHhhhhhhd.....','....hGHhhhhhhhdd....','....hHhhhhhhhhdd....',
 '....hHhhhhhhhddd....','....dhhhhhhhhddk....','.....dhhhhhhdddk....','...MMMMMMMMMMMMMMm..','..hmMmmmmmmmmmmmmnd.','.Ghnnnnnnnnnnnnnnndk',
 '.GHhCCCCCCCCCCbehdk.','.GHhCBBBBBBBBBbehdk.','.GHhCBBBBssBBBbehdk.','.GHhCBBBBssBBBbehdk.','.GHhCBBBBssBBBbehdk.','.HhhCeeeexxeeeeehdk.',
 '.HhdCbbbbssbbbbehdk.','.HhdCbbbbbbbbbbehdk.','.HhdCbbbbbbbbbbehdk.','.hhdCbbbbbbbbbbehdk.','.hhdCbeeeeeeeebeddk.','.hhdCbbbbbbbbbbeddk.',
 '.PpdCbbbbbbbbbbedpp.','.PpdbbbbbbbbbbbeddP.','..pdeeeeeeeeeeeedp..','...hhhhhhhhhhhhdd...','...hhhhhhhhhhhddd...','...ddddddddddddddk..'];
function pernas(liftL,liftR){const rows=['....JJjjjjjjjjqq....'];
 for(let r=0;r<12;r++){let s='';for(let c=0;c<20;c++){let ch='.';if(c>=5&&c<=8&&r<12-liftL)ch='Jjjq'[c-5];if(c>=11&&c<=14&&r<12-liftR)ch='Jjjq'[c-11];s+=ch}rows.push(s)}
 for(let r=0;r<3;r++)rows.push('....................');
 const put=(row,c0,str)=>{const a=rows[row+1].split('');for(let i=0;i<str.length;i++)if(str[i]!=='.')a[c0+i]=str[i];rows[row+1]=a.join('')};
 for(const [c0,lift] of [[5,liftL],[11,liftR]]){const y=12-lift;put(y,c0,'FffF');put(y+1,c0-1,lift?'EEEEE':'FFffF');if(!lift)put(y+2,c0-1,'EEEEE')}
 return rows}
const PASSOS=[[3,0],[0,0],[0,3],[0,0]];
function andarilho(p,x,feet,t,walk){const fr=walk?Math.floor(t*8)%4:1,[a,b]=PASSOS[fr],bob=walk&&fr%2===1?-1:0;
 const rows=TRONCO.concat(pernas(a,b)),top=feet-rows.length+1+bob;p.begin();p.sprite({rows,leg:LEG},x-10,top);
 const sw=Math.round(Math.sin((t-.12)*8)*1.4);for(let k=0;k<5;k++)p.px(x+6+(k>2?sw:0),top+18+k,'mochila',k===4?2.6:1.2);
 const g=p.end();p.outline(g,'contornoP',0);p.rim(g,-1,-1,1.2)}

/* =====================================================================
   CÂMARA (P2, P5, P6): sala com dois altares, desenhada por pixel com câmera (zoom/panorâmica)
   ===================================================================== */
const BEAMS=[[22,45,40,165,.3,14],[73,47,108,227,.2,16],[127,45,160,210,.17,15]];
function camara(p,t,o={}){
 const z=o.z||1,ox=o.ox||0,oy=o.oy||0,ZX=90,ZY=167,ax=o.ax||[50,122],ty=o.ty||166;
 const inv=(X,Y)=>[(X+.5-ox-ZX)/z+ZX,(Y+.5-oy-ZY)/z+ZY],T=(x,y)=>[(x-ZX)*z+ZX+ox,(y-ZY)*z+ZY+oy];
 const ceil=x=>50+Math.sin(x*.28)*4+hash(Math.floor(x/7))*7-6;
 for(let Y=0;Y<PH;Y++)for(let X=0;X<PW;X++){const [x,y]=inv(X,Y);
  const topL=43-(10-x)*60/77,botL=183+(10-x)*100/77,topR=43-(x-170)*60/77,botR=183+(x-170)*100/77;
  if(x<10&&y>topL&&y<botL)p.px(X,Y,'pedra',1.3+tijolo(x*.6,y,10,8,.7,3)*.5);
  else if(x>170&&y>topR&&y<botR)p.px(X,Y,'pedra',1.3+tijolo(x*.6,y,10,8,.7,5)*.5);
  else if(y<ceil(x)||(x<10&&y<=topL)||(x>170&&y<=topR))p.px(X,Y,'pedra',.6+(h2(Math.floor(x),Math.floor(y))<.1?.8:0)+(y>ceil(x)-2&&x>10&&x<170?.8:0));
  else if(y<183&&x>=10&&x<=170)p.px(X,Y,'pedra',tijolo(x,y,13,7,2.3,1)-1.5*(1-sm(55,110,y)));
  else{const n=h2(Math.floor(x),Math.floor(y));p.px(X,Y,'terra',lerp(1.6,4.3,clamp((y-183)/140,0,1))+(n<.06?-1:n>.95?1:0))}}
 for(const [gx,gy,k] of [[22,70,0],[48,98,2],[70,64,1],[100,92,3],[128,70,0],[150,100,2],[30,130,3],[148,135,1]]){const [X,Y]=T(gx,gy);glifo(p,Math.round(X),Math.round(Y),k)}
 // pista: pegadas indo só até o altar da direita
 const bx=ax[1]-3,by=ty+49;for(let i=0;i<10;i++){const k=i/9,[X,Y]=T(lerp(25,bx,k)+(i%2?2:-2)*lerp(1,.5,k),lerp(310,by,Math.pow(k,.8)));p.add(X,Y,-1.4);p.add(X+1,Y,-1.4);if(k<.5)p.add(X,Y+1,-1)}
 // altares
 for(let k=0;k<2;k++){const a=ax[k],q=(pts,l)=>p.poly(pts.map(([x,y])=>T(x,y)),'pedra',l);
  p.begin();
  q([[a-12.5,ty+6],[a+12.5,ty+6],[a+12.5,ty+50],[a-12.5,ty+50]],(X,Y)=>{const [x,y]=inv(X,Y);return 3+(h2(X,Y)<.07?-1:0)-(x>a?1.3:0)-(y<ty+8?1:0)+(Math.abs(((y-ty)%11))<.9/z?-1.4:0)});
  q([[a-18,ty],[a+18,ty],[a+18,ty+6],[a-18,ty+6]],(X,Y)=>{const [x,y]=inv(X,Y);return y<ty+1.2/z?5.5:(y>ty+4.6?2:4)});
  q([[a-14.5,ty+47],[a+14.5,ty+47],[a+14.5,ty+51],[a-14.5,ty+51]],2.4);
  const g=p.end();p.outline(g,'contorno',0);
  if(k===0){p.poly([T(a-12,ty-1.6),T(a-6,ty-1.6),T(a-6,ty),T(a-12,ty)],'madeira',2);p.poly([T(a-6,ty-2.6),T(a+12,ty-1.6),T(a+12,ty),T(a-6,ty)],'lamina',4.6,1);const [X,Y]=T(a+4,ty-2);p.px(X,Y,'lamina',6,1)}
  else{p.poly([T(a-9,ty-4.5),T(a+9,ty-4.5),T(a+9,ty),T(a-9,ty)],'couro',2.5);p.poly([T(a-9,ty-1.3),T(a+9,ty-1.3),T(a+9,ty),T(a-9,ty)],'couro',1);const [X,Y]=T(a,ty-3);p.px(X,Y,'ouro',4.6,1);p.px(X+1,Y,'ouro',4,1)}}
 // poeira nos feixes
 if(!o.noDust)for(let i=0;i<3;i++){const b=BEAMS[i].map((v,j)=>j<4?(j%2?(v-ZY)*z+ZY+oy:(v-ZX)*z+ZX+ox):v);beamDust(p,t,b,i*31,12)}
 const halo=o.halo??.45;
 return (X,Y)=>{const [x,y]=inv(X,Y);let L=0,w=0;
  // a câmara brilha mais no centro (o gradiente do original, agora em faixas)
  L+=1.1*(1-sm(20,95,Math.hypot(x-90,(y-125)*1.2)))*(o.wallLight??1);
  for(const b of BEAMS)L+=beamAt(x,y,b)*b[4]*6*(o.beam??1);
  const d=Math.hypot(x-ax[1],(y-ty+3)*1.1),hk=Math.max(0,1-d/(34*halo+8));L+=hk*hk*2.4*halo;w=Math.max(w,Math.min(1,hk*2));
  if(o.torch){const [sx,sy]=o.torch,dt=Math.hypot(x-sx,(y-sy)*1.25),tk=Math.max(0,1-dt/30);L+=tk*1.9;w=Math.max(w,tk*2)}
  return [L+vign(X,Y)+(o.dark||0),w]};
}

/* mão com luva sem dedos + manga (espaço local: punho na origem) */
function punho(lx,ly,rimSide){
 if(inE(lx,ly,-3.7,-6.3,5.7,2.7))return ['pele',ly<-7.5?3.6:2.8];
 if(inE(lx,ly,1.3,3.7,12,11.7)){const e=((lx-1.3)/12)**2+((ly-3.7)/11.7)**2;return ['mochila',e>.75&&lx<0&&ly<4?2.6:(lx>5?1.2:1.8)]}
 for(let i=0;i<4;i++)if(inE(lx,ly,-11.7,-2.3+i*4.5,3.2,2.2))return ['pele',ly<-2.3+i*4.5-.8?3:2];
 const c=Math.cos(.5),s=Math.sin(.5),sx=lx*c-ly*s,sy=lx*s+ly*c;
 if(sx>-10.3&&sx<10.3&&sy>8.3&&sy<150)return sy<12.6?['mochila',1.6]:['oliva',sx<-6?3.8:(sx>5?2:2.8)];
 return null}

/* ---------- P1: sobre o ombro, a laje fecha a entrada (0–2 s) ---------- */
function pinheiro(p,x,base,h,w){for(let y=Math.floor(base-h);y<base;y++){const u=(y-(base-h))/h,tier=(u*5)%1,ww=w*(.25+u*.75)*(.35+tier*.65)/2;
 const jag=hash(y*3.3+x)*1.2;for(let X=Math.round(x-ww-jag);X<=Math.round(x+ww+jag*.5);X++)p.px(X,y,'pinho',X<x-ww*.3?1:2)}
 p.rect(Math.round(x-1),Math.round(base-h*.15),2,Math.ceil(h*.15),'pinho',0)}
function p1(t){
 const p=new Pix(),rec=t>=.7?Math.exp(-(t-.7)*5):0,wk=sm(1.8,2.0,t),light=1-sm(.7,1.0,t);
 const inArch=(x,y)=>x>=63&&x<=117&&y<=192&&(y>=123||Math.hypot(x-90,y-123)<=27);
 const fall=clamp((t-.2)/.5,0,1),sb=lerp(96,192,fall*fall);
 for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){
  if(y>192){const n=h2(x,y);p.px(x,y,'terra',lerp(1.8,4.6,(y-192)/128)+(n<.06?-1:n>.95?1:0));continue}
  if(inArch(x,y)){
   if(y>=sb-107&&y<sb){const n=h2(x,y-Math.round(sb));let L=2.4+(n<.08?-1:0);if(x<65)L=6.6;if(y>sb-4)L=1;if(Math.abs(((y-sb)%16))<1)L=1.6;p.px(x,y,'pedra',L)}
   else p.px(x,y,'noite',lerp(4.6,2,clamp((y-96)/96,0,1)));continue}
  const d=Math.hypot(x-90,y-123),ring=(y<123?Math.abs(d-30):Math.min(Math.abs(x-60),Math.abs(x-120)));
  if(ring<3.2&&y<=192&&(y<123?true:x>55&&x<125))p.px(x,y,'pedra',4.4+(ring<1.2?1.4:0)-(x>90?.8:0)+(h2(x,y)<.08?-1:0));
  else p.px(x,y,'pedra',tijolo(x,y,13,7,2.2,7)-1.4*(1-sm(25,90,y)))}
 // pinheiros por trás da laje (só aparecem enquanto ela cai)
 for(const [x,h,w] of [[72,70,25],[104,83,28],[89,50,18]])for(let y=Math.floor(192-h);y<192;y++)for(let X=x-15;X<x+15;X++){}
 const P2=new Pix();for(const [x,h,w] of [[72,70,25],[104,83,28],[89,50,18]])pinheiro(P2,x,192,h,w);
 for(let i=0;i<PW*PH;i++)if(P2.m[i]>=0){const x=i%PW,y=(i/PW)|0;if(inArch(x,y)&&!(y>=sb-107&&y<sb)){p.m[i]=P2.m[i];p.l[i]=P2.l[i]}}
 if(fall>0)for(let x=63;x<=117;x++)if(sb<192)p.px(x,Math.round(sb),'pedra',.2);
 for(const [gx,gy,k] of [[12,60,0],[150,48,1],[20,150,2],[148,140,3],[40,30,3],[132,95,0]])glifo(p,gx,gy,k);
 // nuvem de poeira do impacto
 if(t>=.7){const d=t-.7,ex=1-Math.exp(-d*3);for(let i=0;i<70;i++){const a=.1+hash(i*3.3)*(Math.PI-.2),sp=17+hash(i*5.1)*77;
  const x=90+Math.cos(a)*sp*ex*1.3,y=192-Math.sin(a)*sp*ex*.75+d*d*3;if(hash(i*1.7)>1-d/1.5)continue;
  const br=beamAt(x,y,[35,33,108,220,0,14])+beamAt(x,y,[72,32,150,207,0,14])>0;p.px(x,y,'pedra',br?6.6:3.2,br?1:0);if(hash(i)<.4)p.px(x+1,y,'pedra',br?6:3,br?1:0)}}
 // ombro e cabeça (em primeiro plano, contra a luz)
 const ox=-rec*1.7,oy=rec*1.7;p.begin();
 p.ell(11.7+ox,313+oy,43,42,'oliva',(X,Y,u,v)=>u<-.2&&v<-.6?4:3+(h2(X,Y)<.05?-.8:0));
 p.poly([[28+ox,275+oy],[41.7+ox,273+oy],[61.7+ox,327],[46.7+ox,327]],'mochila',(X,Y)=>X<34+ox?2.4:1.6);
 const hood=rot(p,18.3+ox,270+oy,-.25,34,(lx,ly)=>inE(lx,ly,0,0,31.7,12)?['oliva',ly<-6?3.2:(Math.abs(ly+1)<.6?1.4:2.2)]:null);
 p.begin();p.ell(3.3+ox,240+oy,28,36,'cabelo',(X,Y,u,v)=>2.8+(hash(X*3.1+Math.floor((Y+X*.3)/3))<.3?-1:0)+(u>.3?-.6:0));const head=p.end();
 const body=new Set([...head,...hood]);
 const sw=(t-.1>=.7?Math.sin((t-.8)*13)*Math.exp(-(t-.8)*2.5)*.7:0)+Math.sin(t*2.2)*.05;
 for(let k=0;k<20;k++)p.px(39+ox+Math.sin(sw)*k,267+oy+Math.cos(sw)*k,'oliva',4.2);p.rect(Math.round(38+ox+Math.sin(sw)*20),Math.round(286+oy),2,2,'oliva',4.6);
 p.outline(body,'contorno',0);p.rim(body,1,-1,1.6+light,2);
 // chicote: borrão em linhas
 if(wk>0)for(let i=0;i<22;i++){const y=Math.floor(hash(i*7.3)*PH),x0=hash(i+Math.floor(t*30))*100;for(let x=x0;x<x0+50+hash(i*2)*80;x++)p.px(x,y,'pedra',5,1)}
 const sh=t>=.7&&t<1.4?4:(t>=1.4?1:0),fr=Math.floor(t*30);
 return {p,shake:[-wk*183+(hash(fr)-.5)*sh*2,(hash(fr+9)-.5)*sh*2],light:(x,y)=>{let L=0;
  if(inArch(x,y)||y<192)L+=light*1.6*(1-sm(10,80,Math.hypot(x-90,y-150)));
  L+=(beamAt(x,y,[35,33,108,220,0,14])+beamAt(x,y,[72,32,150,207,0,14]))*1.3;
  return [L+vign(x,y,1.4)-(t>=.7?.4:0)-wk*2,0]}};
}

/* ---------- P2: 1ª pessoa entrando na câmara, lanterna varrendo (2–6,5 s) ---------- */
function p2(t){
 const p=new Pix(),lt=t-2,z=1+.08*clamp(lt/4.5,0,1),bob=Math.abs(Math.sin(t*Math.PI*2)),wIn=(1-sm(2,2.15,t))*63;
 const pul=t>4.2&&t<4.8?Math.sin(Math.PI*(t-4.2)/.6):0;
 const sx=lerp(42,138,sm(3,5.5,t)),sy=150;
 const L0=camara(p,t,{z,ox:wIn,oy:bob,halo:.4+.2*pul,torch:[sx,sy]});
 // lanterna e punho
 const hx=143+wIn,hy=277+bob*.5+Math.round(Math.sin(t*3))*.5,th=Math.atan2(sx-hx,-(sy-hy))*.55;
 const g=rot(p,hx,hy,th,60,(lx,ly)=>{const f=punho(lx,ly);if(f)return f;
  if(lx>-2.7&&lx<2.7&&ly>-33&&ly<-31.6)return ['ouro',5,1];
  if(lx>-3.7&&lx<3.7&&ly>-31.7&&ly<-26)return ['metal',lx<-2?4.4:3.2];
  if(lx>-2.7&&lx<2.7&&ly>-28.3&&ly<-5)return ['metal',lx<-1.5?3.4:(lx>1.5?1.4:2.4)];return null});
 p.outline(g,'contorno',0);p.rim(g,-1,-1,1.2);
 // cone de luz quente até a parede
 const tx=hx+Math.sin(th)*33,ty2=hy-Math.cos(th)*33;
 const sweep=t<2.15?[ ]:null;
 if(t<2.15)for(let i=0;i<16;i++){const y=Math.floor(hash(i*7.3)*PH),x0=hash(i+Math.floor(t*30))*150;for(let x=x0;x<x0+50;x++)p.px(x,y,'pedra',6,1)}
 return {p,light:(X,Y)=>{const r=L0(X,Y);const u=(ty2-Y)/(ty2-sy);if(u>0&&u<1){const cx=lerp(tx,sx,u),hw=lerp(1.5,20,u);if(Math.abs(X-cx)<hw){r[0]+=.7*(1-u*.4);r[1]=Math.max(r[1],.45)}}return r}};
}

/* =====================================================================
   O LIVRO (P3 e P8)
   ===================================================================== */
const CANTO={leg:{a:['metal',4],b:['metal',3],c:['metal',2],d:['metal',1],r:['metal',5],s:['metal',1]},rows:[
 'aaaaaaaaab','abbbbbbbcd','abrbbbbcd.','abbsbbcd..','abbbbcd...','abbbcd....','abbcd.....','abcd......','acd.......','bd........']};
const CADEADO={leg:{a:['metal',4],b:['metal',3],c:['metal',2],d:['metal',1],e:['metal',0],k:['pedra',0],R:['couro',4],r:['couro',3]},rows:[
 '....bbbbbbbb....','...bacccccccb...','..bac......bcd..','..bc........cd..','..bc........cd..','..bc........cd..','..bc........cd..',
 'eeeeeeeeeeeeeeee','eaaaaaaaaaaaaabe','eabbbbbbbbbbbbce','eabbbbrbbbbbbbce','eabbbbbbkkbbbbce','eabbbbbkkkkbbbce','eabbbbbkkkkbbRce',
 'eabbbbbbkkbbbbce','eabbRbbbkkbbbbce','eabbbbbbkkbbbbce','eabbbbbbbbbbbbce','ebccccccccccccde','eddddddddddddd.e','eeeeeeeeeeeeeeee']};
const CADEADO_ABERTO={leg:CADEADO.leg,rows:['....bbbbbbbb....','...bacccccccb...','..bac......bcd..','..bc........cd..','..bc........cd..','..bc............','..bc............','..bc............','..bc............'].concat(CADEADO.rows.slice(7))};
function sala(p){
 for(let y=0;y<210;y++)for(let x=0;x<PW;x++)p.px(x,y,'pedra',tijolo(x,y,17,9,2.9,11)-1.8*Math.max(0,1-y/90)**1.4);
 for(const [gx,gy,k] of [[22,40,0],[140,30,1],[30,96,2],[150,92,3],[96,22,0],[12,150,1],[160,150,2]])glifo(p,gx,gy,k);
 for(let x=4;x<176;x++){p.px(x,203,'pedra',5.6);p.px(x,204,'pedra',5.1);p.px(x,205,'pedra',4.9);p.px(x,206,'pedra',4.6)}
 for(let y=207;y<223;y++)for(let x=4;x<176;x++){const n=h2(x,y);let L=3.8+(n<.07?-1:0)-(y-207)*.05;if(y===207)L=5.4;if(y===222)L=1.6;if(x===4)L+=.8;if(x===175)L-=1;p.px(x,y,'pedra',L)}
 for(const [cx,w] of [[18,3],[61,2],[133,4],[168,2]])for(let i=0;i<w;i++){p.px(cx+i,203,'pedra',2);p.px(cx+i+1,204,'pedra',3.5)}
 for(let y=223;y<PH;y++)for(let x=22;x<158;x++){const bx=(x-22+((Math.floor((y-223)/22)%2)*20))%40,by=(y-223)%22;
  const n=h2(x,y);let L=3+(n<.06?-1:0);if(by===21||bx===39)L=1.3;else if(by===0)L+=.8;L-=1.6*sm(70,150,x);if(y<229)L-=1.2*(1-(y-223)/6);p.px(x,y,'pedra',L)}
 for(let x=22;x<158;x++)p.px(x,223,'pedra',.8)}
const BT=123,BB=205,btop=u=>Math.round(38-6*u),bbot=u=>Math.round(142+6*u);
function capa(p,t,glow,open,glint){
 const sx=open>0?1-open:1,X=x=>Math.round(32+(x-32)*sx);
 p.begin();
 for(let y=BT;y<BB;y++){const u=(y-BT)/(BB-BT),xl=btop(u),xr=bbot(u);
  for(let x=xl;x<=xr;x++){const n=h2(x,y);let L=1.5+(n<.1?-.8:n>.93?.8:0)+(.5-u)*.6;const dl=Math.min(x-xl,xr-x,y-BT,BB-1-y);
   if(dl===0)L=1.2;else if(dl===1&&(x-xl===1||y-BT===1))L=3.3;else if(dl===1)L=1.4;else if(dl===5)L=1;else if(dl===6&&(x-xl===6||y-BT===6))L=3;if(x-xl<3)L-=.5;
   p.px(X(x),y,'couro',L)}}
 const g=p.end();p.outline(g,'pedra',0);
 for(const sy of [136,185]){const u=(sy-BT)/(BB-BT),xl=btop(u)-1,xr=bbot(u)+1;
  for(let x=xl;x<=xr;x++){p.px(X(x),sy-1,'pedra',0);p.px(X(x),sy,'metal',4.2);p.px(X(x),sy+1,'metal',3);p.px(X(x),sy+2,'metal',2.6);p.px(X(x),sy+3,'metal',1.4);p.px(X(x),sy+4,'pedra',0)}
  for(const rx of [44,70,108,136]){p.px(X(rx),sy+1,'metal',5);p.px(X(rx+1),sy+1,'metal',3.5);p.px(X(rx),sy+2,'metal',3.5);p.px(X(rx+1),sy+2,'metal',1)}}
 if(open>0)return;
 p.sprite(CANTO,btop(0),BT);p.sprite(CANTO,bbot(0)-9,BT,{flip:1});p.sprite(CANTO,btop(1),BB-10,{flipY:1});p.sprite(CANTO,bbot(1)-9,BB-10,{flip:1,flipY:1});
 const cx=90,cy=164,Lr=glow>0?3.2+glow*1.4:.6,f=glow>0?1:0,mm=glow>0?'ouro':'couro';
 p.circle(cx,cy,15,mm,Lr,f);p.line(cx,cy-11,cx+10,cy+7,mm,Lr,f);p.line(cx+10,cy+7,cx-10,cy+7,mm,Lr,f);p.line(cx-10,cy+7,cx,cy-11,mm,Lr,f);p.circle(cx,cy+1,3,mm,Lr,f);
 if(glow>0)for(let y=cy-24;y<=cy+24;y++)for(let x=cx-24;x<=cx+24;x++){const d=Math.hypot(x-cx,y-cy);if(d>12&&d<23&&dith(x,y,glow*.9*(1-Math.abs(d-17)/6)))p.add(x,y,1)}
 p.px(cx,cy+1,mm,Lr+1,f);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;p.line(cx+Math.cos(a)*17,cy+Math.sin(a)*17,cx+Math.cos(a)*20,cy+Math.sin(a)*20,mm,Lr-.4,f)}
 for(const k of glint||[]){const d=t-k;if(d>=0&&d<.5){const a=-Math.PI/2+d/.5*Math.PI*2,gx=Math.round(cx+Math.cos(a)*15),gy=Math.round(cy+Math.sin(a)*15);
  p.px(gx,gy,'ouro',5,1);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0]])p.px(gx+dx,gy+dy,'ouro',Math.abs(dx)>1?4:4.6,1)}}
 for(let y=158;y<168;y++)for(let x=128;x<146;x++)p.px(x,y,'couro',y===158?3:(y===167?.6:1.8));
 for(let y=159;y<167;y++){p.px(141,y,'metal',3.6);p.px(142,y,'metal',2.2)}}
function livro(p,t,st){
 for(let x=30;x<154;x++)for(let y=206;y<210;y++)p.add(x,y,-2.2+(y-206)*.4);
 for(let y=BB-1;y<=BB+4;y++)for(let x=btop(1)+1;x<=bbot(1)-1;x++)p.px(x,y,'papel',(y-BB)%2?1.4:2.4-(x>140?1:0));
 const open=st.open||0;
 if(open<1)capa(p,t,st.glow||0,open,st.glint);
 else{
  // livro aberto: duas páginas com linhas de texto
  p.begin();p.poly([[38,123],[90,125],[90,205],[32,205]],'papel',(x,y)=>3.4+(y>127&&(y-128)%6<1&&x>40&&x<84-((y>>3)%3)*5?-1.4:0)-(x>84?.8:0));
  p.poly([[90,125],[142,123],[148,205],[90,205]],'papel',(x,y)=>4+(y>127&&(y-128)%6<1&&x>96&&x<140-((y>>2)%4)*5?-1.4:0)-(x<95?.8:0));
  const g=p.end();p.outline(g,'pedra',0);for(let y=125;y<205;y++)p.px(90,y,'couro',1);
  const ft=st.flipT;if(ft>=0)for(let k=0;k<2;k++){const ph=(ft*12+k*.5)%1,cx=Math.cos(Math.PI*ph),idx=Math.floor(ft*12+k*.5),px=90+cx*55,lift=Math.sin(Math.PI*ph)*12;
   p.begin();p.poly([[90,125],[px,124-lift],[px+cx*7,205-lift*.5],[90,205]],'papel',(x,y)=>idx%2?5:4.2);const pg=p.end();p.outline(pg,'pedra',0)}
  const Lt=st.light||0;if(Lt>0)for(let i=0;i<7;i++){const x=Math.round(50+i*13+Math.sin(t*9+i)*1.3),w=Math.round(1.5+hash(i)*2.5),h=Lt*(117+hash(i+3)*83);
   for(let y=Math.round(167-h);y<167;y++)for(let dx=-w;dx<=w;dx++)if(dith(x+dx,y,(.35+.5*Lt)*(1-(167-y)/h*.6)))p.px(x+dx,y,'papel',6,1)}
  if(ft>=0){for(let i=0;i<14;i++){const d=((ft*1.6+hash(i))%1),s=hash(i*4)<.5?-1:1,y=Math.round(117+hash(i*2)*100),x0=90+s*(20+d*117);for(let k=0;k<15;k++)p.px(x0+k*s,y,'metal',4,1)}
   for(let i=0;i<40;i++){const d=((ft*1.2+hash(i*9))%1),a=hash(i*3.7)*6.28;p.px(90+Math.cos(a)*d*117,165+Math.sin(a)*d*83,'papel',3.4,1)}}}
 // cadeado
 const lk=st.lockT??-1,pop=lk>=0?sm(0,.1,lk):0;
 if(pop<=0){const g=p.sprite(CADEADO,138,155,{group:1});p.outline(g,'pedra',0)}
 else{const ang=pop*1.1;const spr=CADEADO_ABERTO;const g=rot(p,146+pop*20,165+pop*28,ang,16,(lx,ly)=>{const i=Math.floor(lx+8),j=Math.floor(ly+10);const r=spr.rows[j];if(!r)return null;const c=r[i];if(!c||c==='.')return null;return spr.leg[c]});p.outline(g,'pedra',0)}
}
function p3(t){const p=new Pix(),glow=.4+.3*(.5-.5*Math.cos(Math.PI*(t-6.5)));sala(p);livro(p,t,{glow,glint:[7.5,9.5]});
 for(let i=0;i<26;i++){const x=25+hash(i*2.2)*130+Math.sin(t*.7+i)*3.4,y=100+hash(i*5.3)*110+Math.sin(t*.5+i*1.7)*5,a=.5+.5*Math.sin(t*1.2+i);if(a>.25)p.px(x,y,'ouro',a>.7?4.4:3.3,1)}
 return {p,shake:[0,Math.round(Math.sin(t*1.6)*.7)],light:(x,y)=>{const d=Math.hypot(x-90,(y-164)*.9),occ=y>208?.25:1,k=Math.max(0,1-d/(80+glow*30))*occ;return [k*k*(1.6+glow)*.6+vign(x,y,1.7),Math.min(1,k*k*2.6)]}}}
function p8(t){const p=new Pix();sala(p);
 const open=t<28.7?0:(t<28.767?.5:1),Lt=sm(28.8,30.9,t);
 livro(p,t,{glow:0,lockT:t>=28.5?t-28.5:-1,open,flipT:t>=28.8?t-28.8:-1,light:Lt});
 if(t>=30.9){const r=sm(30.9,31.1,t)*250;p.disc(90,165,Math.round(r),'branco',1,1);for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const d=Math.hypot(x-90,y-165);if(d>r&&d<r*1.4+3&&dith(x,y,1-(d-r)/(r*.4+3)))p.px(x,y,'branco',0,1)}}
 if(t>=31.1)p.rect(0,0,PW,PH,'branco',1,1);
 const sh=t>=29.2&&t<30.4?1.5:(t>=30.4&&t<30.9?3.6:0),fr=Math.floor(t*30),br=t<28.5?0:Math.round(Math.sin(t*1.6)*.7);
 const dark=t<28.8?-1.4:-.8,pulse=t>=29.2&&t<30.9?(.3+.25*Math.sin(t*14)):0;
 return {p,shake:[(hash(fr)-.5)*sh*2,(hash(fr+9)-.5)*sh*2+br],light:(x,y)=>{const d=Math.hypot(x-90,(y-165)*.9),k=Math.max(0,1-d/110);
  return [dark+Lt*k*3+vign(x,y,1.7+pulse*3),Math.min(1,Lt*k*1.5)]}}}

/* ---------- P4: a faca sobre o pilar, sob o feixe frio (10,5–14,5 s) ---------- */
function faca(p,t,cx,cy,ang){
 const yt=lx=>lx<43.3?lerp(-5.7,-5,(lx+28.7)/72):lerp(-5,.3,(lx-43.3)/18.4),yb=lx=>lx<43.3?3.7:lerp(3.7,.3,(lx-43.3)/18.4);
 const gl=[11.5,12.7,13.9].map(k=>t-k).find(d=>d>=0&&d<.3);const gx=gl!=null?lerp(-28.7,61.7,gl/.3):null;
 return rot(p,cx,cy,ang,72,(lx,ly)=>{
  if(gx!=null&&Math.abs(lx-gx)<1.6&&Math.abs(ly-(yb(lx)-1))<1.2&&lx>-29&&lx<62)return ['lamina',6,1];
  if(gx!=null&&Math.abs(lx-gx)<.6&&ly>-3&&ly<6&&lx>-29&&lx<62)return ['lamina',6,1];
  if(Math.hypot(lx+66,ly)<3.7)return ['metal',ly<-1?4.4:2.4];
  if(lx>=-65&&lx<=-32&&Math.abs(ly)<=3.7){const wrap=Math.floor((lx+65)/5)%2;return ['madeira',ly<-2.3?3:(wrap?1.2:2)]}
  if(lx>=-32.7&&lx<=-28.7&&Math.abs(ly)<=8.3)return ['metal',ly<-6.5?4.6:(lx>-29.7?1.6:3)];
  if(lx>-28.7&&lx<=61.7&&ly>=yt(lx)&&ly<=yb(lx)){
   if(ly>yb(lx)-1.1)return ['lamina',5.2];if(ly<yt(lx)+1)return ['lamina',4.4];
   if(lx>-25&&lx<18&&(Math.abs(ly-(-2.7+Math.sin(lx*.54)*.8))<.5||Math.abs(ly-(-.3+Math.sin(lx*.54+1)*.8))<.5))return ['lamina',1.6];
   const ds=Math.hypot(lx-31.7,ly+1);if(ds>1.6&&ds<2.6||(ds>=2.6&&ds<3.6&&Math.round(Math.atan2(ly+1,lx-31.7)/(Math.PI/4)*10)%10===0))return ['lamina',1.6];
   return ['lamina',ly<-1.6?3.3:2.8]}
  return null})}
function p4(t){
 const p=new Pix(),b=[20,-7,93,177,0,27];
 for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){
  if(y<165)p.px(x,y,'pedra',tijolo(x,y,17,9,2.2,21)-1.2*(1-y/165));
  else if(y<184){const u=(y-165)/19,xl=lerp(7,0,u),xr=lerp(173,180,u);if(x>=xl&&x<=xr)p.px(x,y,'pedra',y<166?6:5-u*.8+(h2(x,y)<.06?-1:0));else p.px(x,y,'pedra',tijolo(x,y,17,9,2,21)-1)}
  else if(y<190)p.px(x,y,'pedra',y===189?1:3.4);
  else if(y<232&&x>=28&&x<=152)p.px(x,y,'pedra',3+(h2(x,y)<.06?-1:0)-(x>93?1.4:0)-(y<193?1:0)+((y-190)%14===13?-1.6:0));
  else if(y>=225&&y<232&&x>=23&&x<=157)p.px(x,y,'pedra',2.4);
  else p.px(x,y,'terra',lerp(1.2,3.4,clamp((y-232)/88,0,1))+(h2(x,y)<.05?-1:0))}
 for(const [x,y] of [[25,229],[28,230],[31,228],[34,231],[37,230],[23,231],[40,230],[32,231]])p.px(x,y,'ouro',3.6,1);
 for(let x=34;x<152;x++)for(let y=0;y<5;y++){const yy=Math.round(156+(x-93)*Math.tan(-.28)+8+y);p.add(x,yy,-1.6+y*.25)}
 const vib=t>=11?((Math.floor(t*15)%2)?.5:-.5):0;
 const g=faca(p,t,93+vib,156,-.28);p.outline(g,'contorno',0);p.rim(g,-1,-1,1);
 beamDust(p,t,b,21,22,'pedra',7);
 return {p,shake:[0,Math.round(Math.sin(t*1.6)*.7)],light:(x,y)=>[beamAt(x,y,b)*1.8+vign(x,y,1.6),0]}}

/* ---------- P5: tudo congela, PAUSE AND CHOOSE (14,5–18,5 s) ---------- */
function p5(t){const p=new Pix(),L=camara(p,14.5,{z:1.2,halo:.55,noDust:false});
 return {p,light:L,post:buf=>{for(let i=0;i<buf.length;i+=4){const l=.3*buf[i]+.59*buf[i+1]+.11*buf[i+2];for(let k=0;k<3;k++)buf[i+k]=(buf[i+k]*.25+l*.75)*.85}}}}

/* ---------- P6: a faca rasga o ar (18,5–23,5 s) ---------- */
function pose(t){const K=[[18.5,138,250,-.5],[18.8,138,250,-.5],[19.0,151,233,-.08],[19.3,93,273,-1.8],[20.3,137,253,-.55],[99,137,253,-.55]];
 for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(t<b[0]){let k=Math.max(0,(t-a[0])/(b[0]-a[0]));k=i===2?k*k:k*k*(3-2*k);return [lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)]}}return [137,253,-.55]}
function ilhaMini(x,y,cx,cy,hh){const sy=cy-hh*.45;if(Math.hypot(x-cx+8,y-sy)<7)return ['halo',4.2,1];
 if(y<cy+5)return ['ceu',lerp(1.8,3.8,clamp((y-(cy-hh))/(hh+5),0,1))+(Math.hypot(x-cx+8,y-sy)<12&&dith(x,y,.6)?1:0),1];
 if(y<cy+23)return ['mar',y===Math.floor(cy+5)?1:(2.4+((x*3+y*7)%11===0?1:0)),1];if(y<cy+24.5)return ['mar',5,1];return ['areia',4,1]}
function p6(t){
 const p=new Pix(),op=sm(19.3,20.3,t),cx=90,cy=167;
 const L0=camara(p,t,{halo:.25,dark:-1.3,beam:.6});
 if(t>=19.3){const hh=lerp(10,72,sm(19.3,19.42,t)),hw=27*op,fr=Math.floor(t*15);
  if(hw>.5){p.begin();for(let y=Math.ceil(cy-hh);y<=cy+hh;y++){const s=(y-cy)/hh,w=hw*(1-s*s),j=(hash(Math.floor(y/3)+fr)-.5)*3*clamp(hw/7,0,1),wl=Math.round(w+j),wr=Math.round(w-j*.7);
    for(let x=cx-wl;x<=cx+wr;x++){const r=ilhaMini(x,y,cx,cy,hh);p.px(x,y,r[0],r[1],r[2])}}
   const g=p.end();p.outline(g,'branco',1);
   for(let i=0;i<10;i++){const a=hash(i+fr*1.3)*6.28;p.px(cx+Math.cos(a)*(hw+3+hash(i*5+fr)*6),cy+Math.sin(a)*hh*(.6+hash(i*9)*.5),'branco',1,1)}}
  else for(let y=Math.round(cy-hh);y<=cy+hh;y++)p.px(cx,y,'branco',1,1);
  if(t>=20.3)for(let i=0;i<60;i++){const raw=(t-20.3)*.9-hash(i*1.7);if(raw<0)continue;const life=raw%1,a=hash(i*9.1)*6.283,d=life*life*167,s=Math.round(life*3);
   const x=cx+Math.cos(a)*d*(.3+hash(i)*.3)+Math.cos(a)*7,y=cy+Math.sin(a)*d*.8;p.rect(Math.round(x),Math.round(y),s+1,s+1,'areia',4.4,1)}}
 // rastro do golpe
 const sp=sm(19.0,19.3,t),fd=1-sm(19.3,19.5,t);
 if(t>=19.0&&fd>0){const P=u=>[(1-u)*(1-u)*143+2*u*(1-u)*60+u*u*23,(1-u)*(1-u)*155+2*u*(1-u)*160+u*u*283];const n=24;
  for(let i=0;i<n*sp;i++){const [x0,y0]=P(i/n),[x1,y1]=P((i+1)/n);p.thick(x0,y0,x1,y1,(1+3.7*Math.sin(Math.PI*i/n))*fd+.5,'branco',1,1)}}
 const [hx,hy,hr]=pose(t),br=Math.round(Math.sin(t*2))*.5,warm=t>=19.3;
 const g=rot(p,hx,hy+br,hr,150,(lx,ly)=>{const f=punho(lx,ly);if(f)return f;
  if(ly>-28&&ly<-24.7&&Math.abs(lx)<7.3)return ['pedra',ly<-27?6:4.6];
  if(ly>=-25&&ly<=15&&Math.abs(lx)<=3)return ['madeira',(Math.floor((ly+25)/3.7)%2)?1.2:2.2];
  if(ly<-28&&ly>-90){const xl=ly>-76.7?-4:lerp(-4,0,(-76.7-ly)/13.3),xr=ly>-78?lerp(4,2.3,(-28-ly)/50):lerp(2.3,0,(-78-ly)/12);
   if(lx>=xl&&lx<=xr){if(lx>xr-1)return ['lamina',5.4];if(lx<xl+1)return warm?['halo',3.6]:['lamina',4.6];
    if(ly>-55&&ly<-32&&Math.abs(lx-(Math.sin(ly*.7)*1.3-.7))<.5)return ['lamina',1.4];return ['lamina',3]}}
  return null});
 p.outline(g,'contorno',0);p.rim(g,-1,-1,warm?1.6:1);
 const sh=t>=19.3&&t<20.5?1.3:0,fr=Math.floor(t*30);
 return {p,shake:[(hash(fr)-.5)*sh*2,(hash(fr+9)-.5)*sh*2+Math.round(Math.sin(t*1.6)*.5)],light:(X,Y)=>{const r=L0(X,Y);
  if(t>=19.3){const dx=X-cx,dy=Y-cy,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);let ray=0;
   for(let i=0;i<6;i++){const ang=-.9+i*.36+Math.sin(t+i)*.03;for(const aa of [ang+.55,ang+.55+Math.PI]){let da=Math.abs(((a-aa)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);if(da<.06)ray=1}}
   const k=Math.max(0,1-d/105);r[0]+=op*(k*1.8+ray*1.2*k+ray*.3);r[1]=Math.max(r[1],op*Math.min(1,k*2+ray))}
  return r}};
}

/* ---------- P7: a ilha (23,5–27,5 s) ---------- */
function coqueiro(p,t,x,base,h,lean,sd){
 const tx=x+lean*h*.35,ty=base-h,cx=x+lean*h*.02,cy=base-h*.6;p.begin();const N=Math.ceil(h*1.2);
 for(let i=0;i<=N;i++){const u=i/N,X=(1-u)*(1-u)*x+2*(1-u)*u*cx+u*u*tx,Y=(1-u)*(1-u)*base+2*(1-u)*u*cy+u*u*ty,w=Math.round(lerp(6,3,u)),ring=Math.floor(i/3.2)%2;
  for(let k=-w;k<=w;k++){const side=k/w;p.px(X+k,Y,'tronco',2.2+(ring?.6:0)-side*1.1+(Math.abs(k)===w?-.6:0))}}
 const tg=p.end();p.begin();
 for(let i=0;i<8;i++){const a=-Math.PI/2+(i-3.5)*.5+Math.sin(t*1.4+i+sd)*.06,L=h*.36,dx=Math.cos(a),dy=Math.sin(a);
  for(let s=0;s<=1;s+=1/(L*1.2)){const X=tx+dx*s*L,Y=ty+dy*s*L*.55-L*.08+s*s*L*.55;p.px(X,Y,'folha',3.4-s*.6);
   const len=Math.round((1-Math.abs(s-.45)*1.4)*L*.2)+1;if(s>.08&&Math.round(s*L)%2===0)for(let k=1;k<=len;k++){p.px(X-k*.45,Y+k,'folha',2.6-k*.25);p.px(X+k*.45,Y+k,'folha',2-k*.3)}}}
 const fg=p.end();for(const [ox,oy] of [[-2,2],[2,2],[0,4]])p.disc(tx+ox,ty+oy,2,'coco',1.4);
 p.outline(new Set([...tg,...fg]),'contornoP',0);p.rim(fg,-1,-1,1.4);p.rim(tg,-1,0,1)}
const NUVEM={leg:{W:['nuvem',3],w:['nuvem',2],s:['nuvem',1]},rows:['.........wwwww..............','......wwwWWWWWww............','....wwWWWWWWWWWWww...wwww...',
 '...wWWWWWWWWWWWWWWwwwWWWWw..','..wWWWWWWWWWWWWWWWWWWWWWWWw.','.wwwwwwwwwWWWWWWWWWWWWWwwwww','..ssssswwwwwwwwwwwwwwwwssss.','.....sssssssssssssssssss....']};
function fenda(p,t,cx,cy,hw,hh){if(hw<1)return;const fr=Math.floor(t*10);p.begin();
 for(let y=-hh;y<=hh;y++){const k=Math.pow(1-Math.abs(y/hh),.7),j=.35+.65*hash(Math.floor((y+hh)/2)*3.1+fr*.37),w=Math.max(0,Math.round(hw*k*j)),o=Math.round(Math.sin(y*.21+t*3)*1.5);
  for(let x=-w;x<=w;x++){const e=w-Math.abs(x);p.px(cx+o+x,cy+y,'caverna',e===0?4:(1.6+(h2(cx+x,cy+y)<.12?1:0)+(Math.abs(x+3)<1&&y>-12&&y<16?2:0)))}}
 const g=p.end();p.outline(g,'borda',2);
 for(let y=-hh-6;y<=hh+6;y++)for(let x=-hw-8;x<=hw+8;x++){const X=cx+x,Y=cy+y;if(g.has(Y*PW+X))continue;const d=Math.abs(x)/(hw+8)+Math.abs(y)/(hh+10);if(d<1&&dith(X,Y,(1-d)*.55))p.px(X,Y,'borda',0,1)}
 for(let i=0;i<6;i++){const a=hash(i*9.1)*6.28,r=hw+4+((t*9+hash(i)*20)%14);p.px(cx+Math.cos(a)*r,cy+Math.sin(a)*r*2.6,'borda',2,1)}}
function p7(t){
 const p=new Pix(),sx=38,sy=32,wf=Math.floor(t*4);
 for(let y=0;y<144;y++)for(let x=0;x<PW;x++)p.px(x,y,'ceu',lerp(1,3.7,(y/144)**.9));
 for(let y=sy-34;y<=sy+34;y++)for(let x=sx-34;x<=sx+34;x++){const d=Math.hypot(x-sx,y-sy);
  if(d<11.5)p.px(x,y,'halo',d<4&&x<sx&&y<sy?5:4.2,1);else if(d<26){const a=1-(d-11.5)/14.5;if(dith(x,y,a*1.1))p.px(x,y,'halo',Math.floor(a*3.2),1)}}
 p.sprite(NUVEM,Math.round(((t*2.2)%240)-30+60)%240-40,22);p.sprite(NUVEM,Math.round(((t*1.3+130)%260))-50,64,{flip:1});
 for(let y=144;y<194;y++)for(let x=0;x<PW;x++)p.px(x,y,'mar',y===144?1:lerp(1.8,3.3,(y-144)/50));
 for(let i=0;i<46;i++){const y=146+Math.floor(hash(i*7.7)*44),x=Math.floor(hash(i*3.1)*PW+((wf+i)%2)*2),len=2+Math.floor(hash(i)*(3+(y-144)/6));for(let k=0;k<len;k++)p.add(x+k,y,1.1)}
 for(let i=0;i<14;i++){if(hash(i+wf*1.7)<.45)continue;p.px(sx-8+Math.floor(hash(i*5.3)*18),146+Math.floor(hash(i*2.9)*30),'mar',5,1)}
 for(let x=0;x<PW;x++){const fy=Math.round(191+Math.sin(x*.12+t*2)*1.4+Math.sin(x*.05-t*1.3));for(let y=fy-1;y<197;y++){if(y<=fy+1)p.px(x,y,'mar',y===fy+1?4:(h2(x,y+wf)<.3?4:5));else p.px(x,y,'areia',1.8)}}
 for(let y=197;y<PH;y++)for(let x=0;x<PW;x++){const n=h2(x,y);let L=3.2-(y-197)*.006+(n<.05?-1:n>.97?.9:0);if(Math.sin(x*.18+y*.9+Math.sin(x*.05)*3)>.93)L-=.8;p.px(x,y,'areia',L)}
 const wp=clamp((t-23.5)/2,0,1),hxp=Math.round(lerp(68,90,wp)),hyp=Math.round(lerp(241,202,wp));
 for(let k=1;k<9;k++){const u=k/9;if(u>wp*.95)break;const X=Math.round(lerp(70,hxp,u))+(k%2?-2:2),Y=Math.round(lerp(243,hyp,u));p.add(X,Y,-1.2);p.add(X+1,Y,-1.2);p.add(X,Y+1,-.7)}
 const pc=1-sm(25.8,26.4,t);if(t<26.6)fenda(p,t,68,200,Math.round(12*pc),Math.round(47*(t<26.4?1:1-sm(26.4,26.6,t))));
 if(t>=26.3&&t<26.9)for(const [dx,dy] of [[-5,-7],[4,2],[-2,10],[3,-15]])p.rect(Math.round(68+dx*(1+(t-26.3)*2)),Math.round(200+dy*(1+(t-26.3)*2)),2,2,'branco',1,1);
 coqueiro(p,t,178,237,103,-.35,4);coqueiro(p,t,25,217,80,.4,2);andarilho(p,hxp,hyp,t,t<25.5);coqueiro(p,t,3,247,117,.3,0);
 for(let i=0;i<14;i++){const x=((hash(i)*200+t*43*(1+hash(i*2)))%215)-17,y=175+hash(i*5)*100;p.px(x,y,'areia',5,1)}
 return {p,shake:[0,Math.round(Math.sin(t*1.4)*.5)],light:(x,y)=>[vign(x,y,.9,.9,1.35),0]}}

/* ---------- P9: a dimensão arrasada e os olhos (31,5–38,5 s) ---------- */
let OLHOS=null;
function fazOlhos(){const r=rng(2024),L=[];
 for(let i=0;i<18;i++)L.push({x:10+r()*137,y:108+r()*35,s:0});
 for(let i=0;i<16;i++)L.push({x:15+r()*127,y:155+r()*97,s:1});
 for(const [x,y] of [[17,107],[15,197],[43,28],[107,23],[50,260],[115,258],[90,202]])L.push({x,y,s:2});
 L.forEach(e=>{e.ph=r()*6.28;e.sp=.8+r()*1.5;e.ord=Math.floor(r()*1000)});return L}
const OLHO=[ // meia-largura e meia-altura por tamanho
 {w:1,h:0,gap:1},{w:3,h:1,gap:2},{w:7,h:3,gap:4}];
function olhos(p,t,e,open){const o=OLHO[e.s],sway=Math.round(Math.sin(t*e.sp*2+e.ph)*.6),cx=Math.round(e.x+sway),cy=Math.round(e.y);
 const R=o.gap+o.w*2+4+(e.s===2?Math.round(Math.sin(t*4+e.ph)):0);
 for(let y=-R;y<=R;y++)for(let x=-R*1.6;x<=R*1.6;x++){const d=Math.hypot(x/1.6,y)/R;if(d<1&&dith(cx+x,cy+y,(1-d)*(e.s===2?.8:.55)))p.px(cx+x,cy+y,'sangue',d<.5?2:1,1)}
 for(const s of [-1,1]){const ex=cx+s*(o.gap+o.w),hh=Math.max(0,Math.round(o.h*open));
  for(let x=-o.w;x<=o.w;x++){const tilt=Math.round(-s*x*.25),hy=Math.round(hh*Math.sqrt(1-(x/(o.w+.5))**2));
   for(let y=-hy;y<=hy;y++){let m='sangue',l=4;if(e.s===2&&open>.5&&Math.abs(x)<1&&Math.abs(y)<=hy)l=0;else if(e.s===2&&open>.5&&y>hy-2&&hy>1)l=0;else if(y===-hy&&hy>0)l=5;p.px(ex+x,cy+y+tilt,m,l,1)}}}}
function p9(t){
 const p=new Pix(),scare=t>=35.5;
 for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){
  if(y<146){let L=y<53?6:y<103?5:4;if(y>126)L=lerp(4,1.2,(y-126)/20);p.px(x,y,y>126&&dith(x,y,(y-126)/20)?'sangue':'cinza',y>126&&dith(x,y,(y-126)/20)?lerp(1,2.6,(y-126)/20):L)}
  else{const n=h2(x,y);p.px(x,y,'cinza',3-(y<162?(162-y)/16*1.5:0)+(n<.06?-1:0))}}
 // ruínas
 const r=rng(42);let x=-10;p.begin();
 while(x<190){const k=r(),w=8+r()*17,h=20+r()*50;
  if(k<.6){const n=3+Math.floor(r()*3),pts=[[x,146],[x,146-h]];for(let i=1;i<=n;i++)pts.push([x+w*i/n,146-h+(r()-.2)*h*.5]);pts.push([x+w,146]);p.poly(pts,'cinza',1);p.rect(Math.round(x+w*.4),Math.round(146-h*.6),2,3,'cinza',2)}
  else{const aw=w*1.8,ah=h*.75;p.rect(Math.round(x),Math.round(146-ah),3,Math.round(ah),'cinza',1);p.rect(Math.round(x+aw-3),Math.round(146-ah*.55),3,Math.round(ah*.55),'cinza',1);
   for(let a=Math.PI;a<Math.PI*1.65;a+=.02)for(let d=0;d<3;d++)p.px(x+aw/2+Math.cos(a)*(aw/2-1.7-d),146-ah+Math.sin(a)*(aw/2-1.7-d),'cinza',1);x+=aw-w}
  x+=w+2+r()*10}
 const rg=p.end();p.rim(rg,0,-1,.8);
 // rachaduras vermelhas convergindo para o horizonte
 const rc=rng(9);for(let i=0;i<9;i++){let px=-33+i*31+(rc()-.5)*13,py=320;for(let k=1;k<=10;k++){const u=k/10,zig=(k%2?1:-1)*(1-u)*7.5*(.5+rc()),nx=lerp(-33+i*31,90,u)+zig,ny=lerp(320,147,Math.pow(u,.7));
  p.thick(px,py,nx,ny,lerp(2,.6,u),'sangue',1.6+(scare?0:.4));p.line(px,py,nx,ny,'sangue',2.6);px=nx;py=ny}}
 for(let y=138;y<167;y++)for(let x=0;x<PW;x++){const a=1-Math.abs(y-145)/14;if(dith(x,y,a*.7))p.px(x,y,'cinza',1.2)}
 for(let i=0;i<130;i++){const x=((hash(i)*217+t*(4.3+hash(i*4)*3.3))%217)-18,y=(hash(i+1)*333+t*(9+hash(i+2)*7.5))%333-7;p.px(x,y,'cinza',y<146?7:6,1);if(hash(i*6)<.5)p.px(x+1,y,'cinza',y<146?7:6,1)}
 let dark=0;
 if(scare){dark=-2.6;OLHOS=OLHOS||fazOlhos();const N=OLHOS.length,slot=Math.floor((t-36.2)/.3);
  for(const e of OLHOS){let op=t<35.534?.2:1;if(t>=36.2&&e.ord%N===(slot*13)%N&&(t-36.2)%.3<.12)op=.15;olhos(p,t,e,op)}}
 const sh=t>=35.5&&t<35.9?2:(scare?.7:0),fr=Math.floor(t*30);
 return {p,shake:[(hash(fr)-.5)*sh*2,(hash(fr+9)-.5)*sh*2+Math.round(Math.sin(t*1.6)*.5)],light:(x,y)=>[dark+(scare?(y<146?-1:0):0)+vign(x,y,scare?2.2:.35,.8,1.3),0]}}

/* =====================================================================
   VÍDEO
   ===================================================================== */
const VIDEO={
 title:'The Knife or the Book',dur:40.5,poster:16,
 dlg:[
  {a:.15, b:2.35,v:'n',text:'The way out just sealed shut.',y:'BAIXA'},
  {a:2.5, b:6.4, v:'n',text:'Something here wants you to choose.',y:'ALTA'},
  {a:6.7, b:10.4,v:'n',text:'It might tell you how to leave.',y:'ALTA'},
  {a:10.7,b:14.4,v:'n',text:"The blade hums, like it's hungry.",y:'ALTA'},
  {a:14.8,b:18.4,v:'n',text:'PAUSE AND CHOOSE',y:'ALTA'},
  {a:18.7,b:23.4,v:'n',text:'1: It cuts the air itself.',y:'ALTA'},
  {a:23.7,b:27.2,v:'n',text:"You never go back. You don't want to.",y:'ALTA'},
  {a:27.7,b:31.1,v:'n',text:'2: The lock opens by itself.',y:'ALTA'},
  {a:31.8,b:35.4,v:'n',text:"The lock wasn't keeping you out.",y:'ALTA'},
  {a:35.9,b:38.5,v:'e',text:'Finally. Someone opened it.',y:'ALTA',cps:18},
  {a:38.7,b:40.5,v:'n',text:'Comment: 1 or 2?',y:'MEDIA'},
 ],
 pix(t,E){
  if(t<2)return p1(t);if(t<6.5)return p2(t);if(t<10.5)return p3(t);if(t<14.5)return p4(t);if(t<18.5)return p5(t);
  if(t<23.5)return p6(t);if(t<27.5)return p7(t);if(t<31.5)return p8(t);if(t<38.5)return p9(t);return null},
 overlay(t,g,E){
  if(t>=.7&&t<.734)E.flash(g,1);
  if(t>=14.6&&t<18.5){const s=1+.45*(1-E.sm(14.6,14.667,t));for(const [n,x] of [[1,324],[2,713]]){g.save();g.translate(x,768);g.scale(s,s);E.badge(g,n,0,0);g.restore()}}
  E.countdown(g,t,15.5,270);
  if(t>=19.3&&t<19.367)E.flash(g,1);
  if(t>=23.43&&t<23.5)E.flash(g,1);
  if(t>=27.2&&t<27.5)E.glitch(g,t,1);
  if(t>=31.5&&t<31.8)E.flash(g,1-E.sm(31.5,31.8,t),'255,255,255');
  if(t>=35.5&&t<35.534)E.flash(g,.85,'122,42,34');
 },
 score(S,A,E){
  // P1 — a laje desaba
  A.room(S,0,14.5,.8);
  A.noise(S,.2,.45,.6,'lowpass',300,'sfx');
  A.slam(S,.7,1);A.boom(S,.7,.9);A.crack(S,.7,.6);
  A.noise(S,.72,.45,2.4,'lowpass',500,'amb',0,true);                 // eco longo
  for(let i=0;i<7;i++)A.noise(S,.85+i*.12+E.hash(i)*.08,.35,.08,'lowpass',900,'sfx');  // cascalho
  A.drone(S,.7,2.3,.35,[36.7,55],140,'music');                       // zumbido grave
  A.whoosh(S,1.8,.3,.7);                                             // chicote
  // P2 — câmara, goteiras, drone crescendo
  A.drips(S,2,14.5,.35);
  A.steps(S,2.3,6.3,.55,.3,'grass');
  A.drone(S,2,6.6,.16,[41.2,55],150);A.drone(S,4,6.6,.22,[41.2,61.7],220);
  // P3 — livro: tom acolhedor
  A.pad(S,6.5,10.5,.05,[261.63,329.63,392,523.25]);
  A.ring(S,7.5,3136,.1,1.4);A.ring(S,9.5,3520,.1,1.4);
  // P4 — faca: vibração metálica aguda
  A.layer(S,10.9,14.5,.1,gg=>{const bp=A.F(S,'bandpass',2600,5),tr=A.G(S,.5),l=A.O(S,'sine',16),lg=A.G(S,.5);
   bp.connect(tr);tr.connect(gg);l.connect(lg);lg.connect(tr.gain);
   for(const f of [1760,1771,2637]){const o=A.O(S,'sawtooth',f);o.connect(bp);A.run(S,o,14.5)}A.run(S,l,14.5)},'sfx',.4,.1);
  for(const x of [11.5,12.7,13.9])A.ring(S,x,4200,.1,.5);
  // P5 — congela, relógio a cada número, corte no 1
  A.tone(S,14.5,'sine',900,120,.35,.4,.35,'sfx');
  A.tension(S,14.6,18.45,.03);
  for(const x of [15.5,16.5,17.5]){A.click(S,x,.8);A.tone(S,x,'square',1400,1400,.2,.05,.01,'sfx');A.tone(S,x,'sine',220,170,.4,.14,.1,'sfx')}
  // P6 — o golpe e o rasgo
  A.room(S,18.5,20.5,.7);
  A.breath(S,18.8,.3,.4,1200);
  A.whoosh(S,19.0,.3,.8);
  A.sweep(S,19.3,.9,1500,9000,.8,'sfx',3);A.crack(S,19.3,.8);A.impact(S,19.3,.5);
  A.tone(S,19.3,'sawtooth',180,1400,.2,1,.9,'sfx',true);
  for(let i=0;i<12;i++)A.noise(S,19.35+i*.08+E.hash(i)*.05,.4,.02,'highpass',5000,'sfx');
  A.wind(S,20,23.8,.8);A.waves(S,20.3,27.2,.8);
  // P7 — praia: ondas, gaivotas, música ensolarada
  const gull=(x,v=.12)=>{A.tone(S,x,'triangle',1700,1100,v,.22,.2,'sfx');A.tone(S,x+.25,'triangle',1500,1000,v*.8,.2,.18,'sfx');A.tone(S,x+.45,'triangle',1400,900,v*.6,.2,.18,'sfx')};
  gull(20.9,.07);gull(24.1);gull(25.5,.1);gull(26.6,.08);
  A.pad(S,23.5,27.2,.04,[392,493.88,587.33,783.99]);
  [783.99,987.77,1174.66,987.77,880,783.99,659.25,783.99,880,987.77,1174.66,1318.51,1174.66,987.77].forEach((f,i)=>A.tone(S,23.6+i*.25,'triangle',f,f,.1,.35,.3,'music'));
  for(let i=0;i<4;i++)A.tone(S,23.6+i,'sine',98,98,.25,.9,.8,'music');
  A.sweep(S,25.8,.8,6000,800,.35);A.ring(S,26.4,5200,.1,.7);
  A.rewind(S,27.2);
  // P8 — silêncio, clique, páginas furiosas, estouro
  A.silence(S,27.5,28.5);
  A.lockClunk(S,28.5);A.click(S,28.5,1);A.knock(S,28.62,.35);
  A.noise(S,28.7,.6,.15,'lowpass',1200,'sfx');
  for(let x=28.8,i=0;x<30.9;x+=1/12,i++)A.noise(S,x,.3+.5*(i/25),.07,'bandpass',1800+E.hash(i)*1600,'sfx',1.2);
  A.wind(S,28.8,31,1);A.riser(S,29.2,30.9,.5);A.drone(S,28.8,31.1,.3,[41.2,43.6],200);
  A.boom(S,30.9,1);A.impact(S,30.9,1);A.noise(S,30.9,1,1.2,'lowpass',6000,'hit',0,true);
  A.tinnitus(S,31,31.5,.12);
  // P9 — silêncio, depois o grave súbito quando os olhos abrem
  A.silence(S,31.5,35.5);
  A.impact(S,35.5,1);A.boom(S,35.5,1);A.stinger(S,35.5,1.4,.8);
  A.drone(S,35.5,38.5,.35,[30.9,32.7],140,'music');
  A.wind(S,35.6,38.5,.4);
  // P10 — só os blips
  A.silence(S,38.5,40.6);
 }
};
