// Presets de rosto da Head V2.
// Todas as medidas estão no espaço da cabeça: y=0 ≈ linha dos olhos, +z = frente, unidade ≈ 1 = meia-largura do crânio.
const deg = d => d * Math.PI / 180;

export const PRESET_ORDER = ['feminine_soft', 'masculine_soft', 'cute_round'];

export const PRESETS = {
  feminine_soft: {
    id: 'feminine_soft', label: 'Feminino suave',
    skin: '#dca07a', blush: '#e8847c', lip: '#c6616a', lipLine: '#7a3138', brow: '#2a1b17',
    iris: ['#e8c27a', '#a8662c', '#4a2812'],
    // silhueta
    top: .96, bottom: -.9, templeY: .24,
    w: .86, cheekW: .82, jawQ: 1.7, jawN: 2.05,
    // olhos
    eyeX: .345, eyeY: -.005, Re: .218, openW: deg(62), openU: deg(26), openL: deg(-33), irisAng: deg(35),
    tilt: deg(6), sink: .175, socket: .045, lash: .0145, flick: .055,
    // sobrancelhas
    browGap: .265, browTh: .021, browArch: .05, browPeak: .6, browSlope: .02, browLen: 1.0,
    // nariz
    noseTipY: -.18, noseH: .07, noseW: 1.0, tipH: .075, alaeH: .036,
    // boca
    mouthY: -.47, mouthW: .29, lipU: .062, lipL: .062, lipH: .07, smile: .7,
    // volumes
    cheekH: .04, chinH: .04, muzzle: .035, browRidge: .018,
    // extras
    neckR: .25, earS: .85, jawLift: .24
  },
  masculine_soft: {
    id: 'masculine_soft', label: 'Masculino suave',
    skin: '#c98a64', blush: '#d17a6c', lip: '#b05a58', lipLine: '#6a2e30', brow: '#1f1512',
    iris: ['#c79a58', '#6c4122', '#2b170c'],
    top: 1.03, bottom: -1.02, templeY: .28,
    w: .88, cheekW: .83, jawQ: 2.15, jawN: 2.6,
    eyeX: .35, eyeY: .03, Re: .2, openW: deg(60), openU: deg(21), openL: deg(-29), irisAng: deg(32),
    tilt: deg(1.5), sink: .155, socket: .055, lash: .009, flick: 0,
    browGap: .225, browTh: .03, browArch: .022, browPeak: .5, browSlope: -.004, browLen: 1.08,
    noseTipY: -.2, noseH: .095, noseW: 1.15, tipH: .072, alaeH: .04,
    mouthY: -.52, mouthW: .27, lipU: .05, lipL: .064, lipH: .068, smile: .3,
    cheekH: .015, chinH: .075, muzzle: .03, browRidge: .045,
    neckR: .29, earS: 1.0, jawLift: .16
  },
  cute_round: {
    id: 'cute_round', label: 'Cute arredondado',
    skin: '#eeb190', blush: '#f08a86', lip: '#d8737a', lipLine: '#8a3d45', brow: '#35231d',
    iris: ['#f0cf86', '#b06f33', '#4d2a13'],
    top: .98, bottom: -.88, templeY: .24,
    w: .92, cheekW: .9, jawQ: 2.05, jawN: 2.0,
    eyeX: .385, eyeY: -.06, Re: .245, openW: deg(60), openU: deg(33), openL: deg(-36), irisAng: deg(41),
    tilt: deg(-3), sink: .195, socket: .05, lash: .012, flick: .012,
    browGap: .3, browTh: .022, browArch: .035, browPeak: .55, browSlope: .0, browLen: .85,
    noseTipY: -.24, noseH: .05, noseW: .9, tipH: .072, alaeH: .03,
    mouthY: -.5, mouthW: .22, lipU: .05, lipL: .06, lipH: .06, smile: .9,
    cheekH: .075, chinH: .025, muzzle: .045, browRidge: .008,
    neckR: .28, earS: .8, jawLift: .22
  }
};

export const DEFAULT_ADJ = { headWidth: 1, cheeks: 1, jaw: 1, eyes: 1, eyeGap: 1, nose: 1, mouth: 1 };

// Aplica os ajustes finos (sliders) por cima do preset escolhido.
export function resolve(presetId, adj = DEFAULT_ADJ) {
  const b = PRESETS[presetId], P = { ...b };
  const { headWidth: W, cheeks: C, jaw: J, eyes: E, eyeGap: G, nose: N, mouth: M } = { ...DEFAULT_ADJ, ...adj };
  P.w = b.w * W; P.cheekW = b.cheekW * W * (1 + (C - 1) * .2);
  P.jawQ = b.jawQ * (1 + (J - 1) * 1.5);
  P.cheekH = b.cheekH * C;
  P.Re = b.Re * E; P.eyeX = b.eyeX * G * (1 + (W - 1) * .5);
  P.noseH = b.noseH * N; P.tipH = b.tipH * N; P.alaeH = b.alaeH * N; P.noseW = b.noseW * (1 + (N - 1) * .6);
  P.mouthW = b.mouthW * M; P.smile = b.smile * M;
  return P;
}
