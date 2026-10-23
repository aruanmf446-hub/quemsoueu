// Presets de rosto da Head V2.
// Espaço da cabeça: y=0 ≈ linha dos olhos, +z = frente, ~0.8 = meia-largura do crânio.
// Forma base (campo de distância, união suave):
//   cran = crânio [y, z, rx, ry, rzFrente, rzTrás, expoente da frente]
//   occ  = occipital / nuca [y, z, rx, ry, rz, blend]
//   loft = casca facial: curvas por altura y — a (meia-largura, contorno de frente), zf (frente, perfil),
//          zb (fundo: ramo e linha de baixo da mandíbula); n = quadratura da frente, cb = arredondamento do queixo
//   neck = pescoço [raio, topoY, topoZ, baseY, baseZ, blend]; scm = músculo do pescoço (esternocleidomastoideo)
// Relevo fino (olhos, nariz, boca, prega da pálpebra, zigomático…) e pele: src/head.js.
import {FRONTIER_CHARACTERS,FRONTIER_COMPANIONS} from './frontier.js';
import {FOREST_CHARACTERS} from './forest.js';
import {refineFaceIdentities} from './face-identities.js';
const deg = d => d * Math.PI / 180;

export const PRESETS = {
  feminine_soft: {
    id: 'feminine_soft', family: 'Humanos', sub: 'Rosto em coração, olhos amendoados, lábios cheios', label: 'Feminino suave',
    skin: '#cc9373', blush: '#d66f72', lip: '#ac3e4d', lipLine: '#4e1520', brow: '#2a1913', liner: '#160c0b', lidShadow: '#9a5a4c',
    iris: ['#f2bd62', '#ad6522', '#4c2408'],
    cran: [.18, -.08, .79, .78, .84, .84, 2.4], occ: [.02, -.5, .58, .55, .42, .25],
    loft: { y: [-1.1, -1.02, -.92, -.8, -.66, -.5, -.32, -.15, 0, .15, .32], a: [.11, .22, .385, .54, .65, .725, .76, .765, .74, .6, .42],
      zf: [.62, .68, .71, .72, .735, .765, .78, .76, .72, .6, .42], zb: [.36, .26, .1, -.04, -.15, -.22, -.26, -.28, -.3, -.3, -.3], n: 2.2, cb: .12, k: .16 },
    neck: [.35, -.62, -.13, -1.6, -.2, .24], scm: [.3, -.4, -.32, .07, -1.4, -.04, .075, .16],
    eyeX: .355, eyeY: 0, Re: .232, openW: deg(64), openU: deg(24), openL: deg(-23), peakU: -.12, peakL: .12, irisAng: deg(31.5),
    tilt: deg(5), sink: .2, socket: .035, crease: .016, creaseGap: .05, lidShade: .55, orbit: .022, lidFold: .009, lowerRoll: .006, eyeShadow: .5,
    lash: .025, flick: .07, lashN: 15, lashLen: .075, lowerLash: .5,
    // sobrancelhas
    browGap: .172, browTh: .042, browArch: .036, browPeak: .66, browSlope: .006, browLen: 1.1,
    // nariz
    noseTipY: -.4, noseH: .078, noseW: .86, tipH: .064, tipR: .056, alaeH: .024, alaeX: .06, scoop: 1.5,
    // boca
    mouthY: -.725, mouthW: .23, lipU: .046, lipL: .064, lipH: .046, smile: 1.15, bow: .5,
    // volumes
    cheekH: .05, chinH: .03, muzzle: .012, browRidge: .015, fold: .5, zyg: .012, hollow: .005, temple: .01,
    blushK: 0.75, earS: .88
  },
  masculine_soft: {
    id: 'masculine_soft', family: 'Humanos', sub: 'Mandíbula marcada, olhar maduro, barba sombreada', label: 'Masculino suave',
    skin: '#a87258', blush: '#b0605a', lip: '#93554c', lipLine: '#3e1914', brow: '#1d120e', liner: '#24160f', lidShadow: '#7c4a3a',
    iris: ['#b8874a', '#5a3218', '#1f1109'],
    cran: [.18, -.1, .82, .8, .86, .86, 2.6], occ: [0, -.52, .6, .55, .44, .25],
    loft: { y: [-1.17, -1.11, -1.0, -.86, -.7, -.48, -.25, 0, .15, .32], a: [.27, .37, .5, .6, .66, .7, .74, .76, .62, .44],
      zf: [.58, .66, .69, .71, .74, .78, .78, .74, .62, .44], zb: [.38, .3, .1, -.12, -.24, -.3, -.3, -.3, -.3, -.3], n: 2.6, cb: .06, k: .12, blur: .04 },
    neck: [.42, -.66, -.13, -1.6, -.2, .22], scm: [.36, -.44, -.32, .09, -1.4, -.02, .095, .16],
    eyeX: .362, eyeY: .02, Re: .21, openW: deg(60), openU: deg(15), openL: deg(-17), peakU: -.02, peakL: .18, irisAng: deg(29.5),
    tilt: deg(-1), sink: .19, socket: .05, crease: .008, creaseGap: .035, lidShade: .3, orbit: .045, lidFold: .006, lowerRoll: .005, eyeShadow: .55,
    lash: .011, flick: 0, lashN: 0, lashLen: .03, lowerLash: .15,
    browGap: .158, browTh: .042, browArch: .014, browPeak: .5, browSlope: -.012, browLen: 1.1,
    noseTipY: -.44, noseH: .1, noseW: 1.08, tipH: .05, tipR: .062, alaeH: .022, alaeX: .085, scoop: 1.0,
    mouthY: -.78, mouthW: .235, lipU: .036, lipL: .062, lipH: .048, smile: .18, bow: .2,
    cheekH: .008, chinH: .03, muzzle: .012, browRidge: .05, fold: .7, zyg: .03, hollow: .02, temple: .022, beard: .32,
    blushK: 0.35, earS: .84
  },
  cute_round: {
    id: 'cute_round', family: 'Humanos', sub: 'Rosto redondo, olhos enormes, bochechas cheias', label: 'Cute arredondado',
    skin: '#e6ad90', blush: '#ef7f82', lip: '#d4677a', lipLine: '#7a2a3a', brow: '#3a241b', liner: '#1e1210', lidShadow: '#b06c62',
    iris: ['#f6d58c', '#b8763a', '#4a2813'],
    cran: [.14, -.08, .84, .8, .86, .84, 2.3], occ: [0, -.48, .6, .55, .42, .25],
    loft: { y: [-.9, -.82, -.72, -.6, -.46, -.3, -.12, .05, .2, .32], a: [.2, .36, .54, .66, .74, .78, .79, .74, .62, .45],
      zf: [.58, .66, .71, .74, .76, .77, .75, .7, .6, .45], zb: [.3, .12, -.05, -.18, -.25, -.28, -.3, -.3, -.3, -.3], n: 2.15, cb: .1, k: .18 },
    neck: [.33, -.55, -.13, -1.55, -.2, .24], scm: [.3, -.38, -.3, .07, -1.4, -.04, .07, .16],
    eyeX: .372, eyeY: -.07, Re: .262, openW: deg(60), openU: deg(30), openL: deg(-30), peakU: -.08, peakL: .05, irisAng: deg(35),
    tilt: deg(-2), sink: .215, socket: .03, crease: .01, creaseGap: .05, lidShade: .45, orbit: .012, lidFold: .008, lowerRoll: .007, eyeShadow: .42,
    lash: .016, flick: .025, lashN: 11, lashLen: .06, lowerLash: .3,
    browGap: .27, browTh: .025, browArch: .035, browPeak: .52, browSlope: 0, browLen: .9,
    noseTipY: -.33, noseH: .04, noseW: .86, tipH: .06, tipR: .06, alaeH: .024, alaeX: .056, scoop: 1.8,
    mouthY: -.565, mouthW: .17, lipU: .042, lipL: .056, lipH: .05, smile: 1.0, bow: .32,
    cheekH: .055, chinH: .01, muzzle: .015, browRidge: .005, fold: .3, temple: .005,
    blushK: 0.8, earS: .82
  },
  feminine_bold: {
    id: 'feminine_bold', family: 'Humanos', sub: 'Olhar felino, sobrancelha alta, lábios escuros', label: 'Feminino intenso',
    skin: '#bb7d5e', blush: '#c25e5c', lip: '#7c1d2b', lipLine: '#360a12', brow: '#170d0a', liner: '#0c0606', lidShadow: '#6e3c3a',
    iris: ['#f2a24e', '#b4531c', '#481a08'],
    cran: [.18, -.08, .79, .78, .84, .84, 2.4], occ: [.02, -.5, .58, .55, .42, .25],
    loft: { y: [-1.05, -.97, -.88, -.76, -.63, -.48, -.3, -.13, 0, .15, .32], a: [.11, .21, .37, .52, .63, .715, .765, .775, .74, .6, .42],
      zf: [.62, .68, .71, .72, .735, .765, .78, .76, .72, .6, .42], zb: [.37, .27, .11, -.03, -.14, -.21, -.26, -.28, -.3, -.3, -.3], n: 2.3, cb: .11, k: .14 },
    neck: [.34, -.62, -.13, -1.6, -.2, .24], scm: [.3, -.4, -.32, .07, -1.4, -.04, .075, .16],
    eyeX: .36, eyeY: 0, Re: .225, openW: deg(66), openU: deg(18), openL: deg(-19), peakU: .12, peakL: .22, irisAng: deg(30),
    tilt: deg(10), sink: .2, socket: .04, crease: .02, creaseGap: .045, lidShade: .9, orbit: .03, lidFold: .01, lowerRoll: .006, eyeShadow: .6,
    lash: .022, flick: .1, lashN: 14, lashLen: .07, lowerLash: .7,
    browGap: .18, browTh: .03, browArch: .075, browPeak: .7, browSlope: .03, browLen: 1.08,
    noseTipY: -.375, noseH: .085, noseW: .82, tipH: .058, tipR: .05, alaeH: .02, alaeX: .058, scoop: 1.3,
    mouthY: -.68, mouthW: .23, lipU: .06, lipL: .072, lipH: .055, smile: .75, bow: .3,
    cheekH: .025, chinH: .015, muzzle: .012, browRidge: .02, fold: .4, zyg: .026, hollow: .016, temple: .016,
    blushK: 0.62, earS: .86
  }
};

