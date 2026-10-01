# Modo pixel — pixel art desenhada pixel a pixel

O modo clássico (`scene(t,g,E)`) desenha formas vetoriais em 1080×1920 e só pixeliza no fim.
O **modo pixel** desenha direto numa tela de **180×320** (ampliada 6×), com paleta limitada,
dithering, contorno e luz de contorno. Use quando o roteiro pedir o visual "jogo 2D".

Exemplo completo e testado: **`exemplo_pixel.js`** (The Knife or the Book, 40,5 s, 9 planos).
Leia `pix.js` e `exemplo_pixel.js` por inteiro antes de escrever um vídeo neste modo.

## O que muda no video.js

```js
const {Pix,mat,dith,clamp,sm,lerp,hash,h2,rng,PW,PH}=PIX;   // kit global
mat('pedra',['#07080B','#171A21','#232835','#2E3446','#394052','#6F86B8']);  // rampas no topo do arquivo

const VIDEO={
 title, dur, poster, dlg:[...],          // igual ao modo clássico
 pix(t,E){                               // no lugar de scene()
  const p=new Pix();
  ...desenha...
  return {p, light:(x,y)=>[nível, calor], shake:[dx,dy], post:buf=>{...}};  // ou null = tela preta
 },
 overlay(t,g,E){...},                     // igual (alta resolução: flashes, badges, contagem, glitch)
 score(S,A,E){...},                       // igual (som e mixagem não mudam)
};
```

Render, prévias e HTML são os mesmos comandos: `node render.js video.js video.mp4 --preview 1,8,25`.
A caixa de texto continua em alta resolução, desenhada pelo motor.

## Coordenadas
- Tela 180×320. Para converter do modo clássico: **divida por 6** (1080×1920 → 180×320).
- Zonas seguras iguais: nada importante abaixo de y≈272 nem na faixa direita.
- Caixa de texto ALTA ≈ y 65–95, MEDIA ≈ y 150–170, BAIXA ≈ y 235–265 (em pixels da tela 180×320).

## Como cada pixel vira cor
Cada pixel guarda **material** (uma rampa de 5–8 cores, escuro → claro) e **nível** (posição na rampa).
No fim, `light(x,y)` devolve `[somaDeNível, calor]`: soma ao nível (luz positiva, sombra/vinheta negativa)
e `calor` 0–1 troca para a versão quente da rampa (luz de tocha, runa). Nível fracionário vira
**xadrez** só na transição entre dois tons; o resto fica chapado.

- Sombras puxam para frio/roxo, brilhos para quente: monte as rampas assim (hue shift).
- `flag 1` = emissivo (ignora luz e vinheta): runas, olhos, faíscas, céu dentro de portais.
- Vermelho `#FF2A1A` só para a entidade ou perigo (rampa `sangue` do exemplo).

## Ferramentas
| | |
|---|---|
| `px rect line circle disc ell poly thick` | primitivas pixel-perfect; `l` pode ser número ou função `(x,y)=>nível` (textura) |
| `add(x,y,dl)` / `shade` | escurece/clareia o que já foi desenhado (sombras, entalhes) |
| `begin()` … `end()` | agrupa o que foi desenhado numa silhueta |
| `outline(g,mat,nível)` | contorno escuro de 1 px em volta da silhueta |
| `rim(g,lx,ly,quanto)` | luz de contorno no lado de onde vem a luz (ex.: `-1,-1` = cima-esquerda) |
| `sprite({rows,leg},x,y,{flip,flipY})` | grade de texto → pixels; `leg` mapeia letra → `[material,nível]` |
| `dith(x,y,a)` | decide se um pixel entra num meio-tom (halos, névoa, brilho) |

Padrões já prontos no exemplo para copiar e adaptar: `tijolo()` (parede), `camara()` (sala com câmera/zoom),
`rot()` (objeto girado desenhado no espaço local: facas, mãos, lanterna), `beamAt()` (feixe de luz),
`andarilho()` (personagem de costas com ciclo de 4 quadros), `coqueiro()`, `fenda()` (portal), `olhos()`.

## Regras de estilo
- **Cenários procedurais** (pedra, areia, mar, chão): textura por pixel com `h2(x,y)` em poucos pontos
  (poros e brilhos esparsos), nunca ruído em todo pixel.
- **Personagens e objetos-chave como sprites** (grade de texto, ~20×45 px por personagem) ou com `rot()`.
  Sempre `outline` + `rim`. Animação por quadros (2–4 por ação, ~8 quadros/s) e um movimento secundário.
- **Sprites não escalam nem giram suave** (borra os pixels). Para aproximar, redesenhe maior ou corte o plano.
  Objetos procedurais (`camara`, `rot`) podem dar zoom porque são redesenhados a cada quadro.
- Tremor (`shake`) e balanço em **pixels inteiros** da tela pequena.
- Gradientes grandes (céu, vinheta) ficam em faixas: use vinheta leve em cenas claras.
- Sem granulado: o modo pixel não aplica o grão nem a vinheta do modo clássico.
