// Presets de rosto da Head V2.
// Espaço da cabeça: y=0 ≈ linha dos olhos, +z = frente, ~0.8 = meia-largura do crânio.
// Forma base (campo de distância, união suave):
//   cran = crânio [y, z, rx, ry, rzFrente, rzTrás, expoente da frente]
//   occ  = occipital / nuca [y, z, rx, ry, rz, blend]
//   loft = casca facial: curvas por altura y — a (meia-largura, contorno de frente), zf (frente, perfil),
//          zb (fundo: ramo e linha de baixo da mandíbula); n = quadratura da frente, cb = arredondamento do queixo
//   neck = pescoço [raio, topoY, topoZ, baseY, baseZ, blend]; scm = músculo do pescoço (esternocleidomastoideo)
// Relevo fino (olhos, nariz, boca, prega da pálpebra, zigomático…) e pele: src/head.js.
const deg = d => d * Math.PI / 180;

export const PRESET_ORDER = ['feminine_soft', 'masculine_soft', 'cute_round', 'feminine_bold'];

export const PRESETS = {
  feminine_soft: {
    id: 'feminine_soft', label: 'Feminino suave',
    skin: '#cc9373', blush: '#d66f72', lip: '#ac3e4d', lipLine: '#4e1520', brow: '#2a1913', liner: '#160c0b', lidShadow: '#9a5a4c',
    iris: ['#f2bd62', '#ad6522', '#4c2408'],
    cran: [.18, -.08, .79, .78, .84, .84, 2.4], occ: [.02, -.5, .58, .55, .42, .25],
    loft: { y: [-1.1, -1.02, -.92, -.8, -.66, -.5, -.32, -.15, 0, .15, .32], a: [.11, .22, .385, .54, .65, .725, .76, .765, .74, .6, .42],
      zf: [.62, .68, .71, .72, .735, .765, .78, .76, .72, .6, .42], zb: [.36, .26, .1, -.04, -.15, -.22, -.26, -.28, -.3, -.3, -.3], n: 2.2, cb: .12, k: .16 },
    neck: [.26, -.58, -.2, -1.6, -.3, .12], scm: [.3, -.38, -.3, .07, -1.4, -.08, .075, .14],
    eyeX: .355, eyeY: 0, Re: .232, openW: deg(64), openU: deg(24), openL: deg(-23), peakU: -.12, peakL: .12, irisAng: deg(31.5),
    tilt: deg(5), sink: .2, socket: .035, crease: .016, creaseGap: .05, lidShade: .55, orbit: .022, lidFold: .009, lowerRoll: .006, eyeShadow: .5,
    lash: .025, flick: .07, lashN: 15, lashLen: .075, lowerLash: .5,
    // sobrancelhas
    browGap: .172, browTh: .042, browArch: .036, browPeak: .66, browSlope: .006, browLen: 1.1,
    // nariz
    noseTipY: -.4, noseH: .08, noseW: .92, tipH: .06, tipR: .05, alaeH: .019, alaeX: .072, scoop: 1.5,
    // boca
    mouthY: -.725, mouthW: .215, lipU: .05, lipL: .07, lipH: .05, smile: .8, bow: .5,
    // volumes
    cheekH: .05, chinH: .03, muzzle: .012, browRidge: .015, fold: .5, zyg: .012, hollow: .005, temple: .01,
    blushK: 0.75, earS: .88
  },
  masculine_soft: {
    id: 'masculine_soft', label: 'Masculino suave',
    skin: '#a87258', blush: '#b0605a', lip: '#93554c', lipLine: '#3e1914', brow: '#1d120e', liner: '#24160f', lidShadow: '#7c4a3a',
    iris: ['#b8874a', '#5a3218', '#1f1109'],
    cran: [.18, -.1, .82, .8, .86, .86, 2.6], occ: [0, -.52, .6, .55, .44, .25],
    loft: { y: [-1.17, -1.11, -1.0, -.86, -.7, -.48, -.25, 0, .15, .32], a: [.27, .37, .5, .6, .66, .7, .74, .76, .62, .44],
      zf: [.58, .66, .69, .71, .74, .78, .78, .74, .62, .44], zb: [.38, .3, .1, -.12, -.24, -.3, -.3, -.3, -.3, -.3], n: 2.6, cb: .06, k: .12, blur: .04 },
    neck: [.31, -.62, -.2, -1.55, -.3, .12], scm: [.36, -.42, -.3, .09, -1.4, -.06, .095, .14],
    eyeX: .362, eyeY: .02, Re: .21, openW: deg(60), openU: deg(15), openL: deg(-17), peakU: -.02, peakL: .18, irisAng: deg(29.5),
    tilt: deg(-1), sink: .19, socket: .05, crease: .008, creaseGap: .035, lidShade: .3, orbit: .045, lidFold: .006, lowerRoll: .005, eyeShadow: .55,
    lash: .011, flick: 0, lashN: 0, lashLen: .03, lowerLash: .15,
    browGap: .158, browTh: .042, browArch: .014, browPeak: .5, browSlope: -.012, browLen: 1.1,
    noseTipY: -.44, noseH: .1, noseW: 1.08, tipH: .05, tipR: .062, alaeH: .022, alaeX: .085, scoop: 1.0,
    mouthY: -.78, mouthW: .235, lipU: .036, lipL: .062, lipH: .048, smile: .18, bow: .2,
    cheekH: .008, chinH: .03, muzzle: .012, browRidge: .05, fold: .7, zyg: .03, hollow: .02, temple: .022, beard: .32,
    blushK: 0.35, earS: 1.0
  },
  cute_round: {
    id: 'cute_round', label: 'Cute arredondado',
    skin: '#e6ad90', blush: '#ef7f82', lip: '#d4677a', lipLine: '#7a2a3a', brow: '#3a241b', liner: '#1e1210', lidShadow: '#b06c62',
    iris: ['#f6d58c', '#b8763a', '#4a2813'],
    cran: [.14, -.08, .84, .8, .86, .84, 2.3], occ: [0, -.48, .6, .55, .42, .25],
    loft: { y: [-.9, -.82, -.72, -.6, -.46, -.3, -.12, .05, .2, .32], a: [.2, .36, .54, .66, .74, .78, .79, .74, .62, .45],
      zf: [.58, .66, .71, .74, .76, .77, .75, .7, .6, .45], zb: [.3, .12, -.05, -.18, -.25, -.28, -.3, -.3, -.3, -.3], n: 2.15, cb: .1, k: .18 },
    neck: [.25, -.5, -.2, -1.55, -.3, .12], scm: [.3, -.36, -.28, .07, -1.4, -.08, .07, .14],
    eyeX: .372, eyeY: -.07, Re: .262, openW: deg(60), openU: deg(30), openL: deg(-30), peakU: -.08, peakL: .05, irisAng: deg(35),
    tilt: deg(-2), sink: .215, socket: .03, crease: .01, creaseGap: .05, lidShade: .45, orbit: .012, lidFold: .008, lowerRoll: .007, eyeShadow: .42,
    lash: .016, flick: .025, lashN: 11, lashLen: .06, lowerLash: .3,
    browGap: .27, browTh: .025, browArch: .035, browPeak: .52, browSlope: 0, browLen: .9,
    noseTipY: -.33, noseH: .03, noseW: .88, tipH: .05, tipR: .058, alaeH: .02, alaeX: .062, scoop: 1.8,
    mouthY: -.565, mouthW: .17, lipU: .042, lipL: .056, lipH: .05, smile: 1.0, bow: .32,
    cheekH: .055, chinH: .01, muzzle: .015, browRidge: .005, fold: .3, temple: .005,
    blushK: 0.8, earS: .82
  },
  feminine_bold: {
    id: 'feminine_bold', label: 'Feminino intenso',
    skin: '#bb7d5e', blush: '#c25e5c', lip: '#7c1d2b', lipLine: '#360a12', brow: '#170d0a', liner: '#0c0606', lidShadow: '#6e3c3a',
    iris: ['#f2a24e', '#b4531c', '#481a08'],
    cran: [.18, -.08, .79, .78, .84, .84, 2.4], occ: [.02, -.5, .58, .55, .42, .25],
    loft: { y: [-1.05, -.97, -.88, -.76, -.63, -.48, -.3, -.13, 0, .15, .32], a: [.11, .21, .37, .52, .63, .715, .765, .775, .74, .6, .42],
      zf: [.62, .68, .71, .72, .735, .765, .78, .76, .72, .6, .42], zb: [.37, .27, .11, -.03, -.14, -.21, -.26, -.28, -.3, -.3, -.3], n: 2.3, cb: .11, k: .14 },
    neck: [.26, -.58, -.2, -1.55, -.3, .12], scm: [.3, -.38, -.3, .07, -1.4, -.08, .075, .14],
    eyeX: .36, eyeY: 0, Re: .225, openW: deg(66), openU: deg(18), openL: deg(-19), peakU: .12, peakL: .22, irisAng: deg(30),
    tilt: deg(10), sink: .2, socket: .04, crease: .02, creaseGap: .045, lidShade: .9, orbit: .03, lidFold: .01, lowerRoll: .006, eyeShadow: .6,
    lash: .022, flick: .1, lashN: 14, lashLen: .07, lowerLash: .7,
    browGap: .18, browTh: .03, browArch: .075, browPeak: .7, browSlope: .03, browLen: 1.08,
    noseTipY: -.375, noseH: .085, noseW: .78, tipH: .048, tipR: .044, alaeH: .012, alaeX: .066, scoop: 1.3,
    mouthY: -.68, mouthW: .23, lipU: .06, lipL: .072, lipH: .055, smile: .45, bow: .3,
    cheekH: .025, chinH: .015, muzzle: .012, browRidge: .02, fold: .4, zyg: .026, hollow: .016, temple: .016,
    blushK: 0.62, earS: .86
  }
};