// Novos personagens herdam de uma base humana e trocam só o que muda.
const derive = (base, o) => ({ ...PRESETS[base], beard: 0, beardVol: null, ...o });

PRESETS.alchemist_villain = derive('masculine_soft', {
  id: 'alchemist_villain', label: 'Alquimista vilão', family: 'Humanos', sub: 'Rosto longo, queixo pontudo, nariz adunco, sorriso torto',
  skin: '#d6bfa9', blush: '#b98a86', lip: '#9a6c64', lipLine: '#3a1a1a', brow: '#9a948e', liner: '#2a1a1e', lidShadow: '#6a4a62', bag: '#7c5878', bagK: .6,
  iris: ['#d2cdbf', '#77726a', '#2e2c2a'],
  cran: [.22, -.08, .75, .86, .82, .86, 2.5], occ: [.02, -.5, .56, .58, .42, .25],
  loft: { y: [-1.42, -1.32, -1.16, -.98, -.8, -.6, -.4, -.2, 0, .15, .32], a: [.07, .15, .26, .37, .46, .54, .61, .67, .7, .6, .42],
    zf: [.64, .69, .7, .7, .71, .74, .77, .76, .72, .6, .42], zb: [.42, .33, .18, .02, -.1, -.2, -.26, -.28, -.3, -.3, -.3], n: 2.4, cb: .07, k: .14 },
  neck: [.3, -.75, -.13, -1.75, -.2, .22], scm: [.3, -.5, -.32, .06, -1.5, -.04, .07, .16],
  eyeX: .33, eyeY: .02, Re: .2, openU: deg(11), openL: deg(-15), peakU: .12, peakL: .2, tilt: deg(6), crease: .013, lidShade: .9, eyeShadow: .65,
  browGap: .2, browTh: .028, browArch: .07, browPeak: .72, browSlope: .03, browLen: 1.05,
  noseTipY: -.55, noseH: .15, noseW: .88, tipH: .06, tipR: .05, alaeH: .014, alaeX: .07, scoop: .75,
  mouthY: -.9, mouthW: .25, lipU: .02, lipL: .03, lipH: .025, smile: .45, smirk: 1.0, bow: .1,
  cheekH: 0, chinH: .05, hollow: .05, zyg: .045, temple: .035, fold: 1.0, blushK: .2, earS: .92, earPoint: .18
});

