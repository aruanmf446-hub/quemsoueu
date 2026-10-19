// Rig facial da Head V2: esqueleto (ossos) + pesos de pele + poses de expressão + clipes de animação.
// Ossos (todos filhos de Bone_Head):
//   Bone_Jaw (mandíbula, gira para abrir a boca)       Bone_Eye_L/R (globo ocular: olhar)
//   Bone_LidUp_L/R, Bone_LidLo_L/R (pálpebras: giram em volta do centro do olho → piscar, apertar, arregalar)
//   Bone_Brow_L/R (sobrancelhas: subir, descer, inclinar)   Bone_MouthCorner_L/R (cantos da boca: sorriso / tristeza)
// Exporta no GLB como skin padrão (glTF), utilizável em Unity, Unreal, Godot e three.js.
import * as THREE from 'three';

const { clamp } = THREE.MathUtils;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const gau = (d, r) => Math.exp(-(d * d) / (r * r));

export const BONE_NAMES = ['Bone_Head', 'Bone_Jaw', 'Bone_Eye_L', 'Bone_Eye_R', 'Bone_LidUp_L', 'Bone_LidLo_L', 'Bone_LidUp_R', 'Bone_LidLo_R',
  'Bone_Brow_L', 'Bone_Brow_R', 'Bone_MouthCorner_L', 'Bone_MouthCorner_R'];
const B = Object.fromEntries(BONE_NAMES.map((n, i) => [n.replace('Bone_', ''), i]));

export const NEUTRAL = { lookX: 0, lookY: 0, blinkL: 0, blinkR: 0, wide: 0, squint: 0, jaw: 0, smile: 0, smileL: 0, smileR: 0, browRaise: 0, browAngry: 0 };

// Expressões prontas (somadas por cima da pose neutra)
export const EXPRESSIONS = {
  neutro: {},
  feliz: { smile: 1, squint: .35, browRaise: .25 },
  triste: { smile: -.85, browAngry: -.9, browRaise: .15, lookY: -.25, squint: .1 },
  bravo: { browAngry: 1, smile: -.35, squint: .55, browRaise: -.2 },
  surpreso: { browRaise: 1, wide: 1, jaw: .75, smile: -.1 },
  piscadela: { blinkR: 1, smileR: .9, smile: .3, browRaise: .1, squint: .2 },
  desconfiado: { browAngry: .35, squint: .7, lookX: .55, smileL: .5, browRaise: -.1 }
};