export const DEFAULT_ADJ = { headWidth: 1, cheeks: 1, jaw: 1, eyes: 1, eyeGap: 1, nose: 1, mouth: 1 };

// Aplica os ajustes finos (sliders) por cima do preset escolhido.
export function resolve(presetId, adj = DEFAULT_ADJ) {
  const b = PRESETS[presetId], P = { ...b };
  const { headWidth: W, cheeks: C, jaw: J, eyes: E, eyeGap: G, nose: N, mouth: M } = { ...DEFAULT_ADJ, ...adj };
  P.cran = b.cran.slice(); P.cran[2] *= W;
  // casca facial: largura geral (crânio), bochechas (terço médio) e mandíbula (terço inferior) escalam a curva a(y)
  const L = b.loft; P.loft = { ...L, a: L.a.map((v, i) => { const y = L.y[i], low = Math.min(1, Math.max(0, (-.42 - y) / .3)), mid = Math.exp(-(((y + .22) / .16) ** 2));
    return v * W * (1 + (J - 1) * 1.1 * low) * (1 + (C - 1) * .06 * mid) }) };
  P.neck = b.neck.slice(); if (b.scm) P.scm = b.scm.slice();
  P.cheekH = b.cheekH * C;
  P.Re = b.Re * E; P.eyeX = b.eyeX * G * (1 + (W - 1) * .5);
  // olhos + sobrancelha nunca passam da silhueta do crânio (combinações extremas dos sliders)
  const lim = .92 * P.cran[2], outer = P.eyeX + 1.3 * P.Re;
  if (outer > lim) { const k = lim / outer; P.eyeX *= k; P.Re *= k }
  P.noseH = b.noseH * N; P.tipH = b.tipH * N; P.alaeH = b.alaeH * N; P.tipR = b.tipR * (1 + (N - 1) * .6); P.noseW = b.noseW * (1 + (N - 1) * .5);
  P.mouthW = b.mouthW * M; P.smile = b.smile * M;
  return P;
}