PRESETS.dwarf_bard = derive('cute_round', {
  id: 'dwarf_bard', label: 'Anão aventureiro', family: 'Humanos', sub: 'Nariz grande e redondo, barba e bigode, orelhas pontudas',
  skin: '#dd9b78', blush: '#e2705f', lip: '#a95b4f', lipLine: '#4a1a14', brow: '#5e3820', liner: '#2a1a10', lidShadow: '#a0604a',
  iris: ['#c98a4a', '#6a3a18', '#2a1508'],
  loft: { y: [-.95, -.86, -.74, -.6, -.46, -.3, -.12, .05, .2, .32], a: [.3, .45, .6, .7, .76, .79, .79, .74, .62, .45],
    zf: [.58, .66, .71, .74, .76, .77, .75, .7, .6, .45], zb: [.32, .14, -.04, -.18, -.25, -.28, -.3, -.3, -.3, -.3], n: 2.3, cb: .09, k: .18 },
  eyeX: .35, Re: .2, openU: deg(21), openL: deg(-18), peakU: -.05, tilt: deg(-3), lash: .012, flick: 0, lashN: 0, lowerLash: .1,
  browGap: .19, browTh: .055, browArch: .03, browPeak: .5, browSlope: -.01, browLen: 1.05,
  noseTipY: -.37, noseH: .07, noseW: 1.2, tipH: .13, tipR: .1, alaeH: .045, alaeX: .1, scoop: 1.2,
  mouthY: -.6, mouthW: .19, lipU: .022, lipL: .036, lipH: .028, smile: 1.1, bow: .1,
  cheekH: .07, blushK: 1.0, beardVol: { thick: .06, len: .4, color: '#7a4a28', stache: true },
  earS: .85, earPoint: .55, earTipA: .55
});

PRESETS.old_king = derive('masculine_soft', {
  id: 'old_king', label: 'Rei', family: 'Humanos', sub: 'Olhar firme, testa marcada, barba e cabelo brancos', 
  skin: '#a8714f', blush: '#a8584e', lip: '#8e5046', brow: '#141010', lidShadow: '#6e3e30',
  iris: ['#a8784a', '#4a2a14', '#1a0e08'],
  eyeX: .358, Re: .2, openU: deg(12), openL: deg(-15), peakU: .08, tilt: deg(3), crease: .011, browTh: .05, browArch: .01, browSlope: .02, browRidge: .07,
  noseH: .11, tipR: .068, mouthW: .22, smile: -.1, hollow: .03, fold: .9, beard: 0
});

