/* =====================================================================
   PIX — kit de pixel art do motor (modo pixel)
   Tela nativa 180×320, ampliada 6× para 1080×1920. Nada de antialias:
   cada pixel guarda um MATERIAL (rampa de cores, escuro → claro) e um
   NÍVEL de luz. No fim, luz + vinheta somam níveis e o dithering em faixas
   (cor chapada, xadrez só na transição) escolhe a cor da rampa.

   PIX.mat(nome, ['#hex',...])            registra uma rampa (5–8 tons)
   new PIX.Pix()                          tela; desenhe com:
     px(x,y,mat,nível,flag) rect line circle disc ell poly thick
     add(x,y,dl) shade(...)               escurece/clareia o que já está lá
     sprite({rows,leg},x,y,{flip,flipY})  grade de texto → pixels
     begin()/end() → grupo; outline(g,mat,nível); rim(g,lx,ly,quanto)
     flag 1 = emissivo (ignora luz/vinheta) · 2 = sem dithering
   PIX.dith(x,y,a)                        meio-tom pontual (halos, névoa)
   Guia completo: PIXEL.md · exemplo completo: exemplo_pixel.js
   ===================================================================== */
(function(root){
'use strict';
const PW=180,PH=320,SC=6;
// Bayer 2×2: só 3 padrões (25%, xadrez 50%, 75%) — o dithering clássico de jogo, limpo
const BAY=[0,2,3,1].map(v=>(v+.5)/4);
const bay=(x,y)=>BAY[(y&1)*2+(x&1)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sm=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k)};
const lerp=(a,b,k)=>a+(b-a)*k;
const hash=x=>{const s=Math.sin(x*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const h2=(x,y)=>hash(x*17.13+y*91.7);
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
// variante "quente" de uma cor (luz de tocha/runa): puxa para laranja
const warmify=([r,g,b],k)=>[clamp(r*(1+1.0*k)+10*k,0,255),clamp(g*(1+.4*k)+3*k,0,255),clamp(b*(1-.35*k),0,255)].map(Math.round);

/* ---------- materiais = rampas de cor (escuro → claro) ---------- */
const MATS=[],MI={};
function mat(name,ramp,warm){MI[name]=MATS.length;const r=ramp.map(hx);MATS.push({name,ramp:r,warm:warm?warm.map(hx):r.map(c=>warmify(c,.75))})}

/* ---------- a tela ---------- */
class Pix{
 constructor(){this.m=new Int16Array(PW*PH).fill(-1);this.l=new Float32Array(PW*PH);this.f=new Uint8Array(PW*PH);this.grp=null}
 // f: 1 = emissivo (ignora luz/vinheta) · 2 = sem dithering (arredonda)
 px(x,y,m,l,f=0){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=PW||y>=PH)return;const i=y*PW+x;
  this.m[i]=typeof m==='string'?MI[m]:m;this.l[i]=l;this.f[i]=f;if(this.grp)this.grp.add(i)}
 get(x,y){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=PW||y>=PH)return null;const i=y*PW+x;return this.m[i]<0?null:{m:this.m[i],l:this.l[i],f:this.f[i]}}
 add(x,y,dl){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=PW||y>=PH)return;const i=y*PW+x;if(this.m[i]>=0)this.l[i]+=dl}
 rect(x,y,w,h,m,l,f){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.px(x+i,y+j,m,l,f)}
 shade(x,y,w,h,dl){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.add(x+i,y+j,dl)}
 line(x0,y0,x1,y1,m,l,f){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
  for(;;){this.px(x0,y0,m,l,f);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
 circle(cx,cy,r,m,l,f){let x=r,y=0,e=1-r;while(x>=y){for(const [a,b] of [[x,y],[y,x],[-y,x],[-x,y],[-x,-y],[-y,-x],[y,-x],[x,-y]])this.px(cx+a,cy+b,m,l,f);y++;if(e<0)e+=2*y+1;else{x--;e+=2*(y-x)+1}}}
 disc(cx,cy,r,m,l,f){for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r*.8)this.px(cx+x,cy+y,m,l,f)}

 // polígono cheio (scanline); l pode ser número ou função (x,y)=>nível
 poly(pts,m,l,f=0){let y0=1e9,y1=-1e9;for(const p of pts){y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}
  y0=Math.max(0,Math.ceil(y0-.5));y1=Math.min(PH-1,Math.floor(y1-.5));
  for(let y=y0;y<=y1;y++){const yc=y+.5,xs=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];
    if((a[1]<=yc&&b[1]>yc)||(b[1]<=yc&&a[1]>yc))xs.push(a[0]+(yc-a[1])/(b[1]-a[1])*(b[0]-a[0]))}
   xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2){for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(PW-1,Math.floor(xs[k+1]-.5));x++)this.px(x,y,m,typeof l==='function'?l(x,y):l,f)}}}
 ell(cx,cy,rx,ry,m,l,f=0){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const u=(x+.5-cx)/rx,v=(y+.5-cy)/ry;if(u*u+v*v<=1)this.px(x,y,m,typeof l==='function'?l(x,y,u,v):l,f)}}
 thick(x0,y0,x1,y1,w,m,l,f=0){const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L*w/2,ny=dx/L*w/2;this.poly([[x0+nx,y0+ny],[x1+nx,y1+ny],[x1-nx,y1-ny],[x0-nx,y0-ny]],m,l,f)}
 // grupos: tudo desenhado entre begin()/end() vira uma silhueta para contorno e luz de contorno
 begin(){this.grp=new Set()}
 end(){const g=this.grp;this.grp=null;return g}
 outline(g,m,l,diag=false){const add=[];const N=diag?[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
  for(const i of g){const x=i%PW,y=(i/PW)|0;for(const [dx,dy] of N){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=PW||Y>=PH)continue;const j=Y*PW+X;if(!g.has(j))add.push(j)}}
  for(const j of add){this.m[j]=MI[m];this.l[j]=l;this.f[j]=0}}
 // luz de contorno: pixels da silhueta cujo vizinho na direção da luz está fora dela
 rim(g,lx,ly,amt,depth=1){const up=[];for(const i of g){const x=i%PW,y=(i/PW)|0;
  for(let d=1;d<=depth;d++){const X=x+lx*d,Y=y+ly*d;if(X<0||Y<0||X>=PW||Y>=PH||!g.has(Y*PW+X)){up.push([i,amt*(1-(d-1)/depth)]);break}}}
  for(const [i,a] of up)this.l[i]+=a}
 /* sprite = {rows:[...], leg:{char:[material,nível,flag?]}}; (x,y)=canto superior esquerdo */
 sprite(sp,x,y,o={}){const H=sp.rows.length,W=Math.max(...sp.rows.map(r=>r.length));if(o.group)this.begin();
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const c=sp.rows[j][i];if(!c||c==='.'||c===' ')continue;const L=sp.leg[c];if(!L)continue;
   const X=o.flip?x+W-1-i:x+i,Y=o.flipY?y+H-1-j:y+j;this.px(X,Y,L[0],L[1]+(o.dl||0),L[2]||0)}
  return o.group?this.end():null}
 render(light){const out=new Uint8ClampedArray(PW*PH*4);
  for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const i=y*PW+x,o=i*4;let m=this.m[i];
   if(m<0){out[o]=5;out[o+1]=6;out[o+2]=10;out[o+3]=255;continue}
   let L=this.l[i],w=0;const f=this.f[i];
   if(!(f&1)&&light){const r=light(x,y);L+=r[0];w=r[1]||0}
   const M=MATS[m],n=M.ramp.length;// dithering em faixas: cor chapada, com xadrez só na transição entre dois tons
   const fl=Math.floor(L),fr=L-fl;let k=(f&2)?Math.round(L):(fr<.3?fl:fr>.7?fl+1:fl+((x+y)&1));k=clamp(k,0,n-1);
   const c=(w>.75||(w>.4&&((x+y)&1)))?M.warm[k]:M.ramp[k];out[o]=c[0];out[o+1]=c[1];out[o+2]=c[2];out[o+3]=255}
  return out}
}
// meio-tom pontual: decide no desenho se um pixel entra (para halos, névoa, poeira)
const dith=(x,y,a)=>a>bay(Math.round(x),Math.round(y));

const PIX={PW,PH,SC,Pix,MI,MATS,mat,bay,dith,clamp,sm,lerp,hash,h2,rng};
root.PIX=PIX;if(typeof module!=='undefined'&&module.exports)module.exports=PIX;
})(typeof window!=='undefined'?window:globalThis);
