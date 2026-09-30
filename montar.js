// uso: node montar.js video.js saida.html
const fs=require('fs'),path=require('path');
const [,,vid,out]=process.argv;const dir=__dirname;
let html=fs.readFileSync(path.join(dir,'modelo.html'),'utf8');
const motor=fs.readFileSync(path.join(dir,'motor.js'),'utf8'),video=fs.readFileSync(vid,'utf8');
const title=(video.match(/title\s*:\s*['"`]([^'"`]+)/)||[])[1]||'Vídeo';
html=html.replace('/*__TITLE__*/',title).replace('/*__MOTOR__*/',()=>motor).replace('/*__VIDEO__*/',()=>video);
fs.writeFileSync(out,html);console.log('HTML pronto:',out);