PRESETS.sad_clown = derive('cute_round', {
  id: 'sad_clown', label: 'Palhaço triste', family: 'Humanos', sub: 'Pintura branca, nariz vermelho, sobrancelhas tristes, boca caída',
  skin: '#e6b596', blush: '#e48a86', lip: '#b8202a', lipLine: '#5a0a10', brow: '#3a2a2a', liner: '#2a1a1a', lidShadow: '#9a8a9a',
  iris: ['#b8955e', '#6a4a26', '#2a1a0c'],
  paint: { base: '#f3ece0', mark: '#3f6fb5', mouth: '#c02028' }, noseType: 'ball', ballR: .105, ballColor: '#c8141c',
  loft: { y: [-.98, -.9, -.78, -.64, -.48, -.3, -.12, .05, .2, .32], a: [.24, .4, .57, .7, .78, .81, .8, .75, .62, .45],
    zf: [.58, .67, .72, .75, .77, .77, .75, .7, .6, .45], zb: [.34, .16, -.04, -.18, -.25, -.28, -.3, -.3, -.3, -.3], n: 2.2, cb: .12, k: .18 },
  eyeX: .34, Re: .22, openU: deg(22), openL: deg(-22), peakU: .3, peakL: -.1, tilt: deg(-9), lash: .012, flick: 0, lashN: 6, lowerLash: .2, eyeShadow: .55,
  browGap: .25, browTh: .03, browArch: .02, browPeak: .3, browSlope: -.05, browLen: .95,
  noseTipY: -.36, mouthY: -.66, mouthW: .2, lipU: .028, lipL: .036, lipH: .03, smile: -1.4, bow: .1,
  cheekH: .07, blushK: .45, earS: .85
});

PRESETS.orc_warrior = derive('masculine_soft', {
  id: 'orc_warrior', label: 'Orc guerreiro', family: 'Criaturas', sub: 'Testa pesada, presas, orelhas pontudas, mandíbula larga',
  skin: '#b25e47', blush: '#9c4636', lip: '#7a3a30', lipLine: '#2e100a', brow: '#24140e', liner: '#24140e', lidShadow: '#6a2e22',
  iris: ['#ffe066', '#e39b1c', '#7a3a08'], sss: [.42, .16, .1],
  cran: [.2, -.12, .86, .78, .86, .9, 2.6], occ: [0, -.52, .64, .55, .46, .25],
  loft: { y: [-1.12, -1.06, -.96, -.82, -.66, -.46, -.25, 0, .15, .32], a: [.38, .5, .63, .72, .78, .8, .8, .79, .64, .45],
    zf: [.66, .74, .77, .77, .76, .79, .8, .76, .62, .44], zb: [.42, .33, .12, -.1, -.24, -.3, -.3, -.3, -.3, -.3], n: 2.8, cb: .06, k: .12, blur: .04 },
  neck: [.54, -.7, -.13, -1.6, -.2, .26], scm: [.44, -.48, -.32, .12, -1.4, -.02, .12, .16],
  eyeX: .34, eyeY: .02, Re: .17, openU: deg(12), openL: deg(-14), peakU: .22, peakL: .15, tilt: deg(9), socket: .07, orbit: .08, eyeShadow: .6,
  browGap: .12, browTh: .06, browArch: .01, browPeak: .5, browSlope: .055, browLen: 1.1, browRidge: .1,
  noseTipY: -.42, noseH: .06, noseW: 1.5, tipH: .05, tipR: .09, alaeH: .05, alaeX: .13, scoop: .6,
  mouthY: -.75, mouthW: .3, lipU: .025, lipL: .075, lipH: .06, smile: -.35, bow: .05, muzzle: .05,
  tusks: { len: .17, r: .036, x: .2, out: .045, color: '#efe2c4' },
  beardVol: { thick: .045, len: .35, color: '#2a1a12' }, beard: .2,
  zyg: .05, hollow: .03, fold: .9, blushK: .2, earS: 1.0, earPoint: 1.1, earTipA: 1.15, earFlare: .35
});

// ---- vegetais: cabeça inteira é o vegetal; rosto aplicado na frente ----
const VEG = { earType: 'none', noseType: 'none', noLips: true, beard: 0, fold: 0, zyg: 0, hollow: 0, temple: 0, cheekH: 0, chinH: 0, muzzle: 0, blushK: .1, scm: null, lash: .011, flick: 0, lashN: 0, lowerLash: 0 };

// Forma própria por perfil girado (lathe): r(y) = largura em cada altura, zs = achatamento frente/trás, top/rc = tampa
// arredondada, dip = covinha no topo (onde entra o talo). Olhos saltados (sink pequeno), sem orelhas, sem nariz humano.
const VEG_EYES = { sink: .08, socket: 0, orbit: 0, crease: .006, creaseGap: .04, lidShade: .35, lowerRoll: .004, temple: 0 };