export function createRig(P, ctx) {
  const { eyes, MC, surfZ, frontRadius } = ctx;
  const bones = BONE_NAMES.map(n => { const b = new THREE.Bone(); b.name = n; return b });
  const head = bones[B.Head], headPos = new THREE.Vector3(0, -.6, -.1);
  head.position.copy(headPos);
  const place = (i, x, y, z, quat) => { const b = bones[i]; b.position.set(x, y, z).sub(headPos); if (quat) b.quaternion.copy(quat); head.add(b); b.userData.rest = { p: b.position.clone(), q: b.quaternion.clone() } };
  head.userData.rest = { p: head.position.clone(), q: head.quaternion.clone() };

  const ymC = MC.ym(MC.mw), chinY = P.jawChinY ?? (P.loft?.y?.[0] ?? -1) + .02;
  const yTMJ = (P.eyeY + P.noseTipY) / 2 - .12, zTMJ = P.lathe ? P.lathe.cz : -.14;
  place(B.Jaw, 0, yTMJ, zTMJ);
  const eyeInfo = {};
  for (const e of eyes) {
    const side = e.s < 0 ? 'L' : 'R', q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), e.s * P.tilt);
    place(B['Eye_' + side], e.ex, e.ey, e.zc);
    place(B['LidUp_' + side], e.ex, e.ey, e.zc, q);
    place(B['LidLo_' + side], e.ex, e.ey, e.zc, q);
    // ângulos de fechamento: a borda superior desce até encontrar a inferior (que sobe um pouco)
    eyeInfo[side] = { e, closeU: Math.atan2(e.hu + e.hl * .35, e.Rl), closeL: Math.atan2(e.hl * .55, e.Rl), hu: e.hu, hl: e.hl };
  }
  const browY = P.eyeY + P.browGap + P.browArch * .4, browX = P.eyeX + (P.Re || .2) * .15;
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    place(B['Brow_' + side], s * browX, browY, surfZ(s * browX, browY) - .12);
    const cx = s * MC.mw, cy = MC.ym(cx);
    place(B['MouthCorner_' + side], cx, cy, surfZ(cx, cy));
  }

  // ---------- pesos ----------
  const cornerFn = (u, peak) => { if (Math.abs(u) >= 1) return 0; const w = u < peak ? (u - peak) / (peak + 1) : (u - peak) / (1 - peak); return Math.pow(Math.cos(clamp(w, -1, 1) * Math.PI / 2), .8) };
  // modo: 'skin' (pele, com sobreposições), 'lidU' / 'lidL' (cílios e bordas), 'brow' (sobrancelha), 'generic' (bigode etc.)
  function weights(x, y, z, o = {}) {
    const W = new Array(BONE_NAMES.length).fill(0), ax = Math.abs(x), s = x < 0 ? -1 : 1, side = s < 0 ? 'L' : 'R';
    const front = sstep(-.45, -.15, z);
    if (o.mode === 'lidU' || o.mode === 'lidL') {
      const { e } = eyeInfo[side], [U] = e.local(x, y), uN = U / e.halfW;
      const w = Math.pow(cornerFn(clamp(uN, -.999, .999), o.mode === 'lidU' ? P.peakU : P.peakL), .6);
      W[B[(o.mode === 'lidU' ? 'LidUp_' : 'LidLo_') + side]] = w;
      return pack(W);
    }
    // mandíbula: abaixo da linha da boca; fora da boca a divisa sobe em direção à articulação (perto da orelha)
    if (o.jaw !== undefined) W[B.Jaw] = o.jaw;
    else {
      const yB = ax < MC.mw ? MC.ym(x) : ymC + (yTMJ - ymC) * sstep(MC.mw, .78, ax), bw = .006 + .07 * sstep(MC.mw * .85, MC.mw * 1.7, ax);
      W[B.Jaw] = sstep(yB + bw, yB - bw, y) * sstep(-.5, -.2, z) * sstep(chinY - .45, chinY - .1, y);
    }
    // cantos da boca
    for (const sd of [-1, 1]) { const cx = sd * MC.mw, cy = MC.ym(cx); W[B['MouthCorner_' + (sd < 0 ? 'L' : 'R')]] = .9 * gau(Math.hypot(x - cx, (y - cy) * 1.15), .09) * front }
    // sobrancelhas
    const bx = s * browX, wb = Math.exp(-(((x - bx) / .2) ** 4)) * gau(y - browY, o.mode === 'brow' ? 1 : .085) * front;
    W[B['Brow_' + side]] = o.mode === 'brow' ? Math.max(.85, wb) : wb;
    // pálpebras
    const ei = eyeInfo[side];
    if (ei && o.mode !== 'brow') {
      const { e } = ei, [U, V] = e.local(x, y), uN = U / e.halfW;
      if (Math.abs(uN) < 1.2 && V > -(e.hl + .14) && V < e.hu + (P.creaseGap || .05) + .12) {
        const uc = clamp(uN, -.999, .999), Hu = e.H(uc, true), Hl = e.H(uc, false);
        if (o.interior) { if (V > 0) W[B['LidUp_' + side]] = Math.pow(cornerFn(uc, P.peakU), .6); else W[B['LidLo_' + side]] = Math.pow(cornerFn(uc, P.peakL), .6) }
        else if (V >= 0) W[B['LidUp_' + side]] = Math.pow(cornerFn(uc, P.peakU), .6) * sstep(Hu + (P.creaseGap || .05) + .07, Hu + .008, V) * front;
        else W[B['LidLo_' + side]] = Math.pow(cornerFn(uc, P.peakL), .6) * sstep(-(Hl + .1), -(Hl + .006), V) * front;
      }
    }
    return pack(W);
  }
  function pack(W) { // 4 influências: maiores pesos + cabeça com o resto
    const list = W.map((w, i) => [i, w]).filter(a => a[1] > .002 && a[0] !== B.Head).sort((a, b) => b[1] - a[1]).slice(0, 3);
    let sum = list.reduce((s, a) => s + a[1], 0);
    if (sum > 1) { list.forEach(a => a[1] /= sum); sum = 1 }
    list.push([B.Head, 1 - sum]);
    while (list.length < 4) list.push([0, 0]);
    return list;
  }
  function skinAttributes(geo, fn) {
    const p = geo.attributes.position, n = p.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const L = fn(p.getX(i), p.getY(i), p.getZ(i), i); for (let k = 0; k < 4; k++) { si[i * 4 + k] = L[k][0]; sw[i * 4 + k] = L[k][1] } }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }

  // ---------- poses ----------
  const tmpQ = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  function apply(pose) {
    const p = { ...NEUTRAL, ...pose };
    for (const b of bones) if (b.userData.rest) { b.position.copy(b.userData.rest.p); b.quaternion.copy(b.userData.rest.q) }
    bones[B.Jaw].quaternion.multiply(tmpQ.setFromAxisAngle(X, clamp(p.jaw, -.1, 1.2) * .22));
    for (const side of ['L', 'R']) {
      const ei = eyeInfo[side]; if (!ei) continue;
      const s = side === 'L' ? -1 : 1, blink = clamp(side === 'L' ? p.blinkL : p.blinkR, 0, 1);
      const eb = bones[B['Eye_' + side]];
      eb.quaternion.multiply(tmpQ.setFromAxisAngle(Y, p.lookX * .45)).multiply(tmpQ.setFromAxisAngle(X, -p.lookY * .32));
      // pálpebras: o piscar domina; apertar/arregalar/olhar acompanham
      const open = 1 - blink, up = -p.wide * .35 * ei.hu / ei.e.Rl + p.squint * .22 * ei.closeU - p.lookY * .18;
      const lo = p.wide * .3 * ei.hl / ei.e.Rl - p.squint * .55 * ei.closeL - p.lookY * .1 - Math.max(p.smile + (s < 0 ? p.smileL : p.smileR), 0) * .25 * ei.closeL;
      const aU = blink * ei.closeU + open * up, aL = -blink * ei.closeL + open * lo;
      bones[B['LidUp_' + side]].quaternion.multiply(tmpQ.setFromAxisAngle(X, aU));
      bones[B['LidLo_' + side]].quaternion.multiply(tmpQ.setFromAxisAngle(X, aL));
      const br = bones[B['Brow_' + side]];
      br.position.y += p.browRaise * .045 - Math.max(p.browAngry, 0) * .022;
      br.quaternion.multiply(tmpQ.setFromAxisAngle(Z, s * p.browAngry * .42));
      const sm = p.smile + (s < 0 ? p.smileL : p.smileR), mc = bones[B['MouthCorner_' + side]];
      mc.position.x += s * (sm > 0 ? sm * .028 : sm * -.004); mc.position.y += sm > 0 ? sm * .042 : sm * .036; mc.position.z -= Math.abs(sm) * .012;
    }
  }

  // ---------- clipes de animação (exportados no GLB) ----------
  function makeClips() {
    const fps = 24, mk = (name, dur, poseAt) => {
      const times = [], vals = bones.map(() => ({ q: [], p: [] }));
      for (let f = 0; f <= Math.round(dur * fps); f++) {
        const t = f / fps; times.push(t); apply(poseAt(t));
        bones.forEach((b, i) => { vals[i].q.push(...b.quaternion.toArray()); vals[i].p.push(...b.position.toArray()) });
      }
      apply({});
      const tracks = [];
      bones.forEach((b, i) => { if (i === B.Head) return; tracks.push(new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', times, vals[i].q)); tracks.push(new THREE.VectorKeyframeTrack(b.name + '.position', times, vals[i].p)) });
      return new THREE.AnimationClip(name, dur, tracks);
    };
    const pulse = (t, a, b) => sstep(a, a + (b - a) * .35, t) * (1 - sstep(a + (b - a) * .65, b, t));
    const hold = (pose, dur = 1.2) => t => { const k = sstep(0, .3, t) * (1 - sstep(dur - .3, dur, t)); return Object.fromEntries(Object.entries(pose).map(([k2, v]) => [k2, v * k])) };
    return [
      mk('Blink', .3, t => { const b = pulse(t, 0, .3); return { blinkL: b, blinkR: b } }),
      mk('Wink_R', .6, t => { const b = pulse(t, 0, .6); return { blinkR: b, smileR: b * .8, squint: b * .2 } }),
      mk('Talk', 2.4, t => ({ jaw: Math.max(0, .35 * Math.abs(Math.sin(t * 9.1)) * (.6 + .4 * Math.sin(t * 2.3)) + .08 * Math.sin(t * 17)), smile: .1 * Math.sin(t * 1.7), browRaise: .15 * Math.max(0, Math.sin(t * 2.6)) })),
      mk('LookAround', 3, t => ({ lookX: Math.sin(t * Math.PI * 2 / 3) * .8, lookY: Math.sin(t * Math.PI * 4 / 3) * .3, blinkL: pulse(t, 1.4, 1.65), blinkR: pulse(t, 1.4, 1.65) })),
      ...Object.entries(EXPRESSIONS).filter(([k]) => k !== 'neutro').map(([k, v]) => mk('Expr_' + k, 1.2, hold(v)))
    ];
  }

  return { bones, root: head, weights, skinAttributes, apply, makeClips, B, eyeInfo, kind: 'bones' };
}
