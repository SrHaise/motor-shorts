// uso: node render.js video.js saida.mp4 [--fps 30] [--preview 2,10,20]
// requer: npm i @napi-rs/canvas node-web-audio-api @expo-google-fonts/press-start-2p   e ffmpeg
const fs=require('fs'),path=require('path'),vm=require('vm'),{spawn,execFileSync}=require('child_process');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');const WA=require('node-web-audio-api');
const args=process.argv.slice(2),vid=args[0],out=args[1]||'video.mp4';
const opt=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null};
const FPS=+(opt('--fps')||30),preview=opt('--preview');
// fonte pixelada (TTF)
const ttf=path.join(path.dirname(require.resolve('@expo-google-fonts/press-start-2p/package.json')),'400Regular','PressStart2P_400Regular.ttf');
GlobalFonts.registerFromPath(ttf,'Press Start 2P');
// carrega motor + vídeo
const ctx={console,Math,Float32Array,Uint8Array,ArrayBuffer,DataView,setTimeout,Object,Array,String,Number,JSON};ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'motor.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(vid,'utf8')+'\n;globalThis.VIDEO=VIDEO;',ctx);
const E=ctx.ENGINE,V=ctx.VIDEO;E.prepDLG(V.dlg||[]);E.init({createCanvas});
const DUR=V.dur,main=createCanvas(1080,1920),mctx=main.getContext('2d');
if(preview){for(const t of preview.split(',').map(Number)){E.frame(main,t,V);fs.writeFileSync(`preview_${t}.png`,main.toBuffer('image/png'))}console.log('prévias salvas');process.exit(0)}
(async()=>{
 const tmpV=out+'.v.mp4',tmpA=out+'.a.wav';
 // 1) vídeo
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s','1080x1920','-r',String(FPS),'-i','-','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',tmpV],{stdio:['pipe','inherit','inherit']});
 const total=Math.ceil(DUR*FPS);const t0=Date.now();
 for(let i=0;i<total;i++){E.frame(main,i/FPS,V);const buf=Buffer.from(mctx.getImageData(0,0,1080,1920).data.buffer);
  if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));
  if(i%FPS===0)process.stdout.write(`\rquadros ${i}/${total}`)}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));console.log(`\rvídeo ok (${((Date.now()-t0)/1000).toFixed(0)}s)`);
 // 2) áudio offline com a mesma mixagem
 const SR=48000,oac=new WA.OfflineAudioContext(2,Math.ceil(SR*(DUR+.5)),SR);const A=E.audioInit(oac);E.session(A,0,V,0);
 const ab=await oac.startRendering();const L=ab.getChannelData(0),R=ab.getChannelData(1),n=L.length,wav=Buffer.alloc(44+n*4);
 wav.write('RIFF',0);wav.writeUInt32LE(36+n*4,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(SR,24);wav.writeUInt32LE(SR*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*4,40);
 for(let i=0;i<n;i++){wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,L[i]))*32767),44+i*4);wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,R[i]))*32767),46+i*4)}
 fs.writeFileSync(tmpA,wav);console.log('áudio ok');
 // 3) junta e normaliza para -14 LUFS / -1 dBTP
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',tmpV,'-i',tmpA,'-af','loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89:level=false','-ar','48000','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out]);
 fs.unlinkSync(tmpV);fs.unlinkSync(tmpA);console.log('MP4 pronto:',out);
})();