PRESETS.cactus_cowboy = derive('masculine_soft', { ...VEG, ...VEG_EYES,
  id: 'cactus_cowboy', label: 'Cacto pistoleiro', family: 'Vegetais', sub: 'Coluna com cúpula, nervuras e espinhos, olhar sonolento, sorriso de canto',
  skin: '#6c9b33', blush: '#7da23a', lip: '#3e5a1a', lipLine: '#1f2e0b', brow: '#24360c', liner: '#18220a', lidShadow: '#4f7424',
  iris: ['#e6bd72', '#8a5524', '#2e1a08'], patternColor: ['#3a6116', '#b2d466'], sss: [.1, .3, .05], rough: .62, sheen: .15, clearcoat: .15, skinGloss: .15,
  cran: [.3, -.04, .62, 1, .6, .6, 2], occ: null, loft: { y: [-1.2] },
  lathe: { cz: -.04, zs: .95, y: [-1.9, -1, 0, .8, 1.3], r: [.6, .61, .62, .62, .6], top: 1.3, rc: .55 },
  neck: [.6, -.9, -.04, -1.75, -.04, .3], scm: null,
  pattern: { type: 'ribs', n: 8, depth: .06, faceFade: .5, top: 1.28, bot: -1.95 },
  spines: { len: .085, r: .008, y0: -1.6, y1: 1.15, dy: .2, color: '#f3e7bf' },
  eyeX: .25, eyeY: .1, Re: .23, openW: deg(62), openU: deg(17), openL: deg(-32), peakU: .05, peakL: 0, tilt: deg(-4), irisAng: deg(24), lidFold: .012, eyeShadow: .55, domeK: .12, bagK: 0,
  browGap: .17, browTh: .065, browArch: .015, browPeak: .45, browSlope: .02, browLen: 1.05, browRidge: .06,
  mouthY: -.5, mouthW: .3, smile: .25, smirk: 1.2, lipU: .012, lipL: .012, lipH: 0, bow: 0, cheekH: .02
});

PRESETS.pepper_king = derive('masculine_soft', { ...VEG, ...VEG_EYES,
  id: 'pepper_king', label: 'Rei pimentão', family: 'Vegetais', sub: 'Pimentão de 4 gomos com talo, bigode de guidão, cara de bravo',
  skin: '#bf1d12', blush: '#9e120c', lip: '#7a0d08', lipLine: '#2e0503', brow: '#120c0c', liner: '#0e0808', lidShadow: '#8a140c',
  iris: ['#dcb27a', '#8a5a2a', '#2e1a0a'], patternColor: ['#6e0805', '#f2604a'], sss: [.5, .1, .06], rough: .3, clearcoat: 1, clearcoatRough: .1, skinGloss: .9, sheen: .05,
  cran: [.2, -.06, .9, .9, .85, .85, 2], occ: null, loft: { y: [-.8] },
  lathe: { cz: -.06, zs: .9, y: [-1.9, -1.3, -1.05, -.82, -.55, -.2, .2, .5, .78], r: [.42, .43, .52, .72, .86, .92, .94, .92, .82], top: .82, rc: .3, dip: .14, dipR: .26 },
  neck: [.42, -1.0, -.06, -1.75, -.06, .2], scm: null,
  pattern: { type: 'lobes', n: 4, depth: .12, faceFade: .45, top: .9, bot: -1.0, mid: -.1 },
  stem: { len: .42, r: .085, bend: .35, curl: 1.4, color: '#4f7d22', calyx: 5, calyxLen: .24, z: 0 },
  eyeX: .27, eyeY: .12, Re: .19, openU: deg(16), openL: deg(-20), peakU: .25, peakL: .15, tilt: deg(12), irisAng: deg(28), lidFold: .012, eyeShadow: .6, sink: .14, domeK: .2, bagK: 0, lidShade: .1,
  browGap: .15, browTh: .07, browArch: .03, browPeak: .55, browSlope: .07, browLen: 1.1, browRidge: .05,
  mouthY: -.42, mouthW: .14, smile: -.7, lipU: .015, lipL: .015, lipH: 0,
  stache: { w: .38, th: .042, curl: .14, droop: .03, color: '#120c0c' }, goatee: { w: .055, len: .16, color: '#120c0c' }
});

