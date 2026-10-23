// Cabelos da Head V2 — modelos prontos que se encaixam em qualquer cabeça (clica e troca).
//
// Cada penteado tem duas camadas:
//  1. Touca: cópia da pele dentro da linha do cabelo, afastada pela normal (cobre o couro cabeludo; a borda
//     afunda na pele e vira uma linha de cabelo limpa).
//  2. Mechas: tubos achatados e afinando na ponta que nascem na touca, seguem o fluxo do penteado (risca, para trás,
//     redemoinho, coque), abraçam a cabeça e caem com a gravidade depois do "equador", sem atravessar rosto, orelhas
//     ou pescoço. Ondas, cachos (hélice) e tranças são aplicados sobre esse caminho.
// O rosto não é alterado: olhos, nariz e boca continuam exatamente iguais.
// A cor do cabelo é a cor do material (as cores por vértice guardam só luz e sombra) → trocar a cor é instantâneo.
import {buildHeroHair} from './hero-hair.js';

// ---------------- catálogo ----------------
// flow: 'part' (risca: x = partX), 'back' (penteado para trás), 'whorl' (redemoinho na coroa), 'knot' (preso num coque)
// cap: espessura da touca; n/spacing: quantidade de mechas; w/th: largura/espessura; endY: onde as pontas terminam
// over: quanto a mecha pode passar da linha do cabelo (curto); grav: gravidade; wave/curl: ondas e cachos
export const HAIR_STYLES = {
  none: { label: 'Careca', sub: 'Sem cabelo' },
  short: { label: 'Curto', sub: 'Topete leve, laterais baixas', flow: 'whorl', lines: 110, seed: .03, cap: .012, topVol: 1.2, len: [1.5, 1.7], over: .04, grav: .12, layer: .022, lift: .045,
    bulge: .02, tip: .78, maxStrip: .5, wave: { a: .01, f: 1.2 }, tipLift: .045, hairline: .5, sideburn: -.02, inner: false },
  swept: { label: 'Para trás', sub: 'Penteado para trás, entradas', flow: 'back', seed: .03, cap: .012, topVol: .6, len: [2.6, 2.8], endY: 'nape+', grav: .55, layer: .025, lift: .025,
    bulge: .02, tip: .72, wave: { a: .014, f: 1.1 }, flick: .05, hairline: .6, templeLift: .12, flare: .02 },
  royal: { label: 'Real', sub: 'Volumoso, cobre as orelhas, pontas viradas', flow: 'back', seed: .036, cap: .016, topVol: .5, len: [3, 3.2], endY: 'neck', grav: .75, layer: .045, lift: .025,
    bulge: .035, tip: .78, wave: { a: .03, f: 1.1 }, flick: .07, hairline: .45, flare: .06, inner: false, maxStrip: .22 },
  long_wavy: { label: 'Longo ondulado', sub: 'Risca ao lado, ondas até os ombros', flow: 'part', partX: .1, seed: .042, cap: .016, topVol: .7, len: [4, 4.2], endY: 'long', grav: .85, layer: .07, lift: .05,
    bulge: .05, tip: .8, wave: { a: .07, f: .85 }, hairline: .42, flare: .2 },
  long_braids: { label: 'Longo com tranças', sub: 'Solto para trás e duas tranças na frente', flow: 'back', seed: .032, cap: .016, topVol: .7, len: [4, 4.2], endY: 'long', grav: .8, layer: .07, lift: .04,
    bulge: .04, tip: .84, wave: { a: .06, f: .9 }, hairline: .44, flare: .18, braids: { at: 'temple', len: 1.25, r: .045 } },
  long_curly: { label: 'Cachos volumosos', sub: 'Muito volume, cachos em espiral', flow: 'part', partX: -.06, seed: .034, cap: .02, topVol: 1, len: [3.6, 3.8], endY: 'shoulder', grav: .7, layer: .09, lift: .05,
    bulge: .035, tip: .8, wave: { a: .05, f: 1.2 }, hairline: .42, flare: .3, faceFrame: 4,
    tubes: true, n: 150, spacing: .055, w: .045, th: .042, curl: { r: [.025, .06], pitch: .26 } },
  bun: { label: 'Coque', sub: 'Preso no alto, fios soltos no rosto', flow: 'knot', knot: { y: .06, z: -.12, R: .22 }, seed: .03, cap: .014, topVol: .2, len: [1.6, 1.6], grav: 0, layer: .015,
    bulge: .016, tip: .97, hairline: .42, wisps: 2 },
  topknot: { label: 'Coque guerreiro', sub: 'Coque no alto, rabo e tranças', flow: 'knot', knot: { y: .0, z: -.42, R: .2 }, seed: .032, cap: .012, topVol: .1, len: [1.8, 1.8], grav: 0, layer: .012,
    bulge: .016, tip: .97, hairline: .5, tail: { n: 26, endY: -1.45, wave: .05 }, braids: { at: 'side', len: 1.1, r: .04, rings: true } },
  clown: { label: 'Cachinhos de palhaço', sub: 'Topo careca, cachos nas laterais', flow: 'out', tubesOnly: true, noCap: true, n: 170, tubes: true, cap: .03, topVol: 0, spacing: .04, w: .045, th: .045,
    len: [.28, .42], grav: .25, layer: .03, curl: { r: [.03, .045], pitch: .12 }, hairline: .3, band: { top: .28 }, sideburn: -.15 }
};
// Identidades do catálogo: os nomes e cores são mantidos pelo gerador compartilhado.
HAIR_STYLES.lunar_curls={...HAIR_STYLES.bun,curlBun:true,label:'Cachos presos',sub:'Coque cacheado alto, com mechas soltas',knot:{y:.18,z:-.16,R:.43},tubes:true,n:88,spacing:.085,w:.05,th:.045,curl:{r:[.04,.075],pitch:.22},wisps:5};
HAIR_STYLES.short_curls={...HAIR_STYLES.short,label:'Curto cacheado',sub:'Cachos curtos e topete de inventor',tubes:true,n:64,spacing:.1,w:.047,th:.042,curl:{r:[.03,.055],pitch:.2},len:[1.2,1.5],topVol:1.4};
// Penteados da floresta.
HAIR_STYLES.forest_pixie={...HAIR_STYLES.royal,label:'Curto em camadas',sub:'Risca lateral e mechas soltas',flow:'part',partX:.18,len:[1.9,2.2],endY:'nape+',topVol:1,layer:.055,wave:{a:.04,f:1.2},flare:.08,maxStrip:.18,hairline:.46,tubes:true,n:100,spacing:.065,w:.065,th:.045,curl:{r:[.012,.024],pitch:.3}};
HAIR_STYLES.forest_locks={...HAIR_STYLES.long_braids,label:'Mechas torcidas',sub:'Mechas longas em cordões, presas para trás',braids:null,tubes:true,n:54,spacing:.12,w:.065,th:.059,curl:{r:[.008,.018],pitch:.35},len:[3.3,3.7],endY:'shoulder',topVol:.85,layer:.065};
HAIR_STYLES.court_waves={...HAIR_STYLES.long_wavy,label:'Ondas de corte',sub:'Cabelo longo em camadas onduladas',len:[5.0,5.6],endY:-2.7,wave:{a:.085,f:.85},layer:.075,faceFrame:3,w:.075,th:.032,maxStrip:.24};
// Fluxo de escultura usado por cada penteado.
HAIR_STYLES.forest_pixie.hero='pixie';
HAIR_STYLES.forest_locks.hero='locks';
HAIR_STYLES.court_waves.hero='waves';
HAIR_STYLES.lunar_curls.hero='curlup';
HAIR_STYLES.short_curls.hero='tousled';
HAIR_STYLES.hero_halfup={label:'Ondas com coque',sub:'Cabelo longo em camadas e coque entrelaçado',hero:'halfup'};
HAIR_STYLES.hero_tousled={label:'Topete de herói',sub:'Mechas largas, onduladas e despenteadas',hero:'tousled'};
HAIR_STYLES.hero_veteran={label:'Corte de veterano',sub:'Camadas espessas e pontas viradas',hero:'veteran'};
export const HAIR_COLORS = [
  ['Preto', '#17110f'], ['Castanho escuro', '#3a2417'], ['Castanho', '#6b4027'], ['Ruivo', '#b4441c'], ['Acobreado', '#8e3b1e'],
  ['Loiro', '#d6ad62'], ['Loiro claro', '#eedbb0'], ['Grisalho', '#9c968e'], ['Branco', '#efede8'],
  ['Azul', '#3456c4'], ['Rosa', '#e3679c'], ['Roxo', '#7446bf'], ['Verde', '#3f9152']
];

// Todos os estilos usam a mesma construção fechada, mantendo a identidade do catálogo.
const SCULPTED_STYLE={short:'short',swept:'swept',royal:'royal',long_wavy:'long',long_braids:'braids',long_curly:'curly',bun:'bun',topknot:'topknot',clown:'clown'};
export function buildHair(fit,id,color='#2a1a12'){
 const style=HAIR_STYLES[id];if(!fit||!style||id==='none')return null;
 return buildHeroHair(fit,{...style,id,hero:style.hero||SCULPTED_STYLE[id]},color);
}
