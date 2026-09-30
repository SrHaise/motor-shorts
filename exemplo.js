/* =====================================================================
   EXEMPLO DE VÍDEO — "Two Doors" (14s)
   Modelo de como escrever um vídeo para o motor. Coordenadas sempre em
   1080×1920 (o motor pixeliza sozinho). Tempos sempre em segundos.
   ===================================================================== */
const VIDEO={
 title:'Two Doors',
 dur:14,
 poster:2,                       // quadro mostrado antes de dar play
 // ---- texto digitado: v 'n' narrador | 'e' entidade | 'E' entidade grande
 // y: 'ALTA' | 'MEDIA' | 'BAIXA' ou um número em px
 dlg:[
  {a:.3, b:3.8, v:'n', text:'Two doors. Only one way out.', y:'ALTA'},
  {a:4.1,b:7.9, v:'n', text:'PAUSE AND CHOOSE', y:'BAIXA'},
  {a:9.3,b:10.9,v:'e', text:'Come in.', y:'ALTA'},
  {a:12.2,b:14, v:'n', text:'Comment: 1 or 2?', y:'MEDIA'},
 ],

 /* ---- CENA (baixa resolução, pixelada) ---- */
 scene(t,g,E){
  const room=(open,zoom)=>{
   g.save();g.translate(540,1000);g.scale(zoom,zoom);g.translate(-540,-1000);
   // parede e chão (cenário simples e chapado)
   g.fillStyle='#2e3446';g.fillRect(-200,-200,1480,1500);
   g.fillStyle='rgba(0,0,0,.22)';for(let x=-200;x<1280;x+=46)g.fillRect(x,-200,4,1500);
   g.fillStyle='#2b2019';g.fillRect(-200,1300,1480,900);
   // porta 1 (fria)
   g.fillStyle='#0c0806';g.fillRect(130,560,340,760);g.fillStyle='#1d2436';g.fillRect(150,580,300,740);
   g.fillStyle='rgba(110,150,230,.8)';g.fillRect(150,1310,300,10);E.glow(g,300,1320,260,'110,150,230',.25);
   // porta 2 (quente)
   g.fillStyle='#0c0806';g.fillRect(610,560,340,760);
   if(open>0){g.fillStyle='#ffb45a';g.fillRect(630,580,300,740);E.glow(g,780,950,620,'255,170,90',.35*open);
    E.hooded(g,780,1320,1.05,t,{eyes:'red',knife:true,glint:.6+.4*Math.sin(t*9)})}
   g.fillStyle='#3a2415';g.fillRect(630,580,300*(1-open*.9),740);
   g.fillStyle='rgba(255,190,110,.9)';g.fillRect(630,1310,300,10);E.glow(g,780,1320,260,'255,180,100',.25);
   g.fillStyle='#b08d3c';g.beginPath();g.arc(430,960,12,0,7);g.arc(650,960,12,0,7);g.fill();
   g.restore();
  };
  if(t<4) room(0,1+t*.01);
  else if(t<8){room(0,1.04);E.desat(g);E.badge(g,1,300,760);E.badge(g,2,780,760)}
  else if(t<8.4){room(0,1.04);E.desat(g);E.glitch(g,t)}
  else if(t<11.8){const o=E.sm(8.5,9.2,t),z=1+.9*Math.pow(E.sm(10.6,11.6,t),2);
   g.save();E.shake(g,t,t>11.2?14:0);room(o,z);g.restore()}
  // 11.8+ tela preta (o motor já começa cada quadro em preto)
  E.fade(g,1-E.sm(0,.4,t));                            // entra do preto
 },

 /* ---- SOBREPOSIÇÃO (alta resolução, nítida): flashes e contagem ---- */
 overlay(t,g,E){
  E.countdown(g,t,4.9);                                // 3, 2, 1 a partir de 4,9s
  if(t>=11.2&&t<11.3)E.flash(g,1-(t-11.2)/.1);
 },

 /* ---- SOM (a mixagem padrão é aplicada pelo motor) ---- */
 score(S,A,E){
  A.room(S,0,11.8,.8);                                 // ambiente de casa
  A.drone(S,0,4,.25);                                  // tensão grave
  A.creak(S,1.6,.9,.45,'amb');
  A.heartbeat(S,4.2,7.9,.9,.93);                        // coração acelerando na escolha
  A.rewind(S,8);                                       // glitch de volta
  A.creak(S,8.5,.8,.6);                                // porta abrindo
  A.tension(S,8.6,11.2,.03);
  A.breathing(S,8.5,11.1,.36,.45);                     // pânico
  A.riser(S,10.4,11.2);
  A.stinger(S,11.2,.55);                               // susto
  A.slam(S,11.8);                                      // corte seco
  A.silence(S,11.8,14);                                // silêncio (só os blips)
 }
};