PRESETS.chili_bandit = derive('cute_round', { ...VEG, ...VEG_EYES,
  id: 'chili_bandit', label: 'Pimenta bandida', family: 'Vegetais', sub: 'Pimenta afinando para baixo, olhos arregalados, sorriso enorme com língua',
  skin: '#d2301b', blush: '#a8180e', lip: '#8a1a10', lipLine: '#300604', brow: '#140a08', liner: '#0e0606', lidShadow: '#a01a10',
  iris: ['#ffcf6a', '#d07a1e', '#4a1a06'], sss: [.5, .1, .06], rough: .35, clearcoat: .9, clearcoatRough: .12, skinGloss: .8, sheen: .05,
  cran: [.3, -.04, .6, .9, .6, .6, 2], occ: null, loft: { y: [-.95] },
  lathe: { cz: -.04, zs: .9, y: [-1.9, -1.35, -1.05, -.7, -.3, .1, .5, .85, 1.0], r: [.34, .35, .42, .54, .61, .63, .6, .53, .48], top: 1.02, rc: .3, dip: .05, dipR: .2 },
  neck: [.34, -1.1, -.04, -1.75, -.04, .2], scm: null,
  stem: { len: .42, r: .055, bend: .6, curl: 2.8, color: '#5a8a26', calyx: 6, calyxLen: .26 },
  eyeX: .24, eyeY: .22, Re: .21, sink: .13, domeK: .2, bagK: 0, lidShade: .1, openW: deg(62), openU: deg(36), openL: deg(-32), peakU: -.05, peakL: .05, tilt: deg(-6), irisAng: deg(25), lidFold: .008, eyeShadow: .35,
  browGap: .2, browTh: .055, browArch: .06, browPeak: .35, browSlope: .07, browLen: 1.0,
  mouthY: -.32, mouthW: .38, smile: 2.6, open: .2, teeth: { h: .075, w: .065 }, tongue: { color: '#e66a78' },
  lipU: .012, lipL: .02, lipH: .01, mouthIn: '#3e0a0c', cheekH: .05
});

PRESETS.robot_ball = {
  id: 'robot_ball', label: 'Robô bolinha', family: 'Robôs', sub: 'Casco com tela, rosto em luz, orelhas com anel brilhante', kind: 'robot',
  shell: '#ece6da', accent: '#f08a24', glow: '#5fe3ff', blushColor: '#ff8a55', expression: 'happy'
};

// Reino da Lua: modelos prontos derivados do catálogo, sem esticar o rosto durante a personalização.
PRESETS.nana_explorer = derive('feminine_bold', {
  id: 'nana_explorer', label: 'Nana exploradora', family: 'Humanos', sub: 'Exploradora lunar, cachos escuros e visor azul',
  skin: '#946044', blush: '#ac6251', lip: '#8b4144', brow: '#20121b', iris: ['#b88345', '#69401e', '#261309']
});
PRESETS.moon_guardian = derive('feminine_soft', {
  id: 'moon_guardian', label: 'Guardiã da Lua', family: 'Humanos', sub: 'Vestido azul e preto, manto e coroa lunar',
  skin: '#dca582', iris: ['#a97843', '#68401e', '#2c170b']
});
PRESETS.nico_inventor = derive('cute_round', {
  id: 'nico_inventor', label: 'Nico inventor', family: 'Humanos', sub: 'Jovem engenheiro, jardineira, óculos e mochila',
  skin: '#dca582', lip: '#ad665a', blushK: .4, lashN: 0, flick: 0, iris: ['#bf8a45', '#78481f', '#30190b']
});
PRESETS.ruby_sorceress = derive('feminine_bold', {
  id: 'ruby_sorceress', label: 'Feiticeira rubi', family: 'Humanos', sub: 'Vestido escuro, manto rubi e joias lunares',
  skin: '#cc9373', lip: '#831d35', iris: ['#c17a3b', '#783319', '#30120b']
});
PRESETS.paysandu_wolf = {id:'paysandu_wolf',label:'Paysandu',family:'Criaturas',kind:'companion',species:'wolf',skin:'#333b55',sub:'Lobo da Lua, focinho claro, lenço azul e medalhão'};
PRESETS.ruby_raven = {id:'ruby_raven',label:'Corvo rubi',family:'Criaturas',kind:'companion',species:'raven',skin:'#262333',sub:'Corvo cartoon, máscara clara, lenço rubi e joia lunar'};

// Sete identidades iniciais para refinamento posterior, derivadas de modelos existentes.
for(const c of FOREST_CHARACTERS)PRESETS[c.id]=derive(c.base,{id:c.id,label:c.label,family:'Humanos',sub:c.label+' · primeira versão',skin:c.skin,iris:['#a5ac5d','#617139','#29341b']});

// Padeiro e vigilante compartilham exatamente o mesmo rosto; muda apenas o visual.
for(const c of FRONTIER_CHARACTERS)PRESETS[c.id]=derive(c.base,{id:c.id,label:c.label,family:c.base==='cactus_cowboy'?'Vegetais':'Humanos',sub:c.label+' · primeira versão'});
for(const id of FRONTIER_COMPANIONS)PRESETS[id]={id,label:id==='desert_fennec'?'Feneco do deserto':'Cowboy no feneco',family:'Criaturas',kind:'companion',species:'fennec',mounted:id==='cowboy_on_fennec',skin:'#c98a49',sub:id==='desert_fennec'?'Feneco independente com sela removível':'Feneco e cowboy combinados; também disponíveis separados'};

// Direção de arte dos novos heróis: formas próprias, sem mudar as treze bases anteriores.
// O rig lê os mesmos parâmetros e mantém seus canais, pesos e expressões.
const heroFemale={Re:.276,eyeX:.35,eyeY:.015,openU:deg(29),openL:deg(-27),openW:deg(63),irisAng:deg(35),sink:.205,
  cheekH:.053,chinH:.016,noseH:.069,noseW:.78,tipH:.057,tipR:.052,alaeH:.018,alaeX:.052,
  browTh:.043,browGap:.19,browArch:.048,crease:.012,eyeShadow:.3,lowerRoll:.004,fold:.23,skinGloss:.1,bagK:.12};
