// Presets de rosto da Head V2 (beauty pass).
// Espaço da cabeça: y=0 ≈ linha dos olhos, +z = frente, ~0.85 = meia-largura do crânio.
// A forma base é um campo de distância (SDF) feito de volumes anatômicos fundidos suavemente:
//   cran  = crânio            [y, z, rx, ry, rz]
//   face  = massa do terço médio [y, z, rx, ry, rz]
//   cheekB= maçãs/zigomático   [x, y, z, rx, ry, rz, blend]
//   jaw   = mandíbula (cone arredondado do queixo ao ângulo) [queixoY, queixoZ, queixoR, ânguloX, ânguloY, ânguloZ, ânguloR, blend]
//   chin  = queixo             [y, z, rx, ry, rz, blend]
//   neck  = pescoço            [raio, topoY, topoZ, baseY, baseZ, blend]
// O relevo fino (olhos, nariz, boca, prega da pálpebra…) é um campo de deslocamento em src/head.js.
const deg = d => d * Math.PI / 180;

export const PRESET_ORDER = ['feminine_soft', 'masculine_soft', 'cute_round', 'feminine_bold'];

export const PRESETS = {
  feminine_soft: {
    id: 'feminine_soft', label: 'Feminino suave',
    skin: '#cc9373', blush: '#d66f72', lip: '#ac3e4d', lipLine: '#4e1520', brow: '#2a1913', liner: '#160c0b', lidShadow: '#9a5a4c',
    iris: ['#f2bd62', '#ad6522', '#4c2408'],
    cran: [.2, -.08, .8, .76, .84, .84, 2.5], face: [-.36, .15, .55, .5, .6, 2.4], cheekB: [.405, -.17, .36, .31, .26, .27, .22],
    jaw: [-.84, .42, .13, .42, -.52, -.17, .11, .24], chin: [-.82, .43, .15, .09, .11, .14], neck: [.26, -.5, -.2, -1.55, -.3, .12], scm: [.3, -.38, -.3, .07, -1.4, -.08, .075, .14],
    // olhos
    eyeX: .41, eyeY: 0, Re: .25, openW: deg(64), openU: deg(24), openL: deg(-23), peakU: -.12, peakL: .12, irisAng: deg(31.5),
    tilt: deg(5), sink: .2, socket: .035, crease: .016, creaseGap: .05, lidShade: .55,
    lash: .019, flick: .07, lashN: 15, lashLen: .075, lowerLash: .5,
    // sobrancelhas
    browGap: .228, browTh: .029, browArch: .05, browPeak: .64, browSlope: .012, browLen: 1.06,
    // nariz
    noseTipY: -.31, noseH: .066, noseW: .8, tipH: .05, tipR: .047, alaeH: .013, alaeX: .07, scoop: 1.5,
    // boca
    mouthY: -.54, mouthW: .225, lipU: .058, lipL: .074, lipH: .062, smile: .75, bow: .38,
    // volumes
    cheekH: .045, chinH: .012, muzzle: .03, browRidge: .015, fold: .5,
    earS: .88
  },
  masculine_soft: {
    id: 'masculine_soft', label: 'Masculino suave',
    skin: '#a87258', blush: '#b0605a', lip: '#93554c', lipLine: '#3e1914', brow: '#1d120e', liner: '#24160f', lidShadow: '#7c4a3a',
    iris: ['#c99a56', '#6e4020', '#26150a'],
    cran: [.2, -.1, .82, .78, .86, .86, 2.6], face: [-.46, .08, .62, .58, .66, 2.8], cheekB: [.43, -.12, .34, .28, .22, .26, .14],
    jaw: [-.98, .4, .15, .55, -.63, -.14, .14, .26, .12], chin: [-.95, .42, .15, .09, .11, .2], neck: [.31, -.55, -.2, -1.55, -.3, .12], scm: [.36, -.42, -.3, .09, -1.4, -.06, .095, .14],
    eyeX: .375, eyeY: .02, Re: .215, openW: deg(60), openU: deg(16), openL: deg(-18), peakU: -.02, peakL: .18, irisAng: deg(31),
    tilt: deg(-1), sink: .19, socket: .05, crease: .008, creaseGap: .035, lidShade: .3,
    lash: .011, flick: 0, lashN: 0, lashLen: .03, lowerLash: .15,
    browGap: .158, browTh: .042, browArch: .014, browPeak: .5, browSlope: -.012, browLen: 1.1,
    noseTipY: -.37, noseH: .1, noseW: 1.08, tipH: .05, tipR: .062, alaeH: .022, alaeX: .085, scoop: 1.0,
    mouthY: -.64, mouthW: .235, lipU: .036, lipL: .062, lipH: .048, smile: .18, bow: .2,
    cheekH: .008, chinH: .03, muzzle: .028, browRidge: .05, fold: .7,
    earS: 1.0
  },
  cute_round: {
    id: 'cute_round', label: 'Cute arredondado',
    skin: '#e6ad90', blush: '#ef7f82', lip: '#d4677a', lipLine: '#7a2a3a', brow: '#3a241b', liner: '#1e1210', lidShadow: '#b06c62',
    iris: ['#f6d58c', '#b8763a', '#4a2813'],
    cran: [.15, -.08, .84, .78, .86, .84, 2.3], face: [-.32, .15, .62, .48, .6, 2.2], cheekB: [.4, -.28, .36, .33, .3, .3, .22],
    jaw: [-.76, .44, .15, .45, -.45, -.22, .15, .3], chin: [-.74, .46, .15, .1, .11, .16], neck: [.25, -.5, -.2, -1.55, -.3, .12], scm: [.3, -.36, -.28, .07, -1.4, -.08, .07, .14],
    eyeX: .405, eyeY: -.07, Re: .262, openW: deg(60), openU: deg(30), openL: deg(-30), peakU: -.08, peakL: .05, irisAng: deg(35),
    tilt: deg(-2), sink: .215, socket: .03, crease: .01, creaseGap: .05, lidShade: .45,
    lash: .016, flick: .025, lashN: 11, lashLen: .06, lowerLash: .3,
    browGap: .27, browTh: .025, browArch: .035, browPeak: .52, browSlope: 0, browLen: .9,
    noseTipY: -.3, noseH: .03, noseW: .88, tipH: .05, tipR: .058, alaeH: .02, alaeX: .062, scoop: 1.8,
    mouthY: -.5, mouthW: .17, lipU: .042, lipL: .056, lipH: .05, smile: 1.0, bow: .32,
    cheekH: .055, chinH: .01, muzzle: .035, browRidge: .005, fold: .3,
    earS: .82
  },
  feminine_bold: {
    id: 'feminine_bold', label: 'Feminino intenso',
    skin: '#bb7d5e', blush: '#c25e5c', lip: '#7c1d2b', lipLine: '#360a12', brow: '#170d0a', liner: '#0c0606', lidShadow: '#6e3c3a',
    iris: ['#f2a24e', '#b4531c', '#481a08'],
    cran: [.2, -.08, .8, .76, .84, .84, 2.5], face: [-.38, .15, .54, .52, .6, 2.4], cheekB: [.42, -.12, .34, .28, .22, .26, .16],
    jaw: [-.88, .43, .11, .43, -.54, -.17, .11, .2], chin: [-.86, .44, .13, .09, .11, .12], neck: [.26, -.5, -.2, -1.55, -.3, .12], scm: [.3, -.38, -.3, .07, -1.4, -.08, .075, .14],
    eyeX: .4, eyeY: 0, Re: .235, openW: deg(66), openU: deg(18), openL: deg(-19), peakU: .12, peakL: .22, irisAng: deg(30),
    tilt: deg(10), sink: .2, socket: .04, crease: .02, creaseGap: .045, lidShade: .9,
    lash: .022, flick: .1, lashN: 14, lashLen: .07, lowerLash: .7,
    browGap: .2, browTh: .03, browArch: .075, browPeak: .7, browSlope: .03, browLen: 1.08,
    noseTipY: -.33, noseH: .07, noseW: .78, tipH: .048, tipR: .044, alaeH: .012, alaeX: .066, scoop: 1.3,
    mouthY: -.57, mouthW: .23, lipU: .06, lipL: .072, lipH: .064, smile: .45, bow: .3,
    cheekH: .025, chinH: .015, muzzle: .03, browRidge: .02, fold: .4,
    earS: .86
  }
};

export const DEFAULT_ADJ = { headWidth: 1, cheeks: 1, jaw: 1, eyes: 1, eyeGap: 1, nose: 1, mouth: 1 };

// Aplica os ajustes finos (sliders) por cima do preset escolhido.
export function resolve(presetId, adj = DEFAULT_ADJ) {
  const b = PRESETS[presetId], P = { ...b };
  const { headWidth: W, cheeks: C, jaw: J, eyes: E, eyeGap: G, nose: N, mouth: M } = { ...DEFAULT_ADJ, ...adj };
  P.cran = b.cran.slice(); P.cran[2] *= W;
  P.face = b.face.slice(); P.face[2] *= W;
  P.cheekB = b.cheekB.slice(); P.cheekB[0] *= W; P.cheekB[3] *= 1 + (C - 1) * .25; P.cheekB[5] *= 1 + (C - 1) * .25;
  P.jaw = b.jaw.slice(); P.jaw[3] *= Math.sqrt(W) * (1 + (J - 1) * .8); P.jaw[6] *= 1 + (J - 1) * .6; P.jaw[2] *= 1 + (J - 1) * .8;
  P.chin = b.chin.slice(); P.chin[2] *= 1 + (J - 1) * 1.5;
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