const heroMale={Re:.239,eyeX:.356,openU:deg(18),openL:deg(-20),openW:deg(63),irisAng:deg(31),sink:.19,
  browTh:.057,browGap:.165,browArch:.026,browRidge:.045,noseH:.093,noseW:.94,tipH:.058,tipR:.057,
  cheekH:.018,chinH:.041,mouthW:.238,lipU:.028,lipL:.043,lipH:.034,fold:.4,bagK:.16,skinGloss:.09};
const sculpt=(id,o)=>{const b=PRESETS[id];PRESETS[id]={...b,...o,cran:(o.cran||b.cran).slice(),loft:{...b.loft,...o.loft,y:(o.loft?.y||b.loft.y).slice(),a:(o.loft?.a||b.loft.a).slice(),zf:(o.loft?.zf||b.loft.zf).slice(),zb:(o.loft?.zb||b.loft.zb).slice()}}};
sculpt('forest_archer_f',{...heroFemale,heroFreckles:true,tilt:deg(6),smile:.9,smirk:.35,blushK:.83,lip:'#ac5b4d',brow:'#6a4627',
  cran:[.20,-.08,.82,.80,.86,.84,2.3],loft:{a:[.10,.19,.34,.49,.62,.73,.78,.79,.76,.63,.44],n:2.15,cb:.13,k:.17}});
sculpt('forest_guard_f',{...heroFemale,Re:.253,openU:deg(23),openL:deg(-23),tilt:deg(7),smile:.28,smirk:.16,browSlope:-.01,browArch:.025,brow:'#76512c',
  loft:{a:[.13,.25,.40,.56,.66,.735,.77,.775,.74,.6,.42],n:2.35,cb:.095}});
sculpt('forest_archer_m',{...heroMale,Re:.246,tilt:deg(3),smile:.42,smirk:.25,brow:'#291c14',fixedBeardColor:true,
  beardVol:{thick:.06,len:.25,color:'#2b2018',stache:true},beard:.18,
  loft:{a:[.29,.41,.55,.66,.70,.73,.77,.78,.65,.45],n:2.8,cb:.08},iris:['#b7a34b','#6c602a','#2d2812']});
sculpt('forest_artificer',{...heroMale,tilt:deg(6),openU:deg(15),smirk:.75,smile:.16,browSlope:-.026,browArch:.043,brow:'#271b14',fixedBeardColor:true,
  stache:{w:.25,th:.025,curl:.05,droop:0,color:'#251d17'},goatee:{w:.085,len:.19,color:'#251d17'},
  loft:{a:[.27,.40,.53,.65,.69,.71,.75,.77,.63,.44],n:2.75},iris:['#a6ac4f','#57612c','#1c260f']});
sculpt('forest_guard_m',{...heroMale,Re:.248,openU:deg(21),browSlope:-.009,smile:.2,beard:0,brow:'#6a4626',
  loft:{a:[.24,.36,.49,.60,.67,.72,.76,.77,.63,.44],n:2.55,cb:.08}});
sculpt('forest_guard_veteran',{...heroMale,Re:.224,openU:deg(15),tilt:deg(2),browTh:.063,browRidge:.075,browArch:.014,eyeShadow:.5,smile:.1,
  brow:'#c7a268',beardVol:{thick:.075,len:.40,color:'#c7a268',stache:true},beard:.14,
  loft:{a:[.31,.43,.57,.68,.72,.75,.77,.78,.64,.44],n:2.8},iris:['#9eaa69','#5e6740','#28301b']});
sculpt('forest_princess',{...heroFemale,Re:.29,openU:deg(30),openL:deg(-30),irisAng:deg(36),tilt:deg(3),smile:1.05,mouthW:.212,mouthY:-.69,
  heroFreckles:true,blushK:.82,lip:'#b56b65',brow:'#8a6338',lashN:17,lashLen:.082,
  cran:[.20,-.08,.83,.80,.87,.84,2.2],loft:{a:[.11,.20,.36,.51,.65,.75,.79,.79,.75,.62,.44],n:2.1,k:.19}});
sculpt('nana_explorer',{...heroFemale,Re:.278,tilt:deg(5),smile:.8,smirk:.38,heroFreckles:true,noseW:.9,tipR:.061,
  brow:'#21141c',lip:'#994d51',cheekH:.05,cran:[.20,-.08,.82,.80,.86,.84,2.3],iris:['#bc8c59','#714a2b','#291a10']});
sculpt('moon_guardian',{...heroFemale,Re:.286,tilt:deg(4),smile:.93,mouthW:.215,lip:'#b76668',blushK:.8,
  cran:[.20,-.08,.82,.80,.86,.84,2.3],loft:{a:[.10,.19,.34,.49,.63,.73,.78,.79,.76,.63,.44],n:2.15,k:.18}});
sculpt('ruby_sorceress',{...heroFemale,Re:.269,openU:deg(23),openL:deg(-24),tilt:deg(9),browArch:.068,browSlope:.018,
  smile:.52,smirk:.72,lip:'#8c263d',lashLen:.085,heroFreckles:false,cran:[.20,-.08,.81,.80,.85,.84,2.4]});
sculpt('nico_inventor',{Re:.302,eyeX:.38,openU:deg(32),openL:deg(-31),irisAng:deg(37),noseH:.035,tipH:.055,tipR:.053,
  browTh:.035,browArch:.036,browGap:.25,smile:.85,mouthW:.19,cheekH:.06,heroFreckles:true,
  cran:[.17,-.08,.87,.84,.89,.87,2.25],iris:['#c79a5d','#76522d','#2f1f12']});
for(const id of ['bread_baker','bread_vigilante'])sculpt(id,{...heroMale,Re:.259,openU:deg(23),openL:deg(-24),tilt:deg(1),smile:.48,smirk:.14,
  skin:'#cf9b78',lip:'#a16b5a',brow:'#35241a',noseW:.87,cheekH:.028,heroFreckles:true,
  loft:{a:[.22,.33,.46,.58,.66,.71,.75,.77,.63,.44],n:2.4,cb:.09},iris:['#af8155','#684224','#29180d']});
PRESETS.flame_guardian=derive('masculine_soft',{...heroMale,id:'flame_guardian',label:'Guardião da chama',family:'Humanos',sub:'Herói da chama, casaca preta, manto rubi e armadura dourada',
  skin:'#bb8866',lip:'#91574b',brow:'#302017',iris:['#be9354','#70502b','#2b1c0f'],tilt:deg(4),smile:.10,smirk:.34,browSlope:-.017,browTh:.059,
  loft:{...PRESETS.masculine_soft.loft,a:[.28,.40,.54,.65,.70,.73,.77,.78,.64,.45],n:2.7,cb:.08}});

refineFaceIdentities(PRESETS);

export const FAMILY_ORDER = ['Humanos', 'Criaturas', 'Vegetais', 'Robôs'];
export const PRESET_ORDER = ['feminine_soft', 'masculine_soft', 'old_king', 'cute_round', 'feminine_bold', 'alchemist_villain', 'dwarf_bard', 'sad_clown',
  'nana_explorer', 'moon_guardian', 'nico_inventor', 'ruby_sorceress', 'flame_guardian', 'paysandu_wolf', 'ruby_raven',
  'orc_warrior', 'cactus_cowboy', 'pepper_king', 'chili_bandit', 'robot_ball', ...FOREST_CHARACTERS.map(c=>c.id),...FRONTIER_CHARACTERS.map(c=>c.id),...FRONTIER_COMPANIONS];

export const DEFAULT_ADJ = { headWidth: 1, cheeks: 1, jaw: 1, eyes: 1, eyeGap: 1, nose: 1, mouth: 1 };

// Aplica os ajustes finos (sliders) por cima do preset escolhido.
export function resolve(presetId, adj = DEFAULT_ADJ) {
  const b = PRESETS[presetId], P = { ...b };
  if (b.kind === 'robot' || b.kind === 'companion') return P; // robô tem gerador próprio (sem sliders de anatomia)
  const { headWidth: W, cheeks: C, jaw: J, eyes: E, eyeGap: G, nose: N, mouth: M } = { ...DEFAULT_ADJ, ...adj };
  P.cran = b.cran.slice(); P.cran[2] *= W;
  // casca facial: largura geral (crânio), bochechas (terço médio) e mandíbula (terço inferior) escalam a curva a(y)
  const L = b.loft; P.loft = L.a ? { ...L, a: L.a.map((v, i) => { const y = L.y[i], low = Math.min(1, Math.max(0, (-.42 - y) / .3)), mid = Math.exp(-(((y + .22) / .16) ** 2));
    return v * W * (1 + (J - 1) * 1.1 * low) * (1 + (C - 1) * .06 * mid) }) } : { ...L };
  if (b.lathe) { const T = b.lathe; P.lathe = { ...T, r: T.r.map((v, i) => v * W * (1 + (J - 1) * .8 * Math.min(1, Math.max(0, (-.4 - T.y[i]) / .4)))) } }
  P.neck = b.neck.slice(); P.scm = b.scm ? b.scm.slice() : null;
  if(b.mandible)P.mandible={...b.mandible};
  P.cheekH = b.cheekH * C;
  P.Re = b.Re * E; P.eyeX = b.eyeX * G * (1 + (W - 1) * .5);
  // olhos + sobrancelha nunca passam da silhueta do crânio (combinações extremas dos sliders)
  const lim = .92 * P.cran[2], outer = P.eyeX + 1.3 * P.Re;
  if (outer > lim) { const k = lim / outer; P.eyeX *= k; P.Re *= k }
  P.noseH = b.noseH * N; P.tipH = b.tipH * N; P.alaeH = b.alaeH * N; P.tipR = b.tipR * (1 + (N - 1) * .6); P.noseW = b.noseW * (1 + (N - 1) * .5);
  P.mouthW = b.mouthW * M; P.smile = b.smile * M;
  return P;
}
